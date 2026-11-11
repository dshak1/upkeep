#!/usr/bin/env bash
# Puts the rename experiment back to the start: SDK has only v1.0.0 released, every demo app is on v1 and green,
# no Upkeep PR, branch or issue left. Safe to run twice.
set -euo pipefail
SDK=${SDK:-dshak1/upkeep-demo-sdk}
TAG=${TAG:-v2.0.0}
APPS=${APPS:-"dshak1/upkeep-demo-app-1 dshak1/upkeep-demo-app-2 dshak1/upkeep-demo-app-3"}

echo "reset: $SDK release and tag $TAG"
gh release delete "$TAG" -R "$SDK" --cleanup-tag -y 2>/dev/null || true
gh api -X DELETE "repos/$SDK/git/refs/tags/$TAG" 2>/dev/null || true

for app in $APPS; do
  echo "reset: $app"
  for n in $(gh pr list -R "$app" --state open --json number,headRefName --jq '.[] | select(.headRefName | startswith("upkeep/")) | .number'); do
    gh pr close "$n" -R "$app" --delete-branch >/dev/null && echo "  closed PR #$n"
  done
  for b in $(gh api "repos/$app/branches" --jq '.[].name | select(startswith("upkeep/"))'); do
    gh api -X DELETE "repos/$app/git/refs/heads/$b" && echo "  deleted branch $b"
  done
  for n in $(gh issue list -R "$app" --state open --search 'Upkeep in:title' --json number --jq '.[].number'); do
    gh issue close "$n" -R "$app" >/dev/null && echo "  closed issue #$n"
  done
  gh api "repos/$app/contents/package.json" --jq .content | base64 -d | grep -q '"@upkeep-demo/stack"' \
    || { echo "  main is not on @upkeep-demo/stack v1: reset main by hand"; exit 1; }
done

echo "reset: waiting for running workflows to finish"
for app in $APPS; do
  while [ -n "$(gh run list -R "$app" --limit 20 --json status --jq '.[] | select(.status != "completed") | .status')" ]; do sleep 3; done
done

if [ "${BASELINE:-1}" = 1 ]; then
  echo "reset: baseline, ci on main must be green"
  for app in $APPS; do
    last=$(gh run list -R "$app" --workflow ci.yml --branch main --limit 1 --json conclusion --jq '.[0].conclusion')
    if [ "$last" != success ]; then
      gh workflow run ci.yml -R "$app" --ref main; sleep 4
      id=$(gh run list -R "$app" --workflow ci.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')
      gh run watch "$id" -R "$app" --exit-status >/dev/null && echo "  $app ci green" || { echo "  $app ci RED on main"; exit 1; }
    else echo "  $app ci green"; fi
  done
fi
echo "reset: done"
