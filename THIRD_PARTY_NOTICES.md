# Third-party notices — dsh-test-kit

`dsh-test-kit` is Apache-2.0. Its source is derived from the `dsh-test-drive`
engine (same author, Apache-2.0).

## Bundled at build time

The published `lib/cli.js` bundles the following package so the CLI has no
runtime npm dependencies:

| Package | Version | License | Use |
|---|---|---|---|
| [`zod`](https://github.com/colinhacks/zod) | 4.6.6 | MIT | frozen result-schema validation |

The MIT notice of `zod` is reproduced by the package's own `LICENSE` file in
the npm tarball of `zod`; its copyright notice is:

```
Copyright (c) 2020 Colin Hacks
```

No other third-party code is bundled. `node:child_process`, `node:fs`,
`node:path`, and the other `node:` builtins are part of Node.js.
