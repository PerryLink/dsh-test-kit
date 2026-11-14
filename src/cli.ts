/**
 * `dsh-test-kit` — standalone install-and-smoke test drives for DeepSeek
 * Harness plugins, usable from any CI without a running DSH instance.
 *
 * Two commands:
 *   run <target>   drive one target through install → patch check → boot smoke
 *                  → uninstall → cleanup in a throwaway DSH_HOME and write the
 *                  frozen `dsh-test-drive/v1` JSON record.
 *   render         validate a settled record and emit the Markdown + JUnit pair.
 *
 * The engine is the extracted `dsh-test-drive` pipeline; the only DSH-shaped
 * seam is the local subprocess adapter (`./subprocess.ts`), so this CLI starts
 * with plain Node and never imports `@deepseek-ai/*` at runtime.
 *
 * @module dsh-test-kit/cli
 */

import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveConfig, type ConfigInput } from './core/config.ts'
import { DshDriver, parseNpmShim } from './core/driver.ts'
import { DriveRunner } from './core/drive.ts'
import {
  renderDriveJUnitXml,
  renderDriveResult,
  renderMatrix,
  renderMatrixJUnitXml,
} from './core/report.ts'
import {
  DriveResultSchema,
  MatrixRecordSchema,
  RESULT_SCHEMA,
  totalsOf,
  verdictOf,
  type DriveResult,
  type DriveVerdict,
} from './core/result.ts'
import { TempWorkspaceRegistry } from './core/workspace.ts'
import { VERSION as ENGINE_VERSION } from './core/version.ts'
import { createNodeSubprocessService, executableExists, npmExecArgv } from './subprocess.ts'

/** The kit's own package version (recorded as `run.pluginVersion`). */
export const KIT_VERSION: string = (() => {
  try {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version?: unknown }
    return typeof manifest.version === 'string' ? manifest.version : '0.0.0'
  } catch {
    return '0.0.0'
  }
})()

/** Exit codes: verdict-mapped for `run`, sysexits-style for failures. */
export const EXIT = {
  pass: 0,
  fail: 1,
  partial: 2,
  unknown: 3,
  usage: 64,
  badInput: 65,
  software: 70,
} as const

/** A user-facing usage error (exit 64). */
class UsageError extends Error {}

/** A malformed result file (exit 65). */
class InputError extends Error {}

/** Write one line to stderr (never cargo-cults stdout for diagnostics). */
function note(line: string): void {
  process.stderr.write(`${line}\n`)
}

/** The verdict-to-exit mapping shared by `run`. */
export function exitCodeFor(verdict: DriveVerdict, noFail: boolean): number {
  if (noFail) return 0
  return EXIT[verdict]
}

/** Split `--key=value` / `--key value` arguments. */
function argValue(argv: string[], index: number, name: string): { value: string; next: number } {
  const token = argv[index]
  if (token === undefined) throw new UsageError(`missing value for ${name}`)
  if (token.startsWith(`${name}=`)) return { value: token.slice(name.length + 1), next: index + 1 }
  const value = argv[index + 1]
  if (value === undefined || value.startsWith('--')) throw new UsageError(`missing value for ${name}`)
  return { value, next: index + 2 }
}

interface RunOptions {
  target: string
  headlessTask: string | undefined
  noSmoke: boolean
  dsh: string | undefined
  json: string
  profileName: string | undefined
  timeout: number | undefined
  installTimeout: number | undefined
  configTimeout: number | undefined
  smokeTimeout: number | undefined
  uninstallTimeout: number | undefined
  forwardEnv: string[]
  keepTempDirs: boolean
  noFail: boolean
  capability:
    | { kind: 'tool'; name: string; args: string; expect: string }
    | { kind: 'command'; name: string; args: string; expect: string }
    | undefined
}

/** Parse `run` arguments. */
function parseRun(argv: string[]): RunOptions {
  let target: string | undefined
  let headlessTask: string | undefined
  let dsh: string | undefined
  let json = join(process.cwd(), 'dsh-test-kit-result.json')
  let profileName: string | undefined
  let timeout: number | undefined
  let installTimeout: number | undefined
  let configTimeout: number | undefined
  let smokeTimeout: number | undefined
  let uninstallTimeout: number | undefined
  const forwardEnv: string[] = []
  let keepTempDirs = false
  let noSmoke = false
  let noFail = false
  let capKind: 'tool' | 'command' | undefined
  let capName = ''
  let capArgs = ''
  let capExpect = ''

  const number = (raw: string, name: string): number => {
    const value = Number(raw)
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) throw new UsageError(`${name} must be a positive integer (got ${JSON.stringify(raw)})`)
    return value
  }

  for (let i = 0; i < argv.length;) {
    const token = argv[i]
    if (token === undefined) break
    if (!token.startsWith('--')) {
      if (target !== undefined) throw new UsageError(`unexpected extra target ${JSON.stringify(token)} (v0.1 drives one target per invocation)`)
      target = token
      i += 1
      continue
    }
    const name = token.includes('=') ? token.slice(0, token.indexOf('=')) : token
    switch (name) {
      case '--headless-task': {
        const parsed = argValue(argv, i, name)
        headlessTask = parsed.value
        i = parsed.next
        break
      }
      case '--dsh': {
        const parsed = argValue(argv, i, name)
        dsh = parsed.value
        i = parsed.next
        break
      }
      case '--json': {
        const parsed = argValue(argv, i, name)
        json = parsed.value
        i = parsed.next
        break
      }
      case '--profile': {
        const parsed = argValue(argv, i, name)
        profileName = parsed.value
        i = parsed.next
        break
      }
      case '--timeout': {
        const parsed = argValue(argv, i, name)
        timeout = number(parsed.value, name)
        i = parsed.next
        break
      }
      case '--install-timeout': {
        const parsed = argValue(argv, i, name)
        installTimeout = number(parsed.value, name)
        i = parsed.next
        break
      }
      case '--config-timeout': {
        const parsed = argValue(argv, i, name)
        configTimeout = number(parsed.value, name)
        i = parsed.next
        break
      }
      case '--smoke-timeout': {
        const parsed = argValue(argv, i, name)
        smokeTimeout = number(parsed.value, name)
        i = parsed.next
        break
      }
      case '--uninstall-timeout': {
        const parsed = argValue(argv, i, name)
        uninstallTimeout = number(parsed.value, name)
        i = parsed.next
        break
      }
      case '--forward-env': {
        const parsed = argValue(argv, i, name)
        forwardEnv.push(parsed.value)
        i = parsed.next
        break
      }
      case '--capability-kind': {
        const parsed = argValue(argv, i, name)
        if (parsed.value !== 'tool' && parsed.value !== 'command') throw new UsageError('--capability-kind must be tool or command')
        capKind = parsed.value
        i = parsed.next
        break
      }
      case '--capability-name': {
        const parsed = argValue(argv, i, name)
        capName = parsed.value
        i = parsed.next
        break
      }
      case '--capability-args': {
        const parsed = argValue(argv, i, name)
        capArgs = parsed.value
        i = parsed.next
        break
      }
      case '--capability-expect': {
        const parsed = argValue(argv, i, name)
        capExpect = parsed.value
        i = parsed.next
        break
      }
      case '--keep-temp': {
        keepTempDirs = true
        i += 1
        break
      }
      case '--no-smoke': {
        noSmoke = true
        i += 1
        break
      }
      case '--no-fail': {
        noFail = true
        i += 1
        break
      }
      default:
        throw new UsageError(`unknown option ${JSON.stringify(name)} (see dsh-test-kit run --help)`)
    }
  }

  if (target === undefined || target.length === 0) throw new UsageError('run needs a target: github:owner/repo#sha, git+https://..., npm:name, a local path, or a .tgz')
  const capability = capKind === undefined && capName === '' ? undefined : { kind: capKind ?? 'tool' as const, name: capName, args: capArgs, expect: capExpect }
  return {
    target,
    headlessTask,
    noSmoke,
    dsh,
    json,
    profileName,
    timeout,
    installTimeout,
    configTimeout,
    smokeTimeout,
    uninstallTimeout,
    forwardEnv,
    keepTempDirs,
    noFail,
    capability,
  }
}

/** Resolve `--dsh` into a driver location: path, argv prefix, or PATH name. */
async function resolveDsh(value: string | undefined): Promise<{ dshBin?: string; dshArgv?: string[] }> {
  const raw = value !== undefined && value !== '' ? value : (process.env.DSH_BIN ?? '')
  if (raw === '' || raw === 'dsh') return {}
  if (raw.startsWith('npm:')) return { dshArgv: npmExecArgv(raw.slice('npm:'.length)) }
  // A bare npm spec such as `@deepseek-ai/dsh@0.2.2-rc.3` or `dsh@1.2.3`.
  if (!raw.includes('/') && !raw.includes('\\') && /^(@[^/]+\/)?[^@/]+@[^@/]+$/u.test(raw)) return { dshArgv: npmExecArgv(raw) }
  const absolute = isAbsolute(raw) ? raw : resolve(raw)
  if (!executableExists(absolute)) throw new UsageError(`--dsh ${JSON.stringify(raw)} does not resolve to a file (${absolute})`)
  if (process.platform === 'win32' && /\.(?:cmd|bat)$/iu.test(absolute)) {
    const shim = parseNpmShim(absolute, readFileSync(absolute, 'utf8'))
    if (!executableExists(shim)) throw new UsageError(`--dsh shim ${absolute} points at a missing JS entry (${shim})`)
    return { dshArgv: [process.execPath, shim] }
  }
  if (process.platform === 'win32' && /\.ps1$/iu.test(absolute)) {
    throw new UsageError(`--dsh ${absolute} is a PowerShell shim; pass the .cmd shim or the JS entry`)
  }
  return { dshBin: absolute }
}

/** Build the resolved engine config from run options. */
function buildConfig(options: RunOptions, dsh: { dshBin?: string }): ReturnType<typeof resolveConfig> {
  const input: ConfigInput = {}
  if (dsh.dshBin !== undefined) input.dshBin = dsh.dshBin
  if (options.profileName !== undefined) input.profileName = options.profileName
  if (options.noSmoke) input.headlessTask = ''
  else if (options.headlessTask !== undefined) input.headlessTask = options.headlessTask
  if (options.forwardEnv.length > 0) input.forwardEnv = options.forwardEnv
  if (options.keepTempDirs) input.keepTempDirs = true
  if (options.timeout !== undefined) {
    input.installTimeoutMs = options.timeout
    input.configTimeoutMs = options.timeout
    input.smokeTimeoutMs = options.timeout
    input.uninstallTimeoutMs = options.timeout
  }
  if (options.installTimeout !== undefined) input.installTimeoutMs = options.installTimeout
  if (options.configTimeout !== undefined) input.configTimeoutMs = options.configTimeout
  if (options.smokeTimeout !== undefined) input.smokeTimeoutMs = options.smokeTimeout
  if (options.uninstallTimeout !== undefined) input.uninstallTimeoutMs = options.uninstallTimeout
  if (options.capability !== undefined) {
    input.capability = { enabled: true, kind: options.capability.kind, name: options.capability.name, args: options.capability.args, expect: options.capability.expect }
  }
  return resolveConfig(input)
}

/** Human summary of one settled drive (stderr only). */
function printSummary(result: DriveResult, jsonPath: string): void {
  const { stages } = result
  const stage = (name: string, status: string): string => `${name}=${status}`
  note(`dsh-test-kit: ${result.target.spec} (${result.target.kind})`)
  note(`  verdict: ${result.verdict} — ${result.verdictReason}`)
  note(`  stages: ${[
    stage('install', stages.install.status),
    stage('config', stages.config.status),
    stage('smoke', stages.smoke.status),
    stage('uninstall', stages.uninstall.status),
    stage('cleanup', stages.cleanup.status),
  ].join(' ')}`)
  if (jsonPath !== '-') note(`  result: ${jsonPath}`)
}

/** `run` implementation. */
async function commandRun(argv: string[]): Promise<number> {
  const options = parseRun(argv)
  const dsh = await resolveDsh(options.dsh)
  const config = buildConfig(options, dsh)
  const log = (line: string): void => note(`[dsh-test-kit] ${line}`)
  const controller = new AbortController()
  const onSignal = (): void => controller.abort()
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)

  const temp = new TempWorkspaceRegistry(log)
  const driver = new DshDriver({
    subprocess: createNodeSubprocessService(),
    ...dsh.dshArgv === undefined ? {} : { dshArgv: dsh.dshArgv },
    config,
    log,
  })
  const runner = new DriveRunner({
    config,
    driver,
    temp,
    log,
    // The CLI's durable output is the JSON file; the storage domain is a no-op.
    domain: async () => ({ table: () => ({ put: async () => {} }) }),
    producerVersion: KIT_VERSION,
  })

  try {
    const result = await runner.drive(options.target, {
      signal: controller.signal,
      ...options.headlessTask === undefined ? {} : { headlessTask: options.headlessTask },
      ...options.noSmoke ? { headlessTask: '' } : {},
      cwd: process.cwd(),
    })
    // Validate exactly what we are about to write: a frozen-schema record.
    const validated = DriveResultSchema.parse(result)
    if (options.json === '-') {
      process.stdout.write(`${JSON.stringify(validated, null, 2)}\n`)
      printSummary(validated, '-')
    } else {
      const jsonPath = isAbsolute(options.json) ? options.json : resolve(process.cwd(), options.json)
      mkdirSync(dirname(jsonPath), { recursive: true })
      writeFileSync(jsonPath, `${JSON.stringify(validated, null, 2)}\n`, 'utf8')
      process.stdout.write(`${JSON.stringify({
        schema: RESULT_SCHEMA,
        runId: validated.run.runId,
        target: validated.target.spec,
        kind: validated.target.kind,
        verdict: validated.verdict,
        verdictReason: validated.verdictReason,
        json: jsonPath,
      })}\n`)
      printSummary(validated, jsonPath)
    }
    return exitCodeFor(validated.verdict, options.noFail)
  } finally {
    process.removeListener('SIGINT', onSignal)
    process.removeListener('SIGTERM', onSignal)
    await temp.disposeAll().catch(() => { /* best effort; the drive already cleaned up */ })
  }
}

interface RenderOptions {
  input: string
  outDir: string
}

/** Parse `render` arguments. */
function parseRender(argv: string[]): RenderOptions {
  let input: string | undefined
  let outDir = 'reports'
  for (let i = 0; i < argv.length;) {
    const token = argv[i]
    if (token === undefined) break
    if (token === '--input' || token.startsWith('--input=')) {
      const parsed = argValue(argv, i, '--input')
      input = parsed.value
      i = parsed.next
    } else if (token === '--out-dir' || token.startsWith('--out-dir=')) {
      const parsed = argValue(argv, i, '--out-dir')
      outDir = parsed.value
      i = parsed.next
    } else if (token.startsWith('--')) {
      throw new UsageError(`unknown option ${JSON.stringify(token)} (see dsh-test-kit render --help)`)
    } else {
      if (input !== undefined) throw new UsageError('render accepts exactly one --input')
      input = token
      i += 1
    }
  }
  if (input === undefined || input.length === 0) throw new UsageError('render needs --input <result.json>')
  return { input, outDir }
}

/** `render` implementation: validate then serialize the report pair. */
async function commandRender(argv: string[]): Promise<number> {
  const options = parseRender(argv)
  const inputPath = isAbsolute(options.input) ? options.input : resolve(process.cwd(), options.input)
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(inputPath, 'utf8'))
  } catch (error) {
    throw new InputError(`cannot read ${inputPath}: ${String(error)}`)
  }

  let markdown: string
  let junit: string
  let verdict: DriveVerdict
  let kind: 'drive' | 'matrix'
  let exitCode: number = EXIT.pass
  const drive = DriveResultSchema.safeParse(raw)
  if (drive.success) {
    kind = 'drive'
    // A stored `verdict: pass` must never outrank the stage evidence. A
    // hand-edited, truncated, or buggy record can claim pass while its own
    // install/smoke/... stage says fail; rendering that as a green report and
    // exiting 0 was a real verifier finding (P2). Re-fold the verdict from the
    // stages and refuse to publish a pass the record itself contradicts.
    const failed = failedStageNames(drive.data)
    const [stageVerdict, stageReason] = verdictOf(drive.data)
    let settled = drive.data
    if (drive.data.verdict === 'pass' && (failed.length > 0 || stageVerdict !== 'pass')) {
      const effectiveVerdict: DriveVerdict = stageVerdict === 'pass' ? 'fail' : stageVerdict
      settled = {
        ...drive.data,
        verdict: effectiveVerdict,
        verdictReason: `record claimed pass, but the stages say ${effectiveVerdict}`
          + (failed.length > 0 ? ` (failed stage${failed.length === 1 ? '' : 's'}: ${failed.join(', ')})` : '')
          + `: ${stageReason}`,
      }
      exitCode = failed.length > 0 ? EXIT.fail : exitCodeFor(stageVerdict, false)
      note(`dsh-test-kit: record verdict "pass" contradicts its stages (${failed.join(', ') || stageReason}); rendering ${effectiveVerdict} and exiting ${exitCode}`)
    }
    markdown = renderDriveResult(settled)
    junit = renderDriveJUnitXml(settled)
    verdict = settled.verdict
  } else {
    const matrix = MatrixRecordSchema.safeParse(raw)
    if (!matrix.success) {
      throw new InputError(
        `not a ${RESULT_SCHEMA} record: expected a drive result or a batch matrix; refusing to render placeholder JSON\n`
        + `  drive: ${drive.error.issues.map(issue => `${issue.path.join('.') || '<root>'}: ${issue.message}`).slice(0, 4).join('; ')}\n`
        + `  matrix: ${matrix.error.issues.map(issue => `${issue.path.join('.') || '<root>'}: ${issue.message}`).slice(0, 4).join('; ')}`,
      )
    }
    kind = 'matrix'
    const totals = totalsOf(matrix.data.rows)
    markdown = renderMatrix(matrix.data)
    junit = renderMatrixJUnitXml(matrix.data)
    // An empty matrix verified nothing. Never fold it to `pass` just because
    // every tally is zero (that was a real verifier finding).
    verdict = matrix.data.rows.length === 0
      ? 'unknown'
      : totals.fail > 0
        ? 'fail'
        : totals.partial > 0
          ? 'partial'
          : totals.unknown > 0
            ? (totals.pass > 0 ? 'partial' : 'unknown')
            : 'pass'
  }

  const outDir = isAbsolute(options.outDir) ? options.outDir : resolve(process.cwd(), options.outDir)
  mkdirSync(outDir, { recursive: true })
  const stem = basename(inputPath).replace(/\.json$/iu, '').replace(/[^\w.-]+/gu, '-') || 'report'
  const markdownPath = join(outDir, `${stem}.md`)
  const junitPath = join(outDir, `${stem}.junit.xml`)
  writeFileSync(markdownPath, markdown, 'utf8')
  writeFileSync(junitPath, junit, 'utf8')
  process.stdout.write(`${JSON.stringify({ schema: RESULT_SCHEMA, kind, verdict, markdown: markdownPath, junit: junitPath })}\n`)
  note(`dsh-test-kit: rendered ${kind} (${verdict}) → ${markdownPath} + ${junitPath}`)
  return exitCode
}

/** Stage names whose own outcome is a hard `fail` (used to reject a green render). */
function failedStageNames(result: DriveResult): string[] {
  const { install, config, smoke, uninstall, cleanup, capability } = result.stages
  const failed: string[] = []
  if (install.status === 'fail') failed.push('install')
  if (config.status === 'fail') failed.push('config')
  if (smoke.status === 'fail') failed.push('smoke')
  if (capability !== undefined && (capability.status === 'failed' || capability.status === 'not-registered')) failed.push('capability')
  if (uninstall.status === 'fail') failed.push('uninstall')
  if (cleanup.status === 'fail') failed.push('cleanup')
  return failed
}

/** Help text. */
const HELP = `dsh-test-kit ${KIT_VERSION} (engine ${ENGINE_VERSION})

Run an isolated install-and-smoke test drive for a DeepSeek Harness plugin
target and emit a frozen-schema JSON record plus Markdown/JUnit CI reports.
The drive uses a throwaway DSH_HOME; the host profile is never read or written.

USAGE
  dsh-test-kit run <target> [options]
  dsh-test-kit render --input <result.json> [--out-dir <dir>]
  dsh-test-kit --version

TARGETS
  github:owner/repo#<sha>       GitHub source (pnpm/dsh resolves the ref)
  git+https://host/repo.git#ref git source
  npm:<name>[@<version>]        registry package
  ./path or /abs/path           local plugin checkout
  ./plugin.tgz                  packed tarball

RUN OPTIONS
  --headless-task <text>        one-shot boot-smoke task (empty string = skip)
  --no-smoke                    skip the boot-smoke stage
  --dsh <spec>                  dsh executable path, bare command, or npm:pkg@ver
                                (default: DSH_BIN or "dsh" on PATH)
  --json <path|->               record path (default ./dsh-test-kit-result.json;
                                "-" writes the full record to stdout)
  --profile <name>              throwaway profile template (default headless)
  --timeout <ms>                set every stage timeout
  --install-timeout <ms>        install stage timeout
  --config-timeout <ms>         --dump-config stage timeout
  --smoke-timeout <ms>          boot-smoke stage timeout
  --uninstall-timeout <ms>      uninstall stage timeout
  --forward-env <NAME>          forward one env var into the throwaway profile
                                (repeatable; nothing is forwarded by default)
  --capability-kind <tool|command>
  --capability-name <name>      prove a named capability is registered + invoked
  --capability-args <text>
  --capability-expect <text>
  --keep-temp                   keep the temp workspace on failure
  --no-fail                     exit 0 even when the verdict is fail/partial/unknown

EXIT CODES
  run:    0 pass · 1 fail · 2 partial · 3 unknown · 64 usage · 70 internal
  render: 0 reports written from a consistent record · 1 pass claim contradicted by a failed stage · 2/3 other contradictions · 64 usage · 65 input is not a dsh-test-drive/v1 record

The JSON schema is frozen: schema "dsh-test-drive/v1". Output is sanitized
(tokens, URL credentials, bearer headers, temp paths) before it reaches a report.
`

/** Entrypoint: dispatch and map errors to exit codes. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command, ...rest] = argv
  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(HELP)
    return command === undefined ? EXIT.usage : EXIT.pass
  }
  if (command === '--version' || command === '-v') {
    process.stdout.write(`${KIT_VERSION}\n`)
    return EXIT.pass
  }
  try {
    if (command === 'run') {
      if (rest.includes('--help') || rest.includes('-h')) {
        process.stdout.write(HELP)
        return EXIT.pass
      }
      return await commandRun(rest)
    }
    if (command === 'render') {
      if (rest.includes('--help') || rest.includes('-h')) {
        process.stdout.write(HELP)
        return EXIT.pass
      }
      return await commandRender(rest)
    }
    throw new UsageError(`unknown command ${JSON.stringify(command)} (expected run or render)`)
  } catch (error) {
    if (error instanceof UsageError) {
      note(`dsh-test-kit: ${error.message}`)
      return EXIT.usage
    }
    if (error instanceof InputError) {
      note(`dsh-test-kit: ${error.message}`)
      return EXIT.badInput
    }
    note(`dsh-test-kit: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
    return EXIT.software
  }
}

/** Whether this module is the process entrypoint (symlink-safe for npm bins). */
function invokedDirectly(): boolean {
  const entry = process.argv[1]
  if (entry === undefined) return false
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return resolve(entry) === fileURLToPath(import.meta.url)
  }
}

// Run when executed as a bin, not when imported by tests/library consumers.
if (invokedDirectly()) {
  const code = await main()
  process.exitCode = code
}

// Library surface: importing `dsh-test-kit` must not run the CLI (the
// direct-invocation guard above stays false), while CI code gets the frozen
// schema and the report renderers without spawning a process.
export {
  renderDriveJUnitXml,
  renderDriveResult,
  renderMatrix,
  renderMatrixJUnitXml,
  formatDuration,
  statusMark,
} from './core/report.ts'
export {
  DriveResultSchema,
  MatrixRecordSchema,
  verdictOf,
  totalsOf,
} from './core/result.ts'
export type {
  CapabilityStageResult,
  CleanupStageResult,
  ConfigStageResult,
  DriveResult,
  DriveVerdict,
  InstallStageResult,
  MatrixRecord,
  MatrixRow,
  RunMeta,
  SmokeStageResult,
  StageResult,
  StageStatus,
  UninstallStageResult,
} from './core/result.ts'
export { classifyTarget, isGitLike } from './core/driver.ts'
export { sanitizeOutput, sanitizeTarget, redactSecrets } from './core/sanitize.ts'
