#!/bin/bash
# Added by Upkeep. Fails if the old Stack Auth packages or names come back after the move to Hexclave.
# Guide: __GUIDE__
# Files that still used the old names when the move was made (tests and config Upkeep never edits) are
# excluded below. Remove each exclude once that file is fixed.
set -u
fail=0
if git grep -nE "[\"'\`]@stackframe/(__PKGS__)([/\"'\`]|$)" -- . __EXCLUDES__; then
  echo "::error::An old @stackframe/* package is back. It is frozen at __FROZEN__; use @hexclave/*."
  fail=1
fi
files=$(git ls-files -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs' __EXCLUDES__)
if [ -n "$files" ]; then
  if ! printf '%s\n' "$files" | xargs perl -0ne '
    while (/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["\x27]\@hexclave\//g) {
      my $b = $1;
      while ($b =~ /(?:^|[\s,{])(?:type\s+)?(__NAMES__)\b/g) { print "$ARGV: imports the old name $1 from \@hexclave\n"; $f = 1 }
    }
    END { exit($f ? 1 : 0) }'; then
    echo "::error::Use the Hexclave* names, not the old Stack* aliases."
    fail=1
  fi
fi
exit $fail
