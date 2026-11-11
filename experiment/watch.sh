#!/usr/bin/env bash
# The always-on watcher: follows the SDK's GitHub releases and tells every dshak1 repo that has Upkeep installed.
# Refuses to start a second copy: two watchers would send every dispatch twice.
cd "$(dirname "$0")/.."
if pgrep -f "cli.ts watch --github dshak1/upkeep-demo-sdk" >/dev/null; then
  echo "a watcher is already running (pid $(pgrep -f 'cli.ts watch --github dshak1/upkeep-demo-sdk' | tr '\n' ' ')). Stop it first: pkill -f 'cli.ts watch'" >&2
  exit 1
fi
exec node src/cli.ts watch --github dshak1/upkeep-demo-sdk --discover dshak1 --every 3 --log experiment/watch.jsonl
