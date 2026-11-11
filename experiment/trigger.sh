#!/usr/bin/env bash
# The provider ships the rename: tag v2.0.0 on the SDK's v2 branch and push it. Prints the push time (UTC).
set -euo pipefail
SDK=${SDK:-dshak1/upkeep-demo-sdk}
TAG=${TAG:-v2.0.0}
DIR=${SDK_DIR:-${TMPDIR:-/tmp}/upkeep-demo-sdk}
[ -d "$DIR/.git" ] || gh repo clone "$SDK" "$DIR" -- -q
git -C "$DIR" fetch -q --prune --prune-tags origin
git -C "$DIR" tag -d "$TAG" >/dev/null 2>&1 || true
git -C "$DIR" tag "$TAG" origin/v2
date -u +%FT%TZ > "${T0_FILE:-/dev/null}"
echo "$(date -u +%FT%TZ)  git push origin $TAG   (SDK renamed: @upkeep-demo/stack -> @upkeep-demo/hexclave)"
git -C "$DIR" push -q origin "$TAG"
