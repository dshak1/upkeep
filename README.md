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

