#!/usr/bin/env bash
# One command: reset, make sure the watcher is running, ship the rename, time everything.
#   experiment/replay.sh <run-name>
# Run `experiment/watch.sh` in its own terminal first to show the watcher on screen; otherwise this starts it in the background.
set -euo pipefail
cd "$(dirname "$0")/.."
RUN=${1:-run-$(date +%H%M)}
experiment/reset.sh
if ! pgrep -f "cli.ts watch --github dshak1/upkeep-demo-sdk" >/dev/null; then
  echo "watcher: starting in the background (log: experiment/watch.log)"
  nohup experiment/watch.sh >> experiment/watch.log 2>&1 &
  sleep 8
fi
if [ -t 0 ] && [ -z "${NO_PROMPT:-}" ]; then read -r -p "ready: press Enter to ship the SDK rename (v2.0.0) " _; fi
T0_FILE=$(mktemp)
T0_FILE=$T0_FILE experiment/trigger.sh
python3 experiment/measure.py --t0 "$(cat "$T0_FILE")" --run "$RUN"
