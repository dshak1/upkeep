# Account setup sprint (2.5 hours)

Everything you need to copy, paste and upload. Images are in `brand/social/` and `brand/logo/`.

## Before you start (10 min)

- **Handle: `useupkeep`** everywhere. It fits every platform's limit (X allows 15 characters). On GitHub, `upkeep`,
  `upkeepdev`, `upkeephq` and `getupkeep` are taken; `useupkeep` looked free on 2026-11-11. If it is taken somewhere,
  use `upkeepcode`, and keep that fallback the same everywhere it is needed.
- **One shared email** for all company accounts (a new Gmail, or `hello@` on a domain if you have one). Turn on 2FA and
  save every login in one shared password manager vault.
- **Name check:** a large maintenance software company is already called UpKeep. Always write "Upkeep" next to "SDK
  migrations" or "open source" so people do not mix the two up, and avoid the plain `upkeep` handle.
- **Display name:** `Upkeep` (on X: `Upkeep · SDK migrations`).
- **Link:** `https://github.com/dshak1/upkeep` until there is a website.

## Bios (checked against each limit)

| Use | Text | Length |
|---|---|---|
| X (160) | We move repos off frozen SDKs and prove it: your own type check and build, run before and after, in a sandbox. Open source. Built at YC Startup School Taipei. | 158 |
| Bluesky, Threads, Mastodon, dev.to, Hashnode, Discord | same as X | 158 |
| LinkedIn tagline (120) | Moves repos off frozen SDKs, proved by each repo's own type check and build. Open source. | 89 |
| GitHub org (160) | Moves repos off frozen SDKs and proves each move with the repo's own type check and build, run before and after. | 112 |
| Instagram (150) | Old SDK → new SDK. / Green before. Green after. / Open source SDK migrations, proved by your own build. (one line each) | 99 |
| TikTok, short (80) | SDK migrations, proved by your repo's own build. Green before, green after. | 75 |

**Long description** (LinkedIn About, YouTube About, Product Hunt, Discord, GitHub org README):

> When an SDK renames its packages, every app on the old ones has to move. Upkeep moves them and proves it: the repo's
> own type check and build, run before the move and after it, in a sandbox with no network and an empty home
> directory. Every result is published, including the ones that fail. First provider: Hexclave (was Stack Auth),
> following its migration guide. Built at c0mpiled-18, YC Startup School Hackathon, Taipei. MIT licensed.

## Images

| Slot | File |
|---|---|
| Every avatar / logo / server icon | `social/avatar.png` (or `logo/upkeep-mark.png`, 512 px) |
| X header | `social/x-header.png` |
| LinkedIn page cover, Bluesky banner, Mastodon header, Discord banner | `social/linkedin-banner.png` |
| YouTube banner | `social/youtube-banner.png` |
| GitHub social preview, Product Hunt gallery, dev.to cover | `social/og.png` |
| First post image | `social/card-hexclave__multi-tenant-starter-template.png` and `social/card-scoreboard.png` |

Open every signup page at once: `bash brand/open-signups.sh` (on your own computer).

## The sprint, in order

### 0:10 to 0:45, tier 1: where developers will look for you

| # | Platform | Sign up | Notes |
|---|---|---|---|
| 1 | X | x.com/i/flow/signup | Brand account. Founders follow it, then repost from their own accounts. Pin the launch thread. |
| 2 | GitHub org | github.com/account/organizations/new (Free) | Name `useupkeep`. Add org README with the long description. Do not move the repo yet; agree on that as a team first. |
| 3 | LinkedIn page | linkedin.com/company/setup/new | Needs a founder's personal profile as admin. Type: small business, industry: Software Development. Both founders list Upkeep as their job. |
| 4 | Bluesky | bsky.app | Big developer audience. |
| 5 | Instagram, then Threads | instagram.com, then threads.net with the same login | Threads comes free with Instagram. |

### 0:45 to 1:15, tier 2: developer communities

| # | Platform | Sign up | Notes |
|---|---|---|---|
| 6 | Hacker News | news.ycombinator.com/login | Founder account (personal name, not the brand). Making it today means it is not brand new on Show HN day. Do not post yet. |
| 7 | Product Hunt | producthunt.com | Founder account plus a maker profile. Follow and comment for a few weeks before launch day. |
| 8 | dev.to | dev.to/enter | Brand account. Write-up goes here on day 3. |
| 9 | Hashnode | hashnode.com | Same write-up, set the canonical URL to the dev.to post. |
| 10 | Reddit | reddit.com/register | Make `u/useupkeep` to hold the name, but post from a founder's older account. New accounts with links get auto-removed in most subreddits. |
| 11 | Discord server | discord.com | Server "Upkeep", channels: #announcements, #results, #requests (people ask for the next SDK). Then join Hexclave's Discord with a founder account. |
| 12 | Mastodon | fosstodon.org (open source focus; approval can take a day) | If it waits, use mastodon.social. |
| 13 | daily.dev, Peerlist, Indie Hackers | app.daily.dev, peerlist.io, indiehackers.com | Founder profiles, link the repo. Quick wins for developer reach. |

### 1:15 to 1:30, tier 3: video

| # | Platform | Notes |
|---|---|---|
| 14 | YouTube | Brand account channel, handle `@useupkeep`. Shorts for the 30 second recording. |
| 15 | TikTok | Same recording, vertical. Developer content does fine there; low effort since the video is shared. |

### 1:30 to 2:30, go live

1. **Record the 30 second video** (15 min). Screen record `node src/cli.ts run` on the starter template, cut to the before
   and after lines. Captions: "Stack Auth became Hexclave." / "Upkeep moves the code." / "Type check: green to green." /
   "Build: green to green." / "github.com/dshak1/upkeep". Export 1080 x 1920 for Shorts, TikTok, Reels; 1920 x 1080 for X
   and LinkedIn.
2. **Post the launch** (20 min). X thread and LinkedIn post from `CAMPAIGN.md`, word for word, with both cards. Pin both.
   Then the short versions below.
3. **Hexclave** (10 min). Post the receipt in their Discord or GitHub Discussions and DM a Hexclave founder on X. Text in
   `CAMPAIGN.md`, day 2. Doing it today is fine; it is the most valuable message of the day.
4. **Cross-post** (15 min). Everything below.

## Short posts for the other platforms

**Bluesky / Threads / Mastodon** (under 300 characters)

> Built at YC Startup School Hackathon, Taipei: Upkeep moves repos off frozen SDKs and proves it with the repo's own
> type check and build, before and after. First receipt: 9 files, green to green, 0 left for a human.
> github.com/dshak1/upkeep

**Instagram** (card-scoreboard, then the receipt card, as a carousel)

> Stack Auth renamed itself Hexclave. Every app on the old packages has homework.
> Upkeep does the homework, then proves it: same type check, same build, before and after.
> First repo: green before, green after. Link in bio.

**YouTube Shorts / TikTok / Reels caption**

> Green before. Green after. Upkeep moves your code to the new SDK and runs your own build to prove it. #typescript
> #nextjs #opensource #webdev

**Discord #announcements**

> Upkeep is live. First result: hexclave/multi-tenant-starter-template moved from `@stackframe/stack` to
> `@hexclave/next`, type check and build green before and after, 9 files, 0 left for a human. Tell us in #requests
> which SDK rename hurts you, we pick the next one from there.

## After the sprint

- Put every account link in the README and the GitHub org profile.
- Once the accounts exist, a scheduler (for example Metricool) can post the weekly receipts to all of them at once.
- Write today's follower and star counts in a note as the baseline. Week 1 scoreboard compares against it.
