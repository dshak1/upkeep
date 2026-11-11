# Upkeep launch campaign

## Where we actually are (2026-11-11)

From `runs/results.jsonl` (last run per repo): 5 repos attempted, 3 built before the move, and all 3 still build after it
with none of the old package left (41 files, 146 lines changed across the 3). 9 more repos are queued in
`targets/hexclave.tsv`.

Users: none yet, and nothing measures them yet. So the campaign does not lead with user numbers. It leads with the one
thing nobody else in this space shows: the receipt. Every week the scoreboard grows from real runs, and the follower
and star counts follow the proof.

## The angle

Every SDK rename leaves thousands of repos on frozen packages. Codemods exist; nobody trusts them, because nobody shows
the build. Upkeep's whole story fits in one card: old package in amber, new package in green, type check and build
green before and green after, run in a sandbox with no network.

Hook for every post: **"Green before. Green after. Here is the receipt."**

## Goals for the first 30 days

Targets, not results. Report the real number every week, even when it misses.

| Metric | Source | 30-day target |
|---|---|---|
| Repos moved | `runs/results.jsonl` | All 14 in `targets/hexclave.tsv` attempted |
| Second provider spec | `specs/` | 1 more rename shipped |
| GitHub stars | repo page | 300 |
| Followers, X + LinkedIn combined | profiles | 1,000 |
| Conversations with SDK providers | own log | 5 |
| Maintainers who said yes to the patch | own log | 3 |

The last two are the ones that become a business. Providers (Hexclave first) want their users off the old SDK; they are
the buyer. Stars and followers are how they hear about us.

## Week 0: set up (today, about 1 hour)

1. Upload `brand/social/og.png` as the GitHub social preview (repo Settings, Social preview).
2. Add a description and topics to the repo: `codemod`, `migration`, `sdk`, `typescript`, `nextjs`, `stack-auth`, `hexclave`.
3. Put the lockup at the top of the README (`brand/logo/upkeep-lockup.svg`).
4. Claim `@upkeepdev` (or the closest free handle) on X, LinkedIn page, GitHub org, Bluesky. Avatar: `social/avatar.png`.
   Headers: `social/x-header.png`, `social/linkedin-banner.png`.
5. Founders post from personal accounts first. A brand account with zero followers gets zero reach; people follow people.
6. Make a 30 second screen recording: `node src/cli.ts run` on one repo, cut to the green before and green after lines.
   No voiceover needed, captions only. This is the asset that gets shared.

## Week 1: the hackathon launch

**Day 1, X thread (founder account)**

> We built Upkeep at YC Startup School Hackathon in Taipei today.
>
> Stack Auth renamed itself Hexclave. Every `@stackframe/*` package is frozen. Every repo using them now has homework.
>
> Upkeep does the homework, then proves it: the repo's own type check and build, run before and after.

> First receipt: hexclave/multi-tenant-starter-template
> 9 files, +15 / -15
> type check: green 2.2s → green 4.9s
> build: green 22s → green 24.6s
> left for a human: 0
> [card-hexclave__multi-tenant-starter-template.png]

> The build runs in a sandbox: no network, empty home dir. If the move broke something, the after column goes red and we
> say so. Next: the other 9 repos on the list. Scoreboard every week.
> github.com/dshak1/upkeep

**Day 1, LinkedIn (each founder, personal)**

> Today at YC Startup School Hackathon in Taipei we built Upkeep.
>
> When an SDK renames its packages, every app on the old ones has to move. Migration tools promise it works. We wanted
> proof instead: Upkeep runs the repo's own type check and build before the move and after it, in a sandbox, and
> publishes both.
>
> First 5 repos: 3 built before the move, and all 3 still build after it. The other 2 did not build before, and we show
> those too.
>
> Next 30 days we run it on every public repo we can find on the old Stack Auth packages, and post every result,
> including the red ones. Code is MIT: github.com/dshak1/upkeep
> [card-scoreboard.png]

**Day 2: reach the provider.** Post the receipt in Hexclave's Discord or GitHub Discussions with a one line offer: "We
moved your starter template to `@hexclave/*` with the build green before and after. Want us to run it on the other
public repos still on `@stackframe/*`?" DM a Hexclave founder on X with the card. This is the single highest value post
of the month.

**Day 3: dev.to + Hashnode write-up.** "How we prove a codemod works: run the repo's own build before and after." Code,
the sandbox script, the Check C rules, the receipt card. Cross-post to the personal blog. Long-form gets found through
search for months.

**Day 5: Reddit, one post, value first.** r/nextjs: "If you are on @stackframe/stack, here is the exact diff to move to
@hexclave/next (and how we checked it builds)". Link the repo at the end. Read each subreddit's self-promotion rules
first; answer every comment.

## Weeks 2 and 3: the receipts loop

The engine: run, render, post. Repeat.

1. `node src/cli.ts run targets/hexclave.tsv --build`
2. `node src/cli.ts report` and `node brand/render.mjs`
3. Post each new receipt card the same day (X + LinkedIn), with one sentence on anything interesting: a repo that needed
   a human, a repo that was red before we touched it, a build that got faster or slower.
4. Every Friday: scoreboard card + "this week: N repos attempted, M moved, K red, here is why". Red results are content
   too; they make the green ones believable.

Ride-along posts (one per week, founder accounts):
- The 30 second recording.
- "What Check C catches": old imports, old names, old API host, files we promised never to touch.
- A behind the scenes post on the sandbox (`scripts/box.sh`): why the build gets no network.
- Ask the audience: "Which SDK rename hurt you most? We will pick the next spec from the replies." This picks provider
  number two and gives people a reason to reply.

## Week 4: the big launch

Only when the scoreboard is worth showing (aim: all 14 attempted, a second provider spec in `specs/`).

- **Show HN**, Tuesday to Thursday, about 8:00 to 9:00 US Pacific. Title: "Show HN: Upkeep, SDK migrations proved by the
  repo's own build". First comment from a founder: what it does, the honest limits, the full results table. Stay in the
  thread all day.
- **Product Hunt** the same week, different day. Gallery: og.png, scoreboard, two receipts, the recording.
- Post the HN link nowhere else asking for votes; just tell people it is live.
- Email or DM every provider you talked to with the final scoreboard.

## Who does what

| Owner | Job |
|---|---|
| Founder A | X thread, HN thread, provider outreach |
| Founder B | LinkedIn, dev.to write-up, Reddit |
| Agent | Runs, `report`, `render.mjs`, drafts each receipt caption from the run row |

Time cost after week 0: about 30 minutes a day.

## Rules that keep this credible

- Every number in a post comes from `runs/results.jsonl` or a public profile counter. No rounding up, no "dozens".
- No em dashes, no hype words. See `BRAND.md`.
- We do not open pull requests or issues on other people's repos unless the team changes that rule in `AGENTS.md`.
  Maintainers get the patch only if they ask for it.
- Post the red runs.

## Decisions the team needs to make

1. **Outreach to maintainers.** `AGENTS.md` forbids opening PRs or issues on other people's repos. Merged PRs from real
   maintainers would be the strongest proof there is. Options: keep the rule and only offer patches on request, or allow
   one opt-in channel (for example: ask in a discussion first, open a PR only after a yes).
2. **Handles.** Pick the brand handle and which founder accounts post.
3. **Provider number two.** Pick it from the week 3 replies, or now.
