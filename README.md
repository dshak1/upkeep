# Upkeep

Upkeep moves the public repos that are still on a provider's old SDK to its new one, and proves each move with the
repo's own type check and build, run before and after.

First target: Hexclave (was Stack Auth). In May 2026 its packages moved from `@stackframe/*` to `@hexclave/*`. The old
packages still work and are frozen. Hexclave's migration guide is the spec.

Built at c0mpiled-18, YC Startup School Hackathon, Taipei, 2026-11-11. Results land here as they are run.

<!-- results:start -->
**1 of 1** repos that type-checked before the move still type-check after it, with no old package import or old name left (Check C). 1 repos attempted; 0 were not counted because they were red, had no type check or failed to install before Upkeep touched them.

| Repo | Commit | Manager | Old version | Type check before | Type check after | Build before | Build after | Check C | Files changed | Lines +/- | Left for a human | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| [hexclave/multi-tenant-starter-template](https://github.com/hexclave/multi-tenant-starter-template) | `a56e81b` | npm | ^2.7.16 | green (3.1s) | green (3.1s) | green (43.8s) | green (47.3s) | pass | 9 | +15 / -15 | 0 | moved |
<!-- results:end -->

## Results

Every row below was written by `node src/cli.ts run targets/hexclave.tsv --build` into `runs/results.jsonl`, then turned
into this table by `node src/cli.ts report`. Same install command and the same checks before and after; the type check
and the build run in a sandbox with no network and an empty home directory (`scripts/box.sh`).


## Install it once: the Action and the watcher

When a library your app uses changes, Upkeep automatically opens a pull request that fixes your code, and only if
your own tests still pass.

1. Add `.github/workflows/upkeep.yml` to your repo (example: [upkeep-demo-app-1](https://github.com/dshak1/upkeep-demo-app-1/blob/main/.github/workflows/upkeep.yml)).
   It runs on `repository_dispatch` (`sdk-release`) and uses this repo as an Action (`uses: dshak1/upkeep@<ref>`).
2. The Action applies the provider's migration spec (`specs/*.json`), installs, runs your build and your tests, and
   opens a pull request only if they pass. If they fail it opens an issue for a human instead.
3. `upkeep watch` follows the provider and tells every repo with Upkeep installed, within seconds of a release:

```sh
node src/cli.ts watch --github dshak1/upkeep-demo-sdk --discover dshak1        # GitHub releases of the provider
node src/cli.ts watch --npm @hexclave/next,@stackframe/stack --discover dshak1  # npm's public change feed
```

The watcher uses your local `gh` login, so no token is stored in any repo.
