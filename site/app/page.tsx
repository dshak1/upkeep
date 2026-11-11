import { headers } from "next/headers"

import { Pill } from "@/components/Pill"
import { RollLine } from "@/components/RollLine"
import { SetupSwitch } from "@/components/SetupSwitch"
import { CLI_LINE, actionLine } from "@/lib/install"
import { siteFrom } from "@/lib/site"

const HEADLINE =
  "When a library your app uses changes, Upkeep automatically opens a pull request that fixes your code, and only if your own tests still pass."

const NUMBERS = [
  {
    figure: "41%",
    text: "of last week's Hexclave installs were still the old package.",
    href: "https://www.npmjs.com/package/@stackframe/stack",
  },
  {
    figure: "447",
    text: "public repos still import the old name.",
    href: "https://github.com/search?q=%22%40stackframe%2Fstack%22+path%3Apackage.json&type=code",
  },
  {
    figure: "Tonight",
    text: "Hexclave's own starter template moved to the new name, its build green before and after.",
    href: "https://github.com/dshak1/upkeep#results",
  },
]

function Mark() {
  return (
    <span className="text-[17px] font-semibold tracking-[-0.02em]">
      Upkeep<span className="text-accent">.</span>
    </span>
  )
}

export default async function Page() {
  const site = siteFrom(await headers())
  const pilotUrl = process.env.NEXT_PUBLIC_PILOT_URL?.trim()
  const words = HEADLINE.split(" ")

  return (
    <main className="lp relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]">
        <div
          className="absolute left-1/2 top-10 h-[520px] w-[min(900px,120vw)] -translate-x-1/2 rounded-[50%] blur-[10px]"
          style={{ background: "radial-gradient(ellipse at center, #ffe3cc88 0%, #eef1ffcc 45%, transparent 72%)" }}
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
          <h1 id="hero-title" className="text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[48px] lg:text-[54px]">
            {words.map((w, i) => (
              <span key={i}>
                <span className="up-word" style={{ ["--i" as string]: i }}>
                  {w}
                </span>{" "}
              </span>
            ))}
          </h1>
          <RollLine className="up-rise mx-auto mt-7 text-[19px] font-medium tracking-[-0.01em] sm:text-[24px]" />
        </div>

        <div className="up-rise mx-auto mt-12 max-w-[640px] text-center" style={{ ["--d" as string]: "450ms" }}>
          <SetupSwitch actionLine={actionLine(site)} cliLine={CLI_LINE} />
        </div>
      </section>

      <section aria-labelledby="case-title" className="px-4 pb-8 pt-24 sm:px-8 sm:pt-32">
        <div className="mx-auto max-w-[1080px]">
          <h2 id="case-title" className="lp-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted">
            Hexclave renamed its SDK in May
          </h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-[10px] border border-hairline bg-hairline sm:grid-cols-3">
            {NUMBERS.map((n) => (
              <a key={n.figure} href={n.href} className="group block bg-paper p-6 transition-colors hover:bg-paper-raised sm:p-8">
                <div className="text-[44px] font-semibold leading-none tracking-[-0.04em] text-ink sm:text-[52px]">{n.figure}</div>
                <p className="mt-4 max-w-[30ch] text-[15px] leading-[1.55] text-ink-muted group-hover:text-ink">{n.text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="pilot-title" className="px-4 pb-28 pt-20 sm:px-8">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 id="pilot-title" className="text-balance text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[36px]">
            One repo, one month, every fix as a pull request.
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3">
            {pilotUrl ? (
              <Pill href={pilotUrl} kind="utility" tone="ink">
                Start a solo pilot, $49
              </Pill>
            ) : (
              <>
                <Pill kind="utility" tone="ink" disabled aria-disabled className="cursor-not-allowed opacity-50 hover:bg-ink">
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
