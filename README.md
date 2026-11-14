# dsh-test-kit (reserved)

Standalone CLI/Action for testing DeepSeek Harness plugins **outside DSH**.

> **Status: v0.1 source currently lives in the monorepo; this repo is reserved for the standalone extraction.** npm publish is pending macOS CI and a render exit-code fix. Not a DSH bundle.

- Source: https://github.com/PerryLink/dsh-test-drive/tree/main/packages/dsh-test-kit
- Engine: extracted from dsh-test-drive; JSON schema frozen at `dsh-test-drive/v1`.
- CLI: `dsh-test-kit run <target>` / `dsh-test-kit render --input out.json --out-dir reports`.
- Verdict: pass / fail / partial / unknown; `boot-ok` is not `pass`.

Do not publish this package until the extraction lands here.
