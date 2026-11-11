# Upkeep

Upkeep moves the public repos that are still on a provider's old SDK to its new one, and proves each move with the
repo's own type check and build, run before and after.

First target: Hexclave (was Stack Auth). In May 2026 its packages moved from `@stackframe/*` to `@hexclave/*`. The old
packages still work and are frozen. Hexclave's migration guide is the spec.

Built at c0mpiled-18, YC Startup School Hackathon, Taipei, 2026-11-11. Results land here as they are run.
