#!/usr/bin/env bash
# Opens every signup page from brand/ACCOUNTS.md in your default browser, in sprint order.
# Run on your own computer: bash brand/open-signups.sh
urls=(
  https://x.com/i/flow/signup
  "https://github.com/account/organizations/new?plan=free"
  https://www.linkedin.com/company/setup/new/
  https://bsky.app/
  https://www.instagram.com/accounts/emailsignup/
  https://www.threads.net/
  https://news.ycombinator.com/login
  https://www.producthunt.com/
  https://dev.to/enter
  https://hashnode.com/onboard
  https://www.reddit.com/register/
  https://discord.com/register
  https://fosstodon.org/auth/sign_up
  https://app.daily.dev/
  https://peerlist.io/
  https://www.indiehackers.com/sign-up
  https://www.youtube.com/create_channel
  https://www.tiktok.com/signup
  https://www.facebook.com/pages/create
)
opener=open; command -v open >/dev/null || opener=xdg-open
for u in "${urls[@]}"; do "$opener" "$u"; sleep 0.3; done
