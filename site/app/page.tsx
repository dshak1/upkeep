import { headers } from "next/headers"

import { ChartCards } from "@/components/ChartCards"
import { InstallPill } from "@/components/InstallPill"
import { Pill } from "@/components/Pill"
import { PullRequestCard } from "@/components/PullRequestCard"
import { TerminalDemo } from "@/components/TerminalDemo"
import { VerbCycle } from "@/components/VerbCycle"
import { CLI_LINE, actionLine } from "@/lib/install"
import { loadResults } from "@/lib/results"
import { siteFrom } from "@/lib/site"

function Mark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/upkeep-lockup-on-dark.svg" alt="upkeep" width={106} height={28} className="h-7 w-auto" />
}

function PilotButton({ url }: { url?: string }) {
  return url ? (
    <Pill href={url} kind="utility" tone="paper">
      Start a founding pilot, $5
    </Pill>
  ) : (
    <span className="inline-flex flex-col items-center gap-1.5">
      <Pill kind="utility" tone="paper" disabled aria-disabled className="cursor-not-allowed opacity-50">
        Start a founding pilot, $5
      </Pill>
      <span className="lp-mono pl-1 text-[11.5px] text-ink-muted">Checkout opens tonight.</span>
    </span>
  )
}

export default async function Page() {
  const site = siteFrom(await headers())
  const pilotUrl = process.env.NEXT_PUBLIC_PILOT_URL?.trim()
  const results = await loadResults()

  return (
    <main className="lp relative overflow-hidden">
      <section aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-black">
        <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 sm:px-10">
          <Mark />
          <a href="https://github.com/dshak1/upkeep" className="text-[14px] text-ink/80 transition-colors hover:text-ink">
            GitHub
          </a>
        </header>

        <div className={`td-cam mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-4 pb-16 pt-6 text-center sm:px-10`}>
          <h1 id="hero-title" className="display text-[44px] leading-[1.04] text-white sm:text-[72px] lg:text-[88px]">
            <span className="up-word block" style={{ ["--i" as string]: 0 }}>
              Libraries <VerbCycle />
            </span>
            <span className="up-word block" style={{ ["--i" as string]: 3 }}>
              Your code keeps up.
            </span>
          </h1>
          <div className="mt-12 w-full sm:mt-16">
            <TerminalDemo />
          </div>
          <p className="up-rise mt-10 text-[17px] text-ink-muted sm:text-[19px]" style={{ ["--d" as string]: "300ms" }}>
            One line in your terminal. Never migrate by hand again.
          </p>
          <div className="up-rise mt-8 flex flex-col items-center gap-3" style={{ ["--d" as string]: "500ms" }}>
            <PilotButton url={pilotUrl} />
            <a href="#install" className="text-[13px] text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Or add it as a GitHub Action
            </a>
          </div>
        </div>
      </section>

      <section id="install" aria-label="Install" className="flex justify-center bg-black px-4 pb-20 sm:px-8">
        <InstallPill actionLine={actionLine(site)} cliLine={CLI_LINE} />
      </section>

      <section aria-label="A pull request Upkeep opened tonight" className="px-4 pt-20 sm:px-8 sm:pt-24">
        <PullRequestCard />
        <p className="mx-auto mt-4 max-w-[48ch] text-center text-[13px] leading-[1.6] text-ink-muted">
          Tonight's change to Hexclave&apos;s own starter template, as the pull request Upkeep opens.
        </p>
      </section>

      <section aria-labelledby="case-title" className="px-4 pb-8 pt-24 sm:px-8 sm:pt-32">
        <div className="mx-auto max-w-[1280px]">
          <p className="lp-mono text-[12px] uppercase tracking-[0.08em] text-frozen">The Hexclave case</p>
          <h2 id="case-title" className="display mt-4 max-w-[22ch] text-balance text-[32px] leading-[1.08] sm:text-[48px]">
            Hexclave renamed its SDK in May. Most of the code using it never moved.
          </h2>
          <p className="mt-5 max-w-[60ch] text-pretty text-[16px] leading-[1.6] text-ink-muted sm:text-[17px]">
            On May 27, <span className="lp-mono text-[0.92em] text-ink">@stackframe/stack</span> became{" "}
            <span className="lp-mono text-[0.92em] text-ink">@hexclave/next</span>. The old package still installs, so nothing breaks, and
            nobody moves.
          </p>
          <div className="mt-12">
            <ChartCards results={results} />
          </div>
        </div>
      </section>

      <section aria-labelledby="pilot-title" className="px-4 pb-28 pt-20 sm:px-8">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 id="pilot-title" className="display text-balance text-[30px] leading-[1.12] sm:text-[40px]">
            One repo, one month, every fix as a pull request.
          </h2>
          <div className="mt-8 flex justify-center">
            <PilotButton url={pilotUrl} />
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1280px] items-center justify-between border-t border-hairline px-4 py-6 text-[13px] text-ink-muted sm:px-8">
        <Mark />
        <span>Built in Taipei, November 2026</span>
      </footer>
    </main>
  )
}
