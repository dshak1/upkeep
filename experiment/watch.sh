#!/usr/bin/env bash
# The always-on watcher: follows the SDK's GitHub releases and tells every dshak1 repo that has Upkeep installed.
cd "$(dirname "$0")/.."
exec node src/cli.ts watch --github dshak1/upkeep-demo-sdk --discover dshak1 --every 3 --log experiment/watch.jsonl
