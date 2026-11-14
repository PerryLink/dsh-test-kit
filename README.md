# dsh-test-kit

[![ci](https://github.com/PerryLink/dsh-test-kit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/PerryLink/dsh-test-kit/actions/workflows/ci.yml)

**Run a DeepSeek Harness plugin's install-and-smoke check outside DeepSeek Harness.**

`dsh-test-kit` is the standalone home of the extracted `dsh-test-drive` engine.
It installs a target into a throwaway `DSH_HOME` profile, verifies that the
bundle patch layer actually mounted, runs a keyless boot smoke, uninstalls the
package, cleans up every directory it owns, and writes the frozen
`dsh-test-drive/v1` JSON record plus Markdown and JUnit reports.

This repository is self-contained: `src/core/` lives here, no monorepo checkout,
no `@deepseek-ai/*` runtime import, and no DSH host process are required. The
only things a drive needs are the `dsh` CLI, pnpm, and network access for the
throwaway profile's install.

- **Starts with plain Node.** The CLI bundles `zod`; a clean checkout boots with
  `node lib/cli.js --version`.
- **Never reports success for unknown output.** Missing or invalid JSON is
  rejected; `fail`, `partial`, and `unknown` all have non-zero exit codes.
- **`boot-ok` is not `pass`.** A non-zero boot without loader-failure markers is
  `partial`; `pass` requires a real boot (`smoke.status=pass`, exit 0) or an
  explicitly skipped smoke.
- **Isolation by construction.** Throwaway `DSH_HOME`, throwaway cwd, redirected
  pnpm store; the host profile is never read or written.
- **Sanitized reports.** Token literals, URL credentials, bearer headers, and
  temp paths are redacted before any string reaches a report.

## Status

- **Source of truth:** this repository. The package was extracted from the
  `dsh-test-drive` monorepo into a self-contained `src/` + `src/core/` tree.
- **npm:** not published by this repository yet. Publication is handled by the
  owner; until then, build from source or use the GitHub Action.
- **Schema:** frozen at `schema: "dsh-test-drive/v1"`. The kit does not add
  fields, so existing scorers and dashboards keep working.
- **macOS:** verified in GitHub-hosted CI (`macos-latest`, Node 24). The
  extraction host has no macOS hardware, so the local macOS run is **BLOCKED**;
  the `macos-latest` Actions job is the authoritative macOS result.

## Requirements

| Requirement | Notes |
|---|---|
| Node.js | `^22.19.0` or `>=24.9.0` |
| `dsh` CLI | any 0.2.x build that provides `plugin add` and `--dump-config`; pass `--dsh <path>` or put `dsh` on `PATH` |
| Network | only for the throwaway profile's pnpm install |
| pnpm | the `dsh plugin` manager uses its own pnpm; a working registry is required |

## Install

Once the owner publishes the package:

```sh
npm install -g @perrylink/dsh-test-kit
dsh-test-kit --version
```

Until then, build the standalone checkout:

```sh
git clone https://github.com/PerryLink/dsh-test-kit.git
cd dsh-test-kit
npm ci
npm run build
node lib/cli.js --version
```

`lib/cli.js` is a single self-contained ESM entry (zod bundled); the build fails
if zod is externalized or the frozen schema string is missing.

## Quick start

```sh
# A GitHub ref (the checkout/pack path plugin authors actually ship)
dsh-test-kit run github:owner/repo#<sha> --dsh /path/to/dsh --json out.json

# A published plugin
dsh-test-kit run npm:dsh-score@0.2.28 --dsh /path/to/dsh --json out.json

# A local checkout or tarball
dsh-test-kit run ./my-plugin --json out.json
dsh-test-kit run ./my-plugin.tgz --json out.json

# Render the CI report pair from the settled record
dsh-test-kit render --input out.json --out-dir reports
```

`render` writes `reports/out.md` (PR comment body) and
`reports/out.junit.xml` (test reporter input), then prints one JSON line with
the absolute paths and the verdict.

## Targets

| Form | Example | Notes |
|---|---|---|
| GitHub ref | `github:owner/repo#<sha>` | passed to `dsh plugin add` |
| git URL | `git+https://host/repo.git#ref` | any pnpm-supported git spec |
| npm registry | `npm:name`, `npm:@scope/name@1.2.3` | the `npm:` marker is stripped before install |
| local path | `./plugin`, `/abs/plugin` | anchored at the invoking directory |
| tarball | `./plugin.tgz` | packed plugin |

## The result record

```json
{
  "schema": "dsh-test-drive/v1",
  "run": { "runId": "tdr_…", "harnessVersion": "0.2.2-rc.3", "pluginVersion": "0.1.0", "…": "…" },
  "target": { "kind": "npm", "spec": "dsh-score@0.2.28", "resolved": { "packageName": "dsh-score", "packageVersion": "0.2.28", "hasBundleManifest": true } },
  "stages": {
    "install":   { "status": "pass", "…": "…" },
    "config":    { "status": "pass", "patchEffective": true, "layers": ["dsh-score"], "…": "…" },
    "smoke":     { "status": "boot-ok", "bootFailed": false, "taskCompleted": false, "…": "…" },
    "uninstall": { "status": "pass", "…": "…" },
    "cleanup":   { "status": "pass", "quarantined": true, "removed": true, "…": "…" }
  },
  "verdict": "partial",
  "verdictReason": "install, patch, and uninstall verified; boot smoke exited 1 without loader-failure markers, so a successful boot is not proven"
}
```

`verdict=pass` requires `smoke.status=pass` with exit 0, or an explicitly
skipped smoke. A non-zero boot (`boot-ok`) is **always** `partial`. An empty
matrix is `unknown`, never `pass`.

### Verdicts

| Verdict | Meaning | `run` exit code |
|---|---|---|
| `pass` | install, patch layer, and uninstall verified, plus either a real boot (`smoke.pass` with exit 0) or an explicitly skipped smoke (empty task / `--no-smoke`) | 0 |
| `fail` | install failed, boot found loader failures (including `Cannot find module`), or a capability assertion failed | 1 |
| `partial` | install passed but the patch/boot/uninstall could not be fully verified; `boot-ok` (non-zero exit) is always here | 2 |
| `unknown` | the stage combination has no conclusive rule (typically install never ran) | 3 |

## `render` integrity rules (P2 fix)

`render` re-folds the verdict from the record's own stages before writing a
report. A record that **claims `pass` while its stages say otherwise** is never
rendered as green:

- any failed stage (`install`, `config`, `smoke`, `capability`, `uninstall`, or
  `cleanup`) → report shows the stage-derived `fail`, exit **1**;
- partial evidence such as `patchEffective: false` → report shows `partial`,
  exit **2**;
- inconclusive evidence → `unknown`, exit **3**.

Exit codes for `render` are therefore:

| Code | Meaning |
|---|---|
| `0` | reports written from a consistent record |
| `1` | record claimed `pass` but a stage is `fail` |
| `2` | record claimed `pass` but the stage evidence is `partial` |
| `3` | record claimed `pass` but the stage evidence is inconclusive |
| `64` | usage error |
| `65` | input is not a `dsh-test-drive/v1` record (including placeholder JSON) |

Placeholder JSON such as `{"note":"replace this step"}` is **rejected**, never
rendered as a success.

### What the stages actually check

1. **install** — `dsh plugin --profile <name> add <target>` in the throwaway
   home. A pnpm `allowBuilds` gate hit on a git source is allowlisted and
   retried once.
2. **config** — `dsh --profile <name> --dump-config`; the installed package must
   appear as a layer or a row. Install success alone is not enough.
3. **smoke** — one headless invocation. Exit 0 with no loader-failure markers
   is `pass`; a non-zero exit **is not a verified boot** and yields `boot-ok`
   → verdict `partial`; loader/module failures (`Cannot find module` etc.) make
   it `fail`. An empty task skips the stage entirely (install/patch/uninstall
   still yield `pass`).
4. **capability** (optional) — prove one named tool/command is registered,
   invoked, and observed in the durable session log. Needs a model credential
   forwarded explicitly; otherwise the stage is `skipped`, not failed.
5. **uninstall / cleanup** — remove the package and always run the owned
   quarantine → delete ladder, including on abort and pipeline errors.

## GitHub Action

The action lives at the repository root; reference `@main` until a release tag
exists:

```yaml
name: test-drive
on: [pull_request, workflow_dispatch]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install the dsh CLI (or use your own cache)
        run: npm install -g @deepseek-ai/dsh@0.2.2-rc.3
      - name: Drive this plugin
        id: drive
        uses: PerryLink/dsh-test-kit@main
        with:
          target: github:${{ github.repository }}#${{ github.sha }}
          # Optional: headless-task: 'Reply with exactly: ok'
          # Optional: dsh: /usr/local/bin/dsh
      - name: Publish JUnit
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: ${{ steps.drive.outputs.junit }}
      - name: Comment the report
        run: cat "${{ steps.drive.outputs.markdown }}"
```

| Input | Default | Purpose |
|---|---|---|
| `target` | — (required) | same target forms as the CLI |
| `headless-task` | `''` | empty skips the smoke stage |
| `dsh` | `dsh` | absolute path, bare command, or `npm:<pkg>@<version>` |
| `node-version` | `24` | Node used by the kit |
| `kit-version` | `latest` | only used when the checkout has no local kit |
| `allow-partial` | `false` | `partial` passes only when explicitly allowed |

Outputs: `markdown`, `junit`, `verdict`, `result`.

The action installs/builds the kit, runs the drive with `--no-fail`, validates
and renders the record, then **fails the job on `fail` or `unknown`** (and on
`partial` unless `allow-partial: true`). It never substitutes a placeholder
result.

## Security model

- **Owned temp roots only.** Every directory is created with `mkdtemp` under the
  OS temp dir with the `dsh-test-drive-` prefix, registered, and removed through
  the dry-run → quarantine-rename → delete ladder. `assertOwned` refuses
  anything else.
- **Throwaway profile.** The child gets `DSH_HOME=<owned root>/home`, a
  throwaway cwd, and `npm_config_store_dir=<owned root>/store`. The real
  `~/.dsh` is never read or written; the record asserts
  `isolation.hostHomeTouched: false`.
- **No implicit secrets.** The adapter starts from the parent environment minus
  credential-shaped names (`/KEY|PASSWORD|SECRET|TOKEN/i`) and all `DSH_*`
  names; only values named with `--forward-env` survive.
- **Sanitized output.** Every report string passes the engine sanitizers; stage
  output is byte-capped and temp paths are redacted.

## Source layout

```
src/core/                  self-contained engine (10 modules)
  config.ts                defaults + fail-loud resolveConfig (no Schemastery)
  driver.ts                dsh location, argv-only spawning, allowBuilds, dump parsing
  drive.ts                 install → config → smoke → capability → uninstall → cleanup
  result.ts                frozen zod schema + verdictOf
  report.ts                Markdown + JUnit renderers
  workspace.ts             owned temp roots, quarantine ladder
  capability.ts            session-log capability analyzer
  session-log.ts           multi-frame zstd session reader
  sanitize.ts              secret/temp-path redaction
  version.ts               engine version

src/cli.ts                 run / render, argument parsing, exit codes
src/subprocess.ts          node:child_process adapter for the engine seam
action.yml                 composite GitHub Action
lib/cli.js                 built single-file bundle (committed so the Action needs no build)
tests/                     CLI + subprocess specs and the scripted fake dsh
```

Dependency direction is one-way: the CLI imports the engine, the engine imports
nothing from DSH (type-only seams live in `driver.ts`), and only
`subprocess.ts` starts processes. That is what makes `dsh-test-kit run` startable
with plain Node.

## Development

```sh
npm ci
npm run typecheck      # tsc --noEmit over src/ and tests/
npm test               # vitest: CLI + subprocess specs
npm run build          # tsdown bundle + self-contained bundle guard
npm run verify         # verify lib/cli.js bundles zod and the frozen schema
node lib/cli.js run npm:dsh-score@0.2.28 --json /tmp/out.json
node lib/cli.js render --input /tmp/out.json --out-dir /tmp/reports
```

The tests use a scripted `dsh` (`tests/fixtures/fake-dsh.mjs`), so the full
run → JSON → render loop is exercised without a network install. The P2
regression test forges `verdict: pass` over a failed install and asserts
`render` exits `1` and writes a `fail` report.

## CI

`.github/workflows/ci.yml` runs `npm ci`, typecheck, tests, build, and
`node lib/cli.js --version` on:

| Job | Runner | Node |
|---|---|---|
| `test` | `ubuntu-latest`, `windows-latest` | 22, 24 |
| `macos` | `macos-latest` | 24 |
| `action` | `ubuntu-latest` | 24 |

The `action` job runs this repository's composite action end-to-end against the
scripted `dsh` and asserts a `pass` verdict. The `macos` job exists because the
extraction host has no macOS hardware (local macOS run: BLOCKED); CI is the
authoritative macOS check.

## v0.1 limits

- One target per `run`; batch matrices are still a plugin-only feature
  (`/testdrive` + `drive-batch`).
- The smoke stage is keyless by default; forwarding a model credential is
  always an explicit `--forward-env` decision.
- Windows: the adapter refuses to spawn `.cmd`/`.bat`/`.ps1` shims directly (no
  shell). Pass a `.exe`, or a JS/ESM entry (`.js`/`.mjs`/`.cjs`) — JS entries are
  launched through `node`.
- `--dsh npm:<pkg>@<version>` uses `npm exec --package=… -- dsh`; npm must be
  resolvable as a JS entry (the adapter locates `npm-cli.js`).
- No git tag or npm release is created by this repository yet.

## License

Apache-2.0. The bundled `zod` is MIT; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
