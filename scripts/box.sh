#!/bin/bash
# box.sh <dir> <command...>
# Runs a command from a stranger's repo with no network, an empty home directory and only <dir> writable.
# Nothing else from this machine is visible: no ~/.config, ~/.ssh, ~/.npmrc, tokens or environment.
# Linux uses bwrap. macOS has no bwrap, so it uses sandbox-exec with the same rules (loopback only, as in bwrap's empty network).
set -e
T=$(realpath "$1"); shift
HERE=$(dirname "$(realpath "$0")")
NODE_DIR=$(dirname "$(realpath "$(command -v node)")")

if [ "$(uname)" = Darwin ]; then
  BOXTMP=$(mktemp -d /private/tmp/upkeep-box.XXXXXX)
  trap 'rm -rf "$BOXTMP"' EXIT
  mkdir -p "$BOXTMP/home" "$BOXTMP/tmp"
  cp "$HERE/fonts-mock.cjs" "$BOXTMP/fonts-mock.cjs"   # inside the box, so nothing of this repo's folder is readable
  NODE_ROOT=$(realpath "$NODE_DIR/..")
  PROFILE="(version 1)
(allow default)
(deny network*)
(allow network* (remote unix-socket))
(allow network-outbound (remote ip \"localhost:*\"))
(allow network-bind network-inbound (local ip \"localhost:*\"))
(deny mach-lookup (global-name \"com.apple.dnssd.service\"))
(deny file-write*)
(allow file-write* (subpath \"$T\") (subpath \"$BOXTMP\") (literal \"/dev/null\") (literal \"/dev/tty\") (regex #\"^/dev/fd/\"))
(deny file-read-data (subpath \"$HOME\") (subpath \"/Users\") (subpath \"/Volumes\") (subpath \"/nix\") (subpath \"/private/var/folders\") (subpath \"/private/tmp\"))
(allow file-read-data (subpath \"$T\") (subpath \"$BOXTMP\") (subpath \"$NODE_ROOT\"))"
  cd "$T"

  set +e
  env -i PATH="$T/node_modules/.bin:$NODE_DIR:/usr/bin:/bin" HOME="$BOXTMP/home" TMPDIR="$BOXTMP/tmp" \
    CI=1 NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=4096 \
    NEXT_FONT_GOOGLE_MOCKED_RESPONSES="$BOXTMP/fonts-mock.cjs" \
    NEXT_PUBLIC_STACK_PROJECT_ID=00000000-0000-4000-8000-000000000000 \
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_placeholder \
    STACK_SECRET_SERVER_KEY=ssk_placeholder \
    sandbox-exec -p "$PROFILE" "$@"
  exit $?
fi

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
