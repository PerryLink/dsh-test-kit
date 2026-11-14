# Changelog — dsh-test-kit

## 0.1.0 (unreleased)

First implementation of the standalone kit. The source now lives in its own
repository, `PerryLink/dsh-test-kit`. **Not published and not tagged**; npm
publication and release tags require explicit owner approval.

### Added

- `dsh-test-kit run <target>`: drives `github:`, `git+https`, `npm:`, local
  path, and `.tgz` targets through the extracted `dsh-test-drive` engine
  (install → patch check → boot smoke → uninstall → cleanup) in a throwaway
  `DSH_HOME`, and writes the frozen `schema: "dsh-test-drive/v1"` JSON record.
- `dsh-test-kit render --input <json> --out-dir <dir>`: validates the record and
  emits Markdown (PR comment) and JUnit XML; rejects placeholder/invalid JSON.
- `node:child_process` subprocess adapter (`src/subprocess.ts`) implementing the
  engine's subprocess seam outside DSH: PATH/PATHEXT resolution, scrubbed
  parent env, tail-bounded collected output, abort → tree termination.
- Composite `action.yml`: install/build kit → run with `--no-fail` → render →
  enforce `pass` (with `fail`/`unknown` always failing, `partial` opt-in).
- Standalone extraction: `src/core/` (10 engine modules) lives in this
  repository; imports are package-relative (`./core/...`), with no monorepo
  path or `@deepseek-ai/*` runtime dependency. CLI/subprocess tests moved to
  `tests/` and run with plain `npm test`.
- `.github/workflows/ci.yml`: Ubuntu/Windows on Node 22 and 24, a dedicated
  `macos-latest` job (Node 24), and a composite-action end-to-end job.
- Exit codes by verdict: 0 pass, 1 fail, 2 partial, 3 unknown.

### Fixed in P0 verification

- **Boot verdicts are honest.** `pass` now requires `smoke.status=pass` with exit 0 (or an explicitly skipped smoke from an empty task). `boot-ok` (non-zero exit) is `partial`, and `Cannot find module` / `Cannot find package` / `ERR_MODULE_NOT_FOUND` are boot-failure markers → `fail`. The `dsh-todo@0.1.0` real boot crash is no longer reported as pass.
- **Published package is self-contained.** A clean standalone checkout resolved `zod` from outside the package and emitted a 105 KB externalized bundle. The build now aliases `zod` via `import.meta.resolve`, `verify-build.mjs` fails the build unless zod is bundled, and `zod` is also declared as a dependency. `npm pack` + bare install runs.
- **Empty headless-task no longer defaults to partial.** The action's default (empty task → `--no-smoke`) yields `pass` from install/patch/uninstall; only an explicit config skip is accepted as a pass.
- **Empty/unknown matrices are failures.** Empty matrix → `unknown`, with a synthetic JUnit `empty-matrix` failure; `unknown` rows and the overall drive verdict are counted as JUnit failures.
- **CI gates** now build/typecheck/test/verify/pack the kit and run the composite action against a scripted `dsh` (default empty task must pass).

### Fixed in P2 verification

- **`render` cannot publish a green report over failed stages.** A record that
  claims `verdict: pass` while its own stages say `fail` now renders the
  stage-derived verdict (including a corrected `verdictReason`) and exits `1`
  instead of `0`. Contradictions with partial/inconclusive evidence exit `2`/`3`
  respectively. Regression test: `tests/cli.spec.ts` forges `pass` over a failed
  install and asserts exit `1` plus a `fail` report.
- **Windows JS/ESM `--dsh` entries run.** A `.js`/`.mjs`/`.cjs` executable is
  launched through `node` on Windows (direct `CreateProcess` fails with
  `EFTYPE`), so the scripted test dsh and JS-entry deployments work there.
  Aborted runs settle with `exitCode: null` on Windows too (the `taskkill /F`
  path used to surface exit `1`).
- **Cross-platform test suite is green locally.** `npm test` passes 30/30 on
  Linux and on Windows (Node 24); macOS is covered by the `macos-latest` CI
  job because no macOS hardware was available for the extraction.

### Changed in the shared engine

- Engine modules moved to `src/core/` and re-exported from their original
  paths, so the existing `dsh-test-drive` public API and tests remain valid.
- The subprocess seam is structural (`DriverSubprocessService`) instead of a
  `@deepseek-ai/*` type, and `resolveConfig` no longer imports Schemastery;
  the plugin still exports the loader-facing Schemastery `Config` schema.
- `classifyTarget` recognizes the explicit `npm:` registry form and the drive
  strips the marker before `dsh plugin add`.

### Not done (needs owner approval or a later release)

- npm publish, git tag, GitHub release, announcements (owner action).
- Batch/matrix CLI, multi-target runs, capability-credential automation.
- macOS was not available on the extraction host; the `macos-latest` CI job is
  the verification path.
