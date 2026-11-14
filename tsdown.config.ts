/**
 * Build face for `dsh-test-kit`: one self-contained ESM CLI entry.
 *
 * The shared engine lives in this repository's `src/core/`; tsdown bundles
 * those relative imports into `lib/`, so the published package starts with
 * plain Node and no DSH runtime dependency.
 *
 * `zod` must be BUNDLED: importing from outside this package may otherwise
 * resolve it from the repo root (monorepo) but treat it as external in a clean
 * standalone checkout, producing a 105 KB lib that fails at install time. The
 * explicit alias resolves zod from this package's own node_modules, and
 * `alwaysBundle` keeps it inline.
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const zodEntry = fileURLToPath(import.meta.resolve('zod'))

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: true,
  fixedExtension: false,
  banner: { js: '#!/usr/bin/env node' },
  alias: { zod: zodEntry },
  deps: {
    neverBundle: [/^node:/],
    alwaysBundle: ['zod'],
    onlyBundle: ['zod'],
  },
})
