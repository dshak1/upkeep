# Upkeep

Upkeep moves the public repos that are still on a provider's old SDK to its new one, and proves each move with the
repo's own type check and build, run before and after.

First target: Hexclave (was Stack Auth). In May 2026 its packages moved from `@stackframe/*` to `@hexclave/*`. The old
packages still work and are frozen. Hexclave's migration guide is the spec.

Built at c0mpiled-18, YC Startup School Hackathon, Taipei, 2026-11-11. Results land here as they are run.

## Results

Every row in the table was written by `node src/cli.ts run targets/hexclave.tsv --build` into `runs/results.jsonl`, then
turned into this table by `node src/cli.ts report`; nothing in it is typed by hand.
Each repo is built twice, before and after Upkeep moves it, with the same install command both times.
The type check and the build run in a sandbox with no network and an empty home directory (`scripts/box.sh`: bwrap on Linux, sandbox-exec on macOS).
Minutes is the whole run for one repo; a repo still running after 6 minutes is stopped and shown as timeout.
A repo whose build fetches Google Fonts with Turbopack cannot build with no network, before or after, so it shows no and no.

<!-- results:start -->
**3 of 3** repos that built before Upkeep still build after it, with none of the old package left (14 repos attempted).

| Repo | Builds before | Builds after | Old package left | Minutes |
|---|---|---|---|---|
| [aziontech/azion-samples](https://github.com/aziontech/azion-samples/tree/8d504e5f11c77c45b54870a8e3759129bcaac709) | yes | yes | no | 3.5 |
| [hexclave/multi-tenant-starter-template](https://github.com/hexclave/multi-tenant-starter-template/tree/a56e81ba7af72d9adc10bc863b60499c3ea6abac) | yes | yes | no | 1.7 |
| [makcimerrr/admin-dashboard](https://github.com/makcimerrr/admin-dashboard/tree/ec8aab85b5503dc1e7ed65280f306a0ea7cf79e1) | yes | yes | no | 5.2 |
| [Aditya190803/Application-Tracking-System](https://github.com/Aditya190803/Application-Tracking-System/tree/5a83cf7db80b2f72e41dc170887de5f3ad2cb3d5) | no | no | no | 0.5 |
| [f0rsakeN-afk/punotes](https://github.com/f0rsakeN-afk/punotes/tree/a355724de1d6f379db2a5724491d6b2e3f68350c) | no | no | no | 2.3 |
| [Gjusev/nexary-platform](https://github.com/Gjusev/nexary-platform/tree/15bce5701bc5f467ff5985aba6e0df47ef3f1738) | no | no | no | 3.6 |
| [joshsegatt/UK-TaxSaver](https://github.com/joshsegatt/UK-TaxSaver/tree/699f93568fa405b99d7930856096e5188dcefb1e) | no | timeout | no | 6.0 |
| [lacymorrow/cloud0.dev](https://github.com/lacymorrow/cloud0.dev/tree/7556368585167f5dc81d0791e50eddf1f7e0de80) | no | no | no | 3.7 |
| [lacymorrow/hitchhikersgalaxy.guide](https://github.com/lacymorrow/hitchhikersgalaxy.guide/tree/a8ead14217618c74bb57c6b82c49447f35dd75c6) | timeout | timeout | timeout | 5.8 |
| [nromeron/sistema-de-inventario---NextJs](https://github.com/nromeron/sistema-de-inventario---NextJs/tree/6b572e7dc081191f27ad3bfda53a2a662ec5f0a3) | no | no | no | 1.2 |
| [prettyinpurple2021/solo-ai](https://github.com/prettyinpurple2021/solo-ai/tree/034f752fa89baebe54e1ea573e6399e5c3f574ab) | not run (no type check) | not moved | not moved | 2.6 |
| [RishabhGandhiNewZealand/twenty-20-capital](https://github.com/RishabhGandhiNewZealand/twenty-20-capital/tree/49740464c971e6793c970b40ff0309b3ee707a65) | no | no | no | 1.4 |
| [roocell/timetravelmap](https://github.com/roocell/timetravelmap/tree/51470ecba3e5f77b2b7ed22b2cf91b605310fa1c) | no | no | no | 2.1 |
| [satyam-code45/LearnifyAI](https://github.com/satyam-code45/LearnifyAI/tree/e8102cb32000192e4afa0e9521c196f172396197) | no | no | no | 1.8 |
<!-- results:end -->
