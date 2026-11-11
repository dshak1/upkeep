# Upkeep brand

## The idea in one line

**Old SDK to new SDK. Green before, green after.**

Every SDK migration tool says "it works". Upkeep shows the repo's own type check and build, run before and after the
move. The brand is the receipt: proof first, claims never.

## Logo

| File | Use |
|---|---|
| `logo/upkeep-mark.svg` | Primary mark. App icon, favicon, avatar. |
| `logo/upkeep-mark-green.svg` | Mark on dark backgrounds. |
| `logo/upkeep-mark-light.svg` | Mark on light or busy backgrounds. |
| `logo/upkeep-glyph.svg` | Check-arrow alone, no tile. Tiny sizes, inline in text. |
| `logo/upkeep-lockup.svg` | Mark plus wordmark, on light backgrounds. |
| `logo/upkeep-lockup-on-dark.svg` | Mark plus wordmark, on dark backgrounds. |
| `logo/upkeep-wordmark.svg` | Wordmark alone. |

The mark is a check whose long stroke turns into an arrow: checked, and moved up. The wordmark is "upkeep" in lowercase
Inter Display Bold, tracking -3.5%, outlined to paths so it renders the same everywhere.

Rules: keep clear space of one quarter of the tile on every side. Do not recolor the check outside the palette, rotate
it, add shadows or put the ink tile on an ink background (use the green tile there).

## Color

| Name | Hex | Meaning |
|---|---|---|
| Ink | `#0C1116` | Background, text on light |
| Paper | `#F5F2EA` | Text on dark, light background |
| Proof green | `#22D47B` | A check that passed. Only for things that are actually green. |
| Frozen amber | `#F2A93B` | The old SDK, the thing being moved away from. |
| Slate | `#5B6573` | Secondary text on light |
| Mist | `#A9B3BF` | Secondary text on dark |

Green is earned. Never use it for decoration or for a number that is not a passing check.

## Type

- Headlines: Inter Display Bold, tight tracking (-2%).
- Data, commands, repo names, receipts: JetBrains Mono.
- Both are free (SIL OFL).

## Voice

- Short, plain, specific. "9 files, +15 / -15, type check green before and after." Not "seamless migrations at scale".
- Every number comes from `runs/results.jsonl`. If it is not in the file, it does not go in a post.
- Say what was left for a human. Showing the limits is what makes the green believable.
- No em dashes, no hype words (revolutionary, magic, effortless, 10x), no emoji walls.
- Credit the provider and its migration guide. Upkeep follows the guide; it did not invent the change.

## Social kit

Rebuild everything with `node brand/render.mjs` after every run. The cards read `runs/results.jsonl`, so they cannot
show a number the run did not produce.

| File | Size | Where |
|---|---|---|
| `social/avatar.png` | 400 x 400 | X, GitHub org, LinkedIn page, Discord |
| `social/x-header.png` | 1500 x 500 | X header (left side kept clear for the avatar) |
| `social/linkedin-banner.png` | 1584 x 396 | LinkedIn page and personal banners |
| `social/og.png` | 1280 x 640 | GitHub social preview, link previews |
| `social/card-scoreboard.png` | 1080 x 1350 | Totals post on X, LinkedIn, Instagram |
| `social/card-<repo>.png` | 1080 x 1350 | One receipt per moved repo |
| `social/stats.json` | | The totals the scoreboard card used |
