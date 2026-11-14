/**
 * Local subprocess adapter for the standalone `dsh-test-kit` CLI.
 *
 * The drive engine was written against the DSH `ctx.subprocess` service. This
 * module implements the same structural seam with `node:child_process`, so the
 * CLI can run **outside** DSH with no `@deepseek-ai/*` runtime dependency. It is
 * the only file in the kit that spawns processes directly; the engine and the
 * plugin keep their argv-only, no-shell contract.
 *
 * Semantics mirrored from `@deepseek-ai/dsh-subprocess-local`:
 * - the child env is the parent env minus credential-shaped names and all
 *   `DSH_*` names, with the explicit spec env merged afterwards;
 * - collected output keeps the tail, reports lossiness, and never blocks;
 * - abort starts a graceful terminate and escalates to SIGKILL after the
 *   requested grace period (on Windows the whole process tree is killed with
 *   `taskkill /T`).
 *
 * @module dsh-test-kit/subprocess
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { accessSync, constants, statSync } from 'node:fs'
import { dirname, isAbsolute, join, posix, win32 } from 'node:path'
import type {
  DriverCollectedRead,
  DriverCollectSpec,
  DriverSpawnSpec,
  DriverSubprocessHandle,
  DriverSubprocessService,
} from './core/driver.ts'

/** Environment names that are never forwarded to a child unless named explicitly. */
export const SENSITIVE_ENV_PATTERN = /KEY|PASSWORD|SECRET|TOKEN/iu

/** Default grace period before SIGKILL when a stage is aborted. */
export const DEFAULT_TERMINATE_GRACE_MS = 5_000

/**
 * The ambient parent environment minus credential-shaped names and `DSH_*`.
 * Explicit `spec.env` entries merge after this scrub, so a deliberately
 * forwarded credential survives while an inherited one does not.
 *
 * @param env - parent environment (defaults to `process.env`).
 * @returns a fresh, scrubbed environment object.
 */
export function scrubbedParentEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) continue
    if (SENSITIVE_ENV_PATTERN.test(name)) continue
    if (name.toUpperCase().startsWith('DSH_')) continue
    out[name] = value
  }
  return out
}

/** Whether a path is an existing regular file. */
function isFile(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

/**
 * Pure PATH/PATHEXT candidate expansion, shared by the real resolver and the
 * cross-platform unit tests. A command that already carries a separator is
 * returned as-is (the caller decides whether that is legal).
 *
 * @param command - bare name or path.
 * @param env - environment whose PATH/PATHEXT is consulted.
 * @param platform - target platform (`process.platform` by default).
 * @returns candidate absolute paths, in lookup order.
 */
export function executableCandidates(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string[] {
  const win = platform === 'win32'
  const pathApi = win ? win32 : posix
  const hasSeparator = command.includes('/') || command.includes('\\')
  if (isAbsolute(command) || hasSeparator) return [command]
  const searchPath = env.PATH ?? env.Path ?? ''
  const extensions = win ? (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(ext => ext.length > 0) : ['']
  const directories = searchPath.split(win ? ';' : ':').filter(dir => dir.length > 0)
  const candidates: string[] = []
  for (const directory of directories) {
    for (const extension of extensions) candidates.push(pathApi.join(directory, `${command}${extension}`))
  }
  return candidates
}

/**
 * Resolve a bare command name against PATH (PATHEXT on Windows), or verify an
 * absolute/relative path. Mirrors the DSH service contract: relative paths with
 * separators are rejected because the resolution base would be ambiguous.
 *
 * @param command - absolute path or bare executable name.
 * @param env - environment whose PATH/PATHEXT is consulted.
 * @returns the resolved absolute path.
 */
export async function resolveExecutable(command: string, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  if (command.length === 0) throw new Error('dsh-test-kit: empty executable name')
  const hasSeparator = command.includes('/') || command.includes('\\')
  if (isAbsolute(command)) {
    if (!isFile(command)) throw new Error(`dsh-test-kit: executable not found at ${command}`)
    return command
  }
  if (hasSeparator) throw new Error(`dsh-test-kit: relative executable paths are not supported (got ${JSON.stringify(command)}); use an absolute path or a bare PATH name`)
  for (const candidate of executableCandidates(command, env, process.platform)) {
    if (!isFile(candidate)) continue
    try {
      accessSync(candidate, process.platform === 'win32' ? constants.F_OK : constants.X_OK)
    } catch {
      continue
    }
    return candidate
  }
  throw new Error(`dsh-test-kit: executable "${command}" was not found on PATH`)
}

/** Tail-bounded collector with offset reads (only offset 0 is used by the engine). */
class TailCollector {
  private chunks: Buffer[] = []
  private bytes = 0
  private dropped = 0

  constructor(private readonly maxBytes: number) {}

  push(chunk: Buffer): void {
    this.chunks.push(chunk)
    this.bytes += chunk.length
    while (this.bytes > this.maxBytes && this.chunks.length > 1) {
      const head = this.chunks.shift()
      if (head === undefined) break
      this.bytes -= head.length
      this.dropped += head.length
    }
    if (this.bytes > this.maxBytes) {
      const only = this.chunks[0]
      if (only !== undefined && only.length > this.maxBytes) {
        this.dropped += only.length - this.maxBytes
        this.chunks[0] = only.subarray(only.length - this.maxBytes)
        this.bytes = this.maxBytes
      }
    }
  }

  read(): DriverCollectedRead {
    return { text: Buffer.concat(this.chunks).toString('utf8'), lossy: this.dropped > 0 }
  }
}

/** Kill a child tree. POSIX uses the process group; Windows uses taskkill /T. */
function terminateTree(child: ChildProcess, signal: NodeJS.Signals): void {
  const pid = child.pid
  if (pid === undefined) return
  if (process.platform === 'win32') {
    // dsh spawns pnpm which spawns lifecycle scripts: kill the whole tree.
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    return
  }
  try {
    process.kill(-pid, signal)
  } catch {
    try { child.kill(signal) } catch { /* already gone */ }
  }
}

/** One live child with the collected readers the engine expects. */
class NodeSubprocessHandle implements DriverSubprocessHandle {
  readonly done: Promise<{ exitCode: number | null }>
  readonly collected: {
    stdout: { readFrom(offset: number): DriverCollectedRead }
    stderr: { readFrom(offset: number): DriverCollectedRead }
  }

  constructor(child: ChildProcess, stdoutMax: number, stderrMax: number) {
    const stdout = new TailCollector(stdoutMax)
    const stderr = new TailCollector(stderrMax)
    child.stdout?.on('data', (chunk: Buffer) => stdout.push(chunk))
    child.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk))
    this.collected = {
      stdout: { readFrom: () => stdout.read() },
      stderr: { readFrom: () => stderr.read() },
    }
    this.done = new Promise((resolveDone, rejectDone) => {
      child.once('error', rejectDone)
      child.once('close', (code) => resolveDone({ exitCode: code }))
    })
  }
}

/** The local subprocess service handed to the engine by the CLI. */
export class NodeSubprocessService implements DriverSubprocessService {
  constructor(private readonly baseEnv: NodeJS.ProcessEnv = process.env) {}

  resolveExecutable(command: string): Promise<string> {
    return resolveExecutable(command, this.baseEnv)
  }

  spawn(spec: DriverSpawnSpec): DriverSubprocessHandle {
    const [program, ...args] = spec.argv
    if (program === undefined) throw new Error('dsh-test-kit: empty argv')
    if (process.platform === 'win32' && /\.(?:cmd|bat|ps1)$/iu.test(program)) {
      throw new Error(`dsh-test-kit: cannot spawn the Windows shim ${program} without a shell; pass the JS entry (node <path>) or install the CLI so a .exe/JS entry is resolved`)
    }
    const env = { ...scrubbedParentEnv(this.baseEnv), ...spec.env }
    const child = spawn(program, args, {
      cwd: spec.cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      // A new process group lets one abort terminate dsh's whole tree.
      detached: process.platform !== 'win32',
    })
    const handle = new NodeSubprocessHandle(child, spec.stdio.stdout.maxBytes, spec.stdio.stderr.maxBytes)
    const grace = spec.graceMs > 0 ? spec.graceMs : DEFAULT_TERMINATE_GRACE_MS
    let killTimer: NodeJS.Timeout | undefined
    const onAbort = (): void => {
      terminateTree(child, 'SIGTERM')
      killTimer = setTimeout(() => terminateTree(child, 'SIGKILL'), grace)
      killTimer.unref()
    }
    if (spec.signal !== undefined) {
      if (spec.signal.aborted) onAbort()
      else spec.signal.addEventListener('abort', onAbort, { once: true })
    }
    void handle.done.finally(() => {
      if (killTimer !== undefined) clearTimeout(killTimer)
      spec.signal?.removeEventListener('abort', onAbort)
    }).catch(() => { /* surfaced through handle.done */ })
    return handle
  }
}

/** Create the adapter used by the CLI. */
export function createNodeSubprocessService(): DriverSubprocessService {
  return new NodeSubprocessService()
}

/**
 * Build an `npm exec` argv prefix for a package spec that provides a `dsh`
 * bin (e.g. `npm:@deepseek-ai/dsh@0.2.2-rc.3`). Resolving npm's JS entry keeps
 * the spawn shell-free on Windows, where `.cmd` shims cannot be spawned
 * directly.
 *
 * @param packageSpec - the npm package spec that owns the `dsh` bin.
 * @returns the argv prefix to spawn.
 */
export function npmExecArgv(packageSpec: string): string[] {
  const candidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    process.platform === 'win32'
      ? join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js')
      : '/usr/lib/node_modules/npm/bin/npm-cli.js',
  ].filter((candidate): candidate is string => candidate !== undefined && candidate !== '' && isFile(candidate))
  const npm = candidates[0]
  if (npm === undefined) {
    // POSIX can spawn the npm shim directly; Windows cannot, so fail loudly.
    if (process.platform === 'win32') throw new Error('dsh-test-kit: cannot locate npm-cli.js for --dsh npm:<spec>; pass an absolute dsh path instead')
    return ['npm', 'exec', '--yes', '--package', packageSpec, '--', 'dsh']
  }
  return [process.execPath, npm, 'exec', '--yes', '--package', packageSpec, '--', 'dsh']
}

/**
 * Wait until a configured absolute path exists (used by `--dsh <path>`).
 * Kept separate from resolution so the CLI can fail with a usage error before
 * any temp workspace is created.
 *
 * @param path - candidate executable path.
 * @returns true when it is an existing file.
 */
export function executableExists(path: string): boolean {
  return isFile(path)
}

/** Re-export the collect spec type for callers building their own specs. */
export type { DriverCollectSpec }
