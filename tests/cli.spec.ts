/**
 * `dsh-test-kit` CLI contract: the frozen result schema, verdict folding,
 * report rendering, placeholder rejection, and a full run → render loop
 * through the REAL local subprocess adapter and a scripted `dsh` CLI.
 *
 * @module dsh-test-kit/test/cli
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EXIT, exitCodeFor, main } from '../src/cli.ts'
import { classifyTarget } from '../src/core/driver.ts'
import {
  DriveResultSchema,
  RESULT_SCHEMA,
  verdictOf,
  type DriveResult,
} from '../src/core/result.ts'

const FAKE_DSH = fileURLToPath(new URL('./fixtures/fake-dsh.mjs', import.meta.url))
const roots: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-test-kit-cli-'))
  roots.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true })
  delete process.env.FAKE_DSH_MODE
})

/** A minimal but schema-valid settled record (the fixture dsh-score/SaaS read). */
function sampleResult(overrides: { install?: 'pass' | 'fail' | 'skipped'; patch?: boolean; smoke?: 'pass' | 'skipped' | 'boot-ok' } = {}): DriveResult {
  const install = overrides.install ?? 'pass'
  const smoke = overrides.smoke ?? 'pass'
  const raw = {
    schema: RESULT_SCHEMA,
    run: {
      runId: 'tdr_0123456789abcdef01234567',
      startedAt: '2026-11-14T00:00:00.000Z',
      finishedAt: '2026-11-14T00:00:01.000Z',
      durationMs: 1_000,
      harnessVersion: '0.2.2-rc.3',
      pluginVersion: '0.1.0',
      platform: 'linux',
      node: 'v24.22.1',
    },
    target: { kind: 'npm', spec: 'dsh-example@1.0.0', resolved: { packageName: 'dsh-example', packageVersion: '1.0.0', hasBundleManifest: true } },
    isolation: { tempDshHome: true, tempWorkspace: true, tempStore: true, hostHomeTouched: false },
    stages: {
      install: { status: install, exitCode: install === 'pass' ? 0 : 1, durationMs: 10, attempts: 1, summary: 'install ok (exit 0)', outputTail: '', allowBuildsNeeded: false },
      config: { status: 'pass', exitCode: 0, durationMs: 5, attempts: 1, summary: 'dump ok (exit 0)', outputTail: '', patchEffective: overrides.patch ?? true, layers: ['dsh-example'] },
      smoke: { status: smoke, exitCode: smoke === 'pass' ? 0 : smoke === 'boot-ok' ? 1 : null, durationMs: 20, attempts: smoke === 'pass' ? 1 : 1, summary: smoke === 'pass' ? 'booted cleanly' : smoke === 'boot-ok' ? 'booted but the task did not complete' : 'boot smoke disabled by config (headlessTask is empty)', outputTail: '', bootFailed: false, taskCompleted: smoke === 'pass' },
      uninstall: { status: 'pass', exitCode: 0, durationMs: 5, attempts: 1, summary: 'remove ok (exit 0)', outputTail: '' },
      cleanup: { status: 'pass', quarantined: true, removed: true, summary: 'removed owned temp root' },
    },
    verdict: 'unknown',
    verdictReason: 'pending',
  } as const
  const parsed = DriveResultSchema.parse(raw)
  const [verdict, reason] = verdictOf(parsed)
  return { ...parsed, verdict, verdictReason: reason }
}

describe('frozen schema and verdicts', () => {
  it('keeps the schema string frozen at dsh-test-drive/v1', () => {
    expect(RESULT_SCHEMA).toBe('dsh-test-drive/v1')
  })

  it('folds stages into pass/fail/partial/unknown', () => {
    expect(verdictOf(sampleResult())[0]).toBe('pass')
    expect(verdictOf(sampleResult({ install: 'fail' }))[0]).toBe('fail')
    expect(verdictOf(sampleResult({ patch: false }))[0]).toBe('partial')
    expect(verdictOf(sampleResult({ smoke: 'skipped' }))[0]).toBe('pass')
    expect(verdictOf(sampleResult({ smoke: 'boot-ok' }))[0]).toBe('partial')
    const unknown = sampleResult()
    unknown.stages.install.status = 'skipped'
    expect(verdictOf(unknown)[0]).toBe('unknown')
  })

  it('maps verdicts to distinct non-zero exits unless --no-fail', () => {
    expect(exitCodeFor('pass', false)).toBe(EXIT.pass)
    expect(exitCodeFor('fail', false)).toBe(EXIT.fail)
    expect(exitCodeFor('partial', false)).toBe(EXIT.partial)
    expect(exitCodeFor('unknown', false)).toBe(EXIT.unknown)
    for (const verdict of ['pass', 'fail', 'partial', 'unknown'] as const) expect(exitCodeFor(verdict, true)).toBe(0)
  })

  it('classifies every supported target form', () => {
    expect(classifyTarget('github:owner/repo#0123456')).toBe('repo')
    expect(classifyTarget('git+https://github.com/owner/repo.git#main')).toBe('repo')
    expect(classifyTarget('npm:dsh-example@1.0.0')).toBe('npm')
    expect(classifyTarget('./plugin.tgz')).toBe('tarball')
    expect(classifyTarget('./plugin')).toBe('path')
    expect(classifyTarget('/opt/plugin')).toBe('path')
  })
})

describe('render', () => {
  it('writes Markdown and JUnit for a valid record', async () => {
    const dir = tempDir()
    const input = join(dir, 'result.json')
    const outDir = join(dir, 'reports')
    writeFileSync(input, JSON.stringify(sampleResult(), null, 2))
    await expect(main(['render', '--input', input, '--out-dir', outDir])).resolves.toBe(EXIT.pass)
    const markdown = readFileSync(join(outDir, 'result.md'), 'utf8')
    const junit = readFileSync(join(outDir, 'result.junit.xml'), 'utf8')
    expect(markdown).toContain('dsh-example')
    expect(markdown).toContain('pass')
    expect(junit).toContain('<testsuite')
    expect(junit).toContain('tests="5"')
  })

  it('exits non-zero and renders fail when a pass verdict contradicts failed stages', async () => {
    const dir = tempDir()
    const input = join(dir, 'lied.json')
    const outDir = join(dir, 'reports')
    const forged = sampleResult({ install: 'fail' })
    forged.verdict = 'pass'
    forged.verdictReason = 'everything is fine'
    writeFileSync(input, JSON.stringify(forged, null, 2))
    await expect(main(['render', '--input', input, '--out-dir', outDir])).resolves.toBe(EXIT.fail)
    const markdown = readFileSync(join(outDir, 'lied.md'), 'utf8')
    expect(markdown).toContain('- Verdict: ❌ fail')
    expect(markdown).toContain('record claimed pass')
    expect(markdown).not.toContain('- Verdict: ✅ pass')
  })

  it('maps a pass claim contradicted only by partial evidence to the partial exit code', async () => {
    const dir = tempDir()
    const input = join(dir, 'unpatched.json')
    const outDir = join(dir, 'reports')
    const forged = sampleResult({ patch: false })
    forged.verdict = 'pass'
    forged.verdictReason = 'everything is fine'
    writeFileSync(input, JSON.stringify(forged))
    await expect(main(['render', '--input', input, '--out-dir', outDir])).resolves.toBe(EXIT.partial)
    const markdown = readFileSync(join(outDir, 'unpatched.md'), 'utf8')
    expect(markdown).toContain('- Verdict: 🟠 partial')
    expect(markdown).not.toContain('- Verdict: ✅ pass')
  })

  it('refuses placeholder JSON instead of treating it as success', async () => {
    const dir = tempDir()
    const input = join(dir, 'placeholder.json')
    writeFileSync(input, JSON.stringify({ note: 'replace this step with your dsh result capture' }))
    await expect(main(['render', '--input', input, '--out-dir', join(dir, 'out')])).resolves.toBe(EXIT.badInput)
  })

  it('refuses a truncated record whose verdict was never settled', async () => {
    const dir = tempDir()
    const input = join(dir, 'truncated.json')
    const broken = sampleResult() as unknown as Record<string, unknown>
    delete broken.verdict
    writeFileSync(input, JSON.stringify(broken))
    await expect(main(['render', '--input', input, '--out-dir', join(dir, 'out')])).resolves.toBe(EXIT.badInput)
  })
})

describe('run through the local adapter', () => {
  it('drives a scripted dsh and settles a pass', async () => {
    const dir = tempDir()
    const json = join(dir, 'result.json')
    const code = await main(['run', 'npm:dsh-example@1.0.0', '--dsh', FAKE_DSH, '--json', json])
    expect(code).toBe(EXIT.pass)
    const result = DriveResultSchema.parse(JSON.parse(readFileSync(json, 'utf8')))
    expect(result.verdict).toBe('pass')
    expect(result.target).toMatchObject({ kind: 'npm', spec: 'dsh-example@1.0.0', resolved: { packageName: 'dsh-example', packageVersion: '1.0.0', hasBundleManifest: true } })
    expect(result.stages.install.status).toBe('pass')
    expect(result.stages.config.patchEffective).toBe(true)
    expect(result.stages.smoke.status).toBe('pass')
    expect(result.stages.uninstall.status).toBe('pass')
    expect(result.stages.cleanup).toMatchObject({ status: 'pass', quarantined: true, removed: true })
    expect(result.run.pluginVersion).toBe('0.1.0')
    expect(result.isolation.hostHomeTouched).toBe(false)
  })

  it('returns the verdict exit code and still writes the record on install failure', async () => {
    process.env.FAKE_DSH_MODE = 'fail-install'
    const dir = tempDir()
    const json = join(dir, 'failed.json')
    const code = await main([
      'run', 'npm:dsh-example@1.0.0',
      '--dsh', FAKE_DSH,
      '--json', json,
      '--forward-env', 'FAKE_DSH_MODE',
      '--no-smoke',
    ])
    expect(code).toBe(EXIT.fail)
    const result = DriveResultSchema.parse(JSON.parse(readFileSync(json, 'utf8')))
    expect(result.verdict).toBe('fail')
    expect(result.stages.install.status).toBe('fail')
    expect(result.stages.cleanup.status).toBe('pass')
    expect(result.stages.cleanup.removed).toBe(true)
  })

  it('honors --no-fail for CI steps that render afterwards', async () => {
    process.env.FAKE_DSH_MODE = 'fail-install'
    const dir = tempDir()
    const code = await main([
      'run', 'npm:dsh-example@1.0.0',
      '--dsh', FAKE_DSH,
      '--json', join(dir, 'failed.json'),
      '--forward-env', 'FAKE_DSH_MODE',
      '--no-smoke',
      '--no-fail',
    ])
    expect(code).toBe(EXIT.pass)
  })

  it('passes when the smoke stage is explicitly skipped by an empty task', async () => {
    const dir = tempDir()
    const json = join(dir, 'skipped.json')
    const code = await main(['run', 'npm:dsh-example@1.0.0', '--dsh', FAKE_DSH, '--json', json, '--no-smoke'])
    expect(code).toBe(EXIT.pass)
    const result = DriveResultSchema.parse(JSON.parse(readFileSync(json, 'utf8')))
    expect(result.verdict).toBe('pass')
    expect(result.verdictReason).toContain('skipped by config')
    expect(result.stages.smoke.status).toBe('skipped')
  })

  it('fails a real boot crash whose output says it cannot find a module', async () => {
    process.env.FAKE_DSH_MODE = 'crash-boot'
    const dir = tempDir()
    const json = join(dir, 'crash.json')
    const code = await main([
      'run', 'npm:dsh-example@1.0.0',
      '--dsh', FAKE_DSH,
      '--json', json,
      '--forward-env', 'FAKE_DSH_MODE',
    ])
    expect(code).toBe(EXIT.fail)
    const result = DriveResultSchema.parse(JSON.parse(readFileSync(json, 'utf8')))
    expect(result.verdict).toBe('fail')
    expect(result.stages.smoke.status).toBe('fail')
    expect(result.stages.smoke.bootFailed).toBe(true)
  })

  it('never passes a non-zero boot without loader markers (partial)', async () => {
    process.env.FAKE_DSH_MODE = 'nonzero-boot'
    const dir = tempDir()
    const json = join(dir, 'boot-ok.json')
    const code = await main([
      'run', 'npm:dsh-example@1.0.0',
      '--dsh', FAKE_DSH,
      '--json', json,
      '--forward-env', 'FAKE_DSH_MODE',
    ])
    expect(code).toBe(EXIT.partial)
    const result = DriveResultSchema.parse(JSON.parse(readFileSync(json, 'utf8')))
    expect(result.verdict).toBe('partial')
    expect(result.stages.smoke.status).toBe('boot-ok')
  })

  it('rejects an empty matrix as unknown instead of pass, with a failing JUnit case', async () => {
    const dir = tempDir()
    const input = join(dir, 'empty-matrix.json')
    const outDir = join(dir, 'empty-reports')
    const matrix = {
      schema: RESULT_SCHEMA,
      id: 'tdm_empty',
      createdAt: '2026-11-14T00:00:00.000Z',
      durationMs: 0,
      rows: [],
      totals: { total: 0, pass: 0, fail: 0, partial: 0, unknown: 0 },
    }
    writeFileSync(input, JSON.stringify(matrix))
    const writes: string[] = []
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
      writes.push(String(chunk))
      return true
    }) as never)
    try {
      await expect(main(['render', '--input', input, '--out-dir', outDir])).resolves.toBe(EXIT.pass)
    } finally {
      spy.mockRestore()
    }
    const summary = JSON.parse(writes.join('').trim().split('\n').at(-1) ?? '{}') as { verdict?: string }
    expect(summary.verdict).toBe('unknown')
    const junit = readFileSync(join(outDir, 'empty-matrix.junit.xml'), 'utf8')
    expect(junit).toContain('failures="1"')
    expect(junit).toContain('name="empty-matrix"')
    const markdown = readFileSync(join(outDir, 'empty-matrix.md'), 'utf8')
    expect(markdown).toContain('matrix has no rows')
  })

  it('fails with a usage error before touching a temp workspace when --dsh is missing', async () => {
    const code = await main(['run', 'npm:dsh-example@1.0.0', '--dsh', join(tempDir(), 'missing-dsh.js'), '--json', 'unused.json'])
    expect(code).toBe(EXIT.usage)
  })
})
