#!/usr/bin/env node
/**
 * Fail the build if `lib/cli.js` is not self-contained.
 *
 * A clean standalone checkout can resolve `zod` differently from the monorepo;
 * when that happens tsdown silently treats it as an external dependency and
 * emits a ~105 KB CLI that dies with ERR_MODULE_NOT_FOUND after `npm pack`.
 * This guard makes that build fail loudly instead.
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const cli = join(packageDir, 'lib', 'cli.js')
const text = readFileSync(cli, 'utf8')
const size = statSync(cli).size
const failures = []
if (/\bfrom\s+["']zod["']|\brequire\(\s*["']zod["']\s*\)/u.test(text)) {
  failures.push('lib/cli.js still imports "zod" as an external dependency; the build did not bundle it')
}
if (size < 200_000) {
  failures.push(`lib/cli.js is only ${size} bytes; expected the zod-inclusive bundle (>200000)`)
}
if (!text.includes('dsh-test-drive/v1')) {
  failures.push('lib/cli.js does not contain the frozen schema string')
}
if (failures.length > 0) {
  console.error(`verify-build: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`verify-build: ok (${size} bytes, zod bundled)`)
