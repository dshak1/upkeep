#!/bin/bash
# box.sh <dir> <command...>
# Runs a command from a stranger's repo with no network, an empty home directory and only <dir> writable.
# Nothing else from this machine is visible: no ~/.config, ~/.ssh, ~/.npmrc, tokens or environment.
set -e
T=$(realpath "$1"); shift
HERE=$(dirname "$(realpath "$0")")
NODE_DIR=$(dirname "$(readlink -f "$(command -v node)")")
exec bwrap --die-with-parent --unshare-net --unshare-pid --unshare-ipc --new-session \
  --ro-bind /usr /usr --ro-bind /etc /etc --symlink usr/bin /bin --symlink usr/lib /lib --symlink usr/lib64 /lib64 \
  --proc /proc --dev /dev --tmpfs /tmp --tmpfs /home --dir /home/box \
  --ro-bind "$NODE_DIR/.." "$NODE_DIR/.." \
  --ro-bind "$HERE/fonts-mock.cjs" /opt/upkeep/fonts-mock.cjs \
  --bind "$T" /work --chdir /work \
  --clearenv --setenv PATH "/work/node_modules/.bin:$NODE_DIR:/usr/bin" --setenv HOME /home/box \
  --setenv CI 1 --setenv NEXT_TELEMETRY_DISABLED 1 --setenv NODE_OPTIONS --max-old-space-size=4096 \
  --setenv NEXT_FONT_GOOGLE_MOCKED_RESPONSES /opt/upkeep/fonts-mock.cjs \
  --setenv NEXT_PUBLIC_STACK_PROJECT_ID 00000000-0000-4000-8000-000000000000 \
  --setenv NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY pck_placeholder \
  --setenv STACK_SECRET_SERVER_KEY ssk_placeholder \
  "$@"
