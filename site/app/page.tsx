import { headers } from "next/headers"

import { ChartCards } from "@/components/ChartCards"
import { FlickeringGrid } from "@/components/FlickeringGrid"
import { InstallPill } from "@/components/InstallPill"
import { Pill } from "@/components/Pill"
import { PullRequestCard } from "@/components/PullRequestCard"
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
    <Pill href={url} kind="utility" tone="accent">
      Start a founding pilot, $5
    </Pill>
  ) : (
    <span className="inline-flex flex-col items-start gap-1.5">
      <Pill kind="utility" tone="accent" disabled aria-disabled className="cursor-not-allowed opacity-45 hover:bg-accent">
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
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col">
        <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden bg-paper">
          <div className="aurora aurora-blue right-[-10%] top-[-20%] h-[70vh] w-[60vw]" />
          <div className="aurora aurora-amber right-[15%] top-[25%] h-[45vh] w-[40vw]" />
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_75%_at_75%_30%,#000_25%,transparent_80%)]">
            <FlickeringGrid />
          </div>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[55%] bg-gradient-to-t from-paper via-paper/80 to-transparent" />

        <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 sm:px-10">
          <Mark />
          <a href="https://github.com/dshak1/upkeep" className="text-[14px] text-ink/80 transition-colors hover:text-ink">
            GitHub
          </a>
        </header>

        <div className="mx-auto mt-auto w-full max-w-[1280px] px-4 pb-12 sm:px-10 sm:pb-16">
          <h1 id="hero-title" className="display max-w-[14ch] text-[48px] leading-[1.04] text-ink sm:text-[80px] lg:text-[104px]">
            <span className="up-word block" style={{ ["--i" as string]: 0 }}>
              Libraries <VerbCycle />
            </span>
            <span className="up-word block" style={{ ["--i" as string]: 3 }}>
              Your code keeps up.
            </span>
          </h1>
          <div className="up-rise mt-9 flex flex-col items-start gap-4 lg:flex-row lg:items-start" style={{ ["--d" as string]: "450ms" }}>
            <InstallPill actionLine={actionLine(site)} cliLine={CLI_LINE} />
            <PilotButton url={pilotUrl} />
          </div>
        </div>
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
            Hexclave renamed its library in May. Four in ten installs never moved.
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
