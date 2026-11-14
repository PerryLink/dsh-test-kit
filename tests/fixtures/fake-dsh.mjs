/**
 * A scripted stand-in for the `dsh` CLI, used by the kit's integration tests.
 *
 * It implements exactly the six invocations the drive engine performs
 * (`plugin add`, `--dump-config`, a headless task, `plugin remove`,
 * `--version`, and nothing else) against the throwaway `DSH_HOME` the engine
 * passes in. This lets the tests exercise the REAL subprocess adapter, temp
 * workspace, result schema, verdict folding, and report rendering without a
 * network install or a DSH runtime.
 *
 * Environment:
 *   DSH_HOME       throwaway home (required)
 *   FAKE_DSH_MODE  `pass` (default), `fail-install`, `crash-boot`, `nonzero-boot`
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const home = process.env.DSH_HOME
const mode = process.env.FAKE_DSH_MODE ?? 'pass'

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(2)
}

if (home === undefined || home === '') fail('fake-dsh: DSH_HOME is required')
if (args[0] === '--version') {
  process.stdout.write('0.2.2-rc.3\n')
  process.exit(0)
}

/** Split `npm:name@version` (scoped names included) into name/version. */
function parseTarget(target) {
  const raw = target.replace(/^npm:/u, '')
  if (raw.startsWith('@')) {
    const at = raw.indexOf('@', 1)
    return at > 0 ? { name: raw.slice(0, at), version: raw.slice(at + 1) } : { name: raw, version: '0.1.0' }
  }
  const at = raw.indexOf('@')
  return at > 0 ? { name: raw.slice(0, at), version: raw.slice(at + 1) } : { name: raw, version: '0.1.0' }
}

if (args[0] === 'plugin' && args[1] === '--profile') {
  const profile = args[2]
  const action = args[3]
  if (profile === undefined || action === undefined) fail('fake-dsh: malformed plugin invocation')
  if (action === 'add') {
    if (mode === 'fail-install') {
      process.stderr.write('fake-dsh: simulated install failure\n')
      process.exit(1)
    }
    const target = args.slice(4).join(' ')
    const { name, version } = parseTarget(target)
    const profileDir = join(home, 'profiles', profile)
    mkdirSync(join(profileDir, 'node_modules', ...name.split('/')), { recursive: true })
    writeFileSync(
      join(profileDir, 'package.json'),
      `${JSON.stringify({ name: 'dsh-profile-headless', private: true, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', name] } } }, null, 2)}\n`,
    )
    writeFileSync(
      join(profileDir, 'node_modules', ...name.split('/'), 'package.json'),
      `${JSON.stringify({ name, version, dsh: { bundle: { patch: './cordis.patch.yml' } } }, null, 2)}\n`,
    )
    process.stdout.write(`installed ${name}@${version} into profile ${profile}\n`)
    process.exit(0)
  }
  if (action === 'remove') {
    process.stdout.write(`removed ${args[4] ?? ''} from profile ${profile}\n`)
    process.exit(0)
  }
  fail(`fake-dsh: unsupported plugin action ${action}`)
}

if (args[0] === '--profile' && args[2] === '--dump-config') {
  const profile = args[1]
  const manifest = JSON.parse(readFileSync(join(home, 'profiles', profile, 'package.json'), 'utf8'))
  const bundles = manifest.dsh?.profile?.bundles ?? []
  const installed = bundles[bundles.length - 1]
  process.stdout.write(`# == ${installed}\n- name: ${installed}\n`)
  process.exit(0)
}

if (args[0] === '--profile') {
  if (mode === 'crash-boot') {
    process.stderr.write("Error: Cannot find module 'left-pad'\n")
    process.exit(1)
  }
  if (mode === 'nonzero-boot') {
    process.stderr.write('fake-dsh: boot exited without loader markers\n')
    process.exit(1)
  }
  process.stdout.write('ok\n')
  process.exit(0)
}

fail(`fake-dsh: unsupported invocation ${JSON.stringify(args)}`)
