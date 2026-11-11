import type { Results } from "@/lib/results"

/**
 * The Hexclave case in three figures, in the chart form of Rema's field notes (web/components/blog/charts.tsx):
 * server-rendered HTML and CSS, no chart library, nothing measures itself after hydration. Every value is printed
 * beside its mark, so no figure depends on colour alone and the printed values double as the table view.
 * Colours are slots 1 to 3 of the same validated palette.
 */

const OLD = "#f2a93b"
const NEW = "#f5f2ea"
const GREEN = "#22d47b"

type Bar = { label: string; detail?: string; value: number; display: string; color: string }

function Bars({ title, unit, bars, max, ticks, fmt }: { title: string; unit: string; bars: Bar[]; max: number; ticks: number[]; fmt: (n: number) => string }) {
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`
  return (
    <figure role="img" aria-label={`${title}. ${bars.map((b) => `${b.label}: ${b.display} ${unit}`).join("; ")}.`} className="m-0">
      <figcaption className="text-[13px] font-medium text-ink">{title}</figcaption>
      <ul className="mt-4 flex flex-col gap-4" aria-hidden>
        {bars.map((b) => (
          <li key={b.label}>
            <div className="flex items-baseline justify-between gap-3 text-[13px] leading-[1.35]">
              <span className="text-ink">
                {b.label}
                {b.detail ? <span className="text-ink-muted"> · {b.detail}</span> : null}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-ink">{b.display}</span>
            </div>
            <div className="mt-1.5 h-3.5 rounded-[4px] bg-[#1b232c]">
              <div title={`${b.label}: ${b.display} ${unit}`} className="h-full rounded-[4px]" style={{ width: pct(b.value), background: b.color, minWidth: b.value ? 4 : 0 }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="relative mt-2 h-4 text-[11.5px] tabular-nums text-ink-muted" aria-hidden>
        {ticks.map((t, i) => (
          <span
            key={t}
            className="absolute top-0"
            style={{ left: pct(t), transform: i === 0 ? "none" : i === ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
          >
            {fmt(t)}
          </span>
        ))}
      </div>
    </figure>
  )
}

function Row({ n, figure, lead, children, source }: { n: string; figure: string; lead: string; children: React.ReactNode; source: React.ReactNode }) {
  return (
    <div className="grid gap-8 border-t border-hairline py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:py-14">
      <div>
        <div className="lp-mono text-[12px] text-ink-muted">{n}</div>
        <div className="mt-3 display text-[56px] leading-none text-ink sm:text-[72px]">{figure}</div>
        <p className="mt-4 max-w-[34ch] text-pretty text-[16px] leading-[1.55] text-ink">{lead}</p>
      </div>
      <div className="min-w-0">
        {children}
        <p className="mt-5 text-[12.5px] leading-[1.6] text-ink-muted">{source}</p>
      </div>
    </div>
  )
}

const k = (n: number) => (n === 0 ? "0" : `${n / 1000}k`)
const plain = (n: number) => String(n)

export function CaseCharts({ results }: { results: Results | null }) {
  const moved = results?.outcomes.find((o) => o.key === "moved")?.value ?? 0
  const top = results ? Math.max(1, ...results.outcomes.map((o) => o.value)) : 1
  const step = top <= 5 ? 1 : top <= 10 ? 2 : 5
  const max = Math.ceil(top / step) * step
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step)

  return (
    <div>
      <Row
        n="01 · installs"
        figure="41%"
        lead="of last week's installs were still the old name, five months after the rename."
        source={
          <>
            npm weekly downloads, Nov 3 to 9, 2026:{" "}
            <a className="underline underline-offset-2 hover:text-ink" href="https://www.npmjs.com/package/@stackframe/stack">
              @stackframe/stack
            </a>{" "}
            and{" "}
            <a className="underline underline-offset-2 hover:text-ink" href="https://www.npmjs.com/package/@hexclave/next">
              @hexclave/next
            </a>
            .
          </>
        }
      >
        <Bars
          title="Installs in one week"
          unit="installs"
          max={30000}
          ticks={[0, 10000, 20000, 30000]}
          fmt={k}
          bars={[
            { label: "Old name", detail: "@stackframe/stack", value: 17866, display: "17,866", color: OLD },
            { label: "New name", detail: "@hexclave/next", value: 26163, display: "26,163", color: NEW },
          ]}
        />
      </Row>

      <Row
        n="02 · public code"
        figure="447"
        lead="public repos on GitHub still list the old package, and some of them shipped this month."
        source={
          <>
            GitHub code search for <span className="lp-mono">@stackframe/stack</span> in package.json, Nov 11, 2026: the first 500 of 826 hits, forks
            left out. Search stops at 1,000 results, so the real count is higher.
          </>
        }
      >
        <Bars
          title="Public repos still on the old name"
          unit="repos"
          max={500}
          ticks={[0, 100, 200, 300, 400, 500]}
          fmt={plain}
          bars={[
            { label: "List the old package", value: 447, display: "447", color: OLD },
            { label: "Not counting 3 copies of Hexclave's own code", value: 444, display: "444", color: OLD },
            { label: "Pushed since August 1", value: 50, display: "about 50", color: OLD },
            { label: "Pushed since October 1", value: 30, display: "about 30", color: OLD },
          ]}
        />
      </Row>

      <Row
        n="03 · tonight"
        figure={results ? `${moved} of ${results.total}` : "Tonight"}
        lead={
          results?.starter?.buildGreen
            ? `repos Upkeep tried tonight moved with their own checks passing. One is Hexclave's own starter template: ${results.starter.files ?? "its"} files changed, its build green before and after.`
            : "Hexclave's own starter template moved to the new name, its build green before and after."
        }
        source={
          <>
            Each repo is installed, type-checked and built before and after the change, in a sandbox with no network. Every row:{" "}
            <a className="underline underline-offset-2 hover:text-ink" href="https://github.com/dshak1/upkeep#results">
              the results table
            </a>
            .
          </>
        }
      >
        {results ? (
          <Bars
            title="What happened to each repo"
            unit="repos"
            max={max}
            ticks={ticks}
            fmt={plain}
            bars={results.outcomes.map((o) => ({ label: o.label, value: o.value, display: String(o.value), color: o.key === "moved" ? GREEN : o.color }))}
          />
        ) : null}
      </Row>
    </div>
  )
}
