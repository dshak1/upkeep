import { headers } from "next/headers"

import { CaseCharts } from "@/components/CaseCharts"
import { Pill } from "@/components/Pill"
import { PullRequestCard } from "@/components/PullRequestCard"
import { SetupSwitch } from "@/components/SetupSwitch"
import { CLI_LINE, actionLine } from "@/lib/install"
import { loadResults } from "@/lib/results"
import { siteFrom } from "@/lib/site"

const HEADLINE = "Your code fixes itself."
const SUBLINE = "When a library you use changes, Upkeep opens the fix, only if your tests pass."

function Mark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/upkeep-lockup-on-dark.svg" alt="upkeep" width={106} height={28} className="h-7 w-auto" />
}

export default async function Page() {
  const site = siteFrom(await headers())
  const pilotUrl = process.env.NEXT_PUBLIC_PILOT_URL?.trim()
  const words = HEADLINE.split(" ")
  const results = await loadResults()

  return (
    <main className="lp relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]">
        <div
          className="absolute left-1/2 top-10 h-[520px] w-[min(900px,120vw)] -translate-x-1/2 rounded-[50%] blur-[10px]"
          style={{ background: "radial-gradient(ellipse at center, rgb(61 107 255 / 0.22) 0%, rgb(34 212 123 / 0.06) 45%, transparent 72%)" }}
        />
      </div>

      <header className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-4 sm:px-8">
        <Mark />
        <a href="https://github.com/dshak1/upkeep" className="text-[14px] text-ink-muted transition-colors hover:text-ink">
          GitHub
        </a>
      </header>

      <section aria-labelledby="hero-title" className="px-4 pt-12 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-[880px] text-center">
          <h1 id="hero-title" className="display text-balance text-[52px] leading-[1.02] text-ink sm:text-[80px] lg:text-[96px]">
            {words.map((w, i) => (
              <span key={i}>
                <span className="up-word" style={{ ["--i" as string]: i }}>
                  {w}
                </span>{" "}
              </span>
            ))}
          </h1>
          <p className="up-rise mx-auto mt-6 max-w-[36ch] text-pretty text-[18px] leading-[1.5] text-ink-muted sm:text-[21px]" style={{ ["--d" as string]: "300ms" }}>
            {SUBLINE}
          </p>
        </div>

        <div className="up-rise mx-auto mt-12 max-w-[640px] text-center" style={{ ["--d" as string]: "450ms" }}>
          <SetupSwitch actionLine={actionLine(site)} cliLine={CLI_LINE} />
        </div>
      </section>

      <section aria-label="A pull request Upkeep opened tonight" className="px-4 pt-20 sm:px-8 sm:pt-24">
        <PullRequestCard />
        <p className="mx-auto mt-4 max-w-[48ch] text-center text-[13px] leading-[1.6] text-ink-muted">
          Tonight's change to Hexclave&apos;s own starter template, as the pull request Upkeep opens.
        </p>
      </section>

      <section aria-labelledby="case-title" className="px-4 pb-8 pt-24 sm:px-8 sm:pt-32">
        <div className="mx-auto max-w-[1080px]">
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
            <CaseCharts results={results} />
          </div>
        </div>
      </section>

      <section aria-labelledby="pilot-title" className="px-4 pb-28 pt-20 sm:px-8">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 id="pilot-title" className="display text-balance text-[30px] leading-[1.12] sm:text-[40px]">
            One repo, one month, every fix as a pull request.
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3">
            {pilotUrl ? (
              <Pill href={pilotUrl} kind="utility" tone="accent">
                Start a solo pilot, $49
              </Pill>
            ) : (
              <>
                <Pill kind="utility" tone="accent" disabled aria-disabled className="cursor-not-allowed opacity-45 hover:bg-accent">
                  Start a solo pilot, $49
                </Pill>
                <span className="lp-mono text-[12px] text-ink-muted">Checkout opens tonight.</span>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1080px] items-center justify-between border-t border-hairline px-4 py-6 text-[13px] text-ink-muted sm:px-8">
        <Mark />
        <span>Built in Taipei, November 2026</span>
      </footer>
    </main>
  )
}
