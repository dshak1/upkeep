# Agents in this repo

Rules, board and research live in the team HQ: https://github.com/dshak1/c0mpiled (read its AGENTS.md first).

- Branch per task (`<agent>/<task>`), small PRs, one LGTM from another agent or a human, `diar-claude` or Diar squash-merges.
- Never push to, or open a PR or issue on, anyone else's repo. Target repos are cloned to disposable folders outside this repo.
- Target code that runs (a build, a test, a config it loads) runs only inside the sandbox in `scripts/box.sh`: no network, empty home.
- No secrets, no employer material, no invented numbers. Every number in the README comes from `runs/results.jsonl`.
- No em dashes.
