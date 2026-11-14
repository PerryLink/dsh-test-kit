/**
 * Local subprocess adapter contract: PATH/PATHEXT expansion on all three
 * platforms, environment scrubbing, collected-output tails, and abort-driven
 * tree termination. These are the only process facts the kit relies on when it
 * runs outside DSH.
 *
 * @module dsh-test-kit/test/subprocess
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  NodeSubprocessService,
  executableCandidates,
  resolveExecutable,
  scrubbedParentEnv,
  spawnArgv,
} from '../src/subprocess.ts'

const roots: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-test-kit-subprocess-'))
  roots.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/** Spawn Node with a tiny inline program and return the settled handle. */
function nodeService(): NodeSubprocessService {
  return new NodeSubprocessService(process.env)
}

describe('executableCandidates', () => {
  it('expands POSIX PATH entries without extensions', () => {
    const candidates = executableCandidates('dsh', { PATH: '/usr/local/bin:/usr/bin' }, 'linux')
    expect(candidates).toEqual(['/usr/local/bin/dsh', '/usr/bin/dsh'])
  })

  it('expands Windows PATH entries with PATHEXT (case-preserving)', () => {
    const candidates = executableCandidates(
      'dsh',
      { PATH: 'C:\\Tools;C:\\Windows', PATHEXT: '.EXE;.CMD' },
      'win32',
    )
    expect(candidates).toEqual(['C:\\Tools\\dsh.EXE', 'C:\\Tools\\dsh.CMD', 'C:\\Windows\\dsh.EXE', 'C:\\Windows\\dsh.CMD'])
  })

  it('keeps an explicit path as the only candidate on every platform', () => {
    for (const platform of ['linux', 'darwin', 'win32'] as const) {
      expect(executableCandidates('/opt/dsh', { PATH: '/bin' }, platform)).toEqual(['/opt/dsh'])
      expect(executableCandidates('C:\\dsh\\dsh.exe', { PATH: 'C:\\Windows' }, platform)).toEqual(['C:\\dsh\\dsh.exe'])
      expect(executableCandidates('./relative/dsh', { PATH: '/bin' }, platform)).toEqual(['./relative/dsh'])
    }
  })
})

describe('resolveExecutable', () => {
  it('resolves the running Node binary', async () => {
    await expect(resolveExecutable(process.execPath)).resolves.toBe(process.execPath)
  })

  it('rejects relative paths containing separators', async () => {
    await expect(resolveExecutable('./relative/dsh')).rejects.toThrow(/relative executable paths/)
  })

  it('rejects missing absolute paths', async () => {
    await expect(resolveExecutable(join(tempDir(), 'nope'))).rejects.toThrow(/not found/)
  })
})

describe('spawnArgv', () => {
  it('runs a JS/ESM entry through node on Windows', () => {
    expect(spawnArgv('C:\\tools\\dsh.mjs', ['plugin', 'add'], 'win32', 'C:\\node.exe'))
      .toEqual(['C:\\node.exe', ['C:\\tools\\dsh.mjs', 'plugin', 'add']])
    expect(spawnArgv('C:\\tools\\dsh.cjs', [], 'win32', 'C:\\node.exe'))
      .toEqual(['C:\\node.exe', ['C:\\tools\\dsh.cjs']])
  })

  it('leaves executables and POSIX paths untouched', () => {
    expect(spawnArgv('C:\\tools\\dsh.exe', ['--version'], 'win32', 'C:\\node.exe'))
      .toEqual(['C:\\tools\\dsh.exe', ['--version']])
    expect(spawnArgv('/usr/local/bin/dsh', ['--version'], 'linux', '/usr/bin/node'))
      .toEqual(['/usr/local/bin/dsh', ['--version']])
  })
})

describe('scrubbedParentEnv', () => {
  it('drops credential-shaped and DSH_* names, keeps PATH/HOME', () => {
    const env = scrubbedParentEnv({
      PATH: '/bin',
      HOME: '/home/me',
      GH_TOKEN: 'secret',
      MY_API_KEY: 'secret',
      DSH_HOME: '/leak',
      dsh_profile: 'leak',
      CLEAN: 'kept',
    })
    expect(env).toEqual({ PATH: '/bin', HOME: '/home/me', CLEAN: 'kept' })
  })
})

describe('NodeSubprocessService', () => {
  it('collects stdout/stderr and the exit code', async () => {
    const handle = nodeService().spawn({
      argv: [process.execPath, '-e', 'console.log("out"); console.error("err")'],
      cwd: tempDir(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } },
      graceMs: 1_000,
    })
    await expect(handle.done).resolves.toEqual({ exitCode: 0 })
    expect(handle.collected.stdout?.readFrom(0).text).toBe('out\n')
    expect(handle.collected.stderr?.readFrom(0).text).toBe('err\n')
    expect(handle.collected.stdout?.readFrom(0).lossy).toBe(false)
  })

  it('keeps the tail and reports lossiness when a stream exceeds its cap', async () => {
    const handle = nodeService().spawn({
      argv: [process.execPath, '-e', 'process.stdout.write("x".repeat(5000))'],
      cwd: tempDir(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 128 }, stderr: { maxBytes: 128 } },
      graceMs: 1_000,
    })
    await handle.done
    const read = handle.collected.stdout?.readFrom(0)
    expect(read?.lossy).toBe(true)
    expect(read?.text.length).toBe(128)
  })

  it('merges explicit env after scrubbing (forwarded value survives, inherited secret does not)', async () => {
    const service = new NodeSubprocessService({ PATH: process.env.PATH, INHERITED_TOKEN: 'secret' })
    const handle = service.spawn({
      argv: [process.execPath, '-e', 'process.stdout.write(`${process.env.INHERITED_TOKEN ?? "none"}:${process.env.KEEP ?? "none"}`)'],
      cwd: tempDir(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } },
      graceMs: 1_000,
      env: { KEEP: 'yes' },
    })
    await handle.done
    expect(handle.collected.stdout?.readFrom(0).text).toBe('none:yes')
  })

  it('terminates the tree on abort and settles the outcome', async () => {
    const controller = new AbortController()
    const started = Date.now()
    const handle = nodeService().spawn({
      argv: [process.execPath, '-e', 'setInterval(() => {}, 1000)'],
      cwd: tempDir(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 1024 }, stderr: { maxBytes: 1024 } },
      graceMs: 200,
      signal: controller.signal,
    })
    controller.abort()
    const outcome = await handle.done
    expect(outcome.exitCode).toBeNull()
    expect(Date.now() - started).toBeLessThan(5_000)
  })
})
