You are setting up Upkeep's social media accounts with me, live, in my browser. We have about 2 hours. Speed matters,
but nothing gets posted that is not true.

## Context

Upkeep is an open source tool, built today at c0mpiled-18 (YC Startup School Hackathon, Taipei). It moves repos off a
frozen SDK to the new one, and proves each move by running the repo's own type check and build before and after, in a
sandbox. First provider: Hexclave (was Stack Auth), `@stackframe/*` to `@hexclave/*`.

Repo: github.com/dshak1/upkeep, branch `claude/confident-brahmagupta-tbmzby`. Pull it first. Everything you need is in
`brand/`:
- `brand/ACCOUNTS.md`: handle, display name, bio for each platform (already sized to each limit), which image goes
  where, the order to go in, and the first post for each platform.
- `brand/CAMPAIGN.md`: the launch X thread, the LinkedIn post and the Hexclave message (Week 1, Day 1 and Day 2).
- `brand/BRAND.md`: voice rules.
- `brand/social/` and `brand/logo/`: avatar, banners, results cards. Rebuild them with `node brand/render.mjs` if
  `runs/results.jsonl` changed.

## How we work

1. Use the browser (Claude in Chrome or the built-in browser). Open each platform in its own tab, in the order in
   `brand/ACCOUNTS.md`.
2. I log in and sign up myself. If a page needs a login, a signup form, a password, an email or phone code, a captcha or
   accepting terms, stop, tell me which tab, and wait until I say "done". Never type a password or code, and never
   accept terms for me.
3. Once I'm logged in, set up the profile yourself: handle `useupkeep` (fallback `upkeepcode` if taken; tell me before
   using the fallback), display name, bio, website link `https://github.com/dshak1/upkeep`, avatar, banner. Use the
   exact text and files from `brand/ACCOUNTS.md`.
4. Then post that platform's first post from `brand/ACCOUNTS.md` or `brand/CAMPAIGN.md`, with its image, and pin it
   where the platform allows. I approve these prepared texts now, as written. Anything you change or write new: show me
   first and wait for "go".
5. Write each finished account's URL into `brand/LINKS.md` (platform, URL, handle, what was posted, post URL), then
   move to the next tab without waiting for me.
6. When you are blocked on me, work on another tab meanwhile, and tell me in one line what you need.

## Rules

- Every number in a post comes from `runs/results.jsonl` (right now: 1 repo attempted, 1 moved, 9 files, +15 / -15,
  type check 3.1s to 3.1s, build 43.8s to 47.3s, 0 left for a human). No user counts, no invented numbers, no "dozens".
- No em dashes, no hype words, no emoji walls. Follow `brand/BRAND.md`.
- No mass following, no mass DMs, no asking anyone for upvotes, nothing automated that looks like a bot. A few relevant
  follows per platform is fine (Hexclave, its founders, YC Startup School).
- Hacker News: create the account only, do not post (Show HN is week 4).
- Reddit: create `u/useupkeep` to hold the name only. Do not post from it.
- Product Hunt: create the account and maker profile only, do not launch.
- Do not open pull requests or issues on anyone else's repo (rule in `AGENTS.md`).
- Do not move the repo to the new GitHub org or change its settings without asking me.
- Do not change account security, payment or privacy settings.

## When all platforms are done

1. Add an "Find us" section to `README.md` with every link from `brand/LINKS.md`.
2. Commit with a clear message and push to `claude/confident-brahmagupta-tbmzby`.
3. Give me a table: platform, status (live / waiting on me / skipped and why), profile URL, first post URL.
4. Note today's follower count and repo star count in `brand/LINKS.md` as the baseline.

Start now: pull the branch, read `brand/ACCOUNTS.md`, open the first tab (X), and tell me what you need from me.
