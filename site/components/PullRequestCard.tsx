/**
 * The pull request Upkeep opened on Hexclave's own starter template tonight, drawn as a card. The checks tick in
 * one after another (Rema's enter motion: from above, one fluid curve), then hold. Every number is from that run
 * in runs/results.jsonl: 9 files, 15 lines in and 15 out, type check and build green.
 */

const CHECKS = [
  { name: "Type check", time: "3.1s" },
  { name: "Build", time: "47.3s" },
  { name: "No old name left", time: "0 found" },
]

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle cx="8" cy="8" r="8" fill="#22d47b" />
      <path d="M4.6 8.3l2.2 2.2 4.6-4.9" stroke="#0c1116" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PullRequestCard() {
  return (
    <div className="pr-card mx-auto w-full max-w-[560px] overflow-hidden rounded-[12px] border border-hairline bg-paper-raised text-left shadow-[0_24px_60px_-24px_rgb(0_0_0/0.7)]">
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-proof" aria-hidden>
          <path
            fill="currentColor"
            d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 9.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM4.25 1a2.25 2.25 0 0 0-.75 4.37v5.26a2.25 2.25 0 1 0 1.5 0V5.37A2.25 2.25 0 0 0 4.25 1Zm7.5 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-.75-5.75v4.88a2.25 2.25 0 1 0 1.5 0V4.75A2.75 2.75 0 0 0 9.75 2H8.56l.72-.72a.75.75 0 0 0-1.06-1.06l-2 2a.75.75 0 0 0 0 1.06l2 2a.75.75 0 1 0 1.06-1.06l-.72-.72h1.19c.69 0 1.25.56 1.25 1.25Z"
          />
        </svg>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-ink">Move @stackframe/stack to @hexclave/next</div>
          <div className="lp-mono truncate text-[11.5px] text-ink-muted">hexclave/multi-tenant-starter-template · by Upkeep</div>
        </div>
        <span className="lp-mono ml-auto shrink-0 text-[11.5px] tabular-nums text-ink-muted">
          +15 / -15
        </span>
      </div>
      <ul className="divide-y divide-hairline">
        {CHECKS.map((c, i) => (
          <li key={c.name} className="pr-check flex items-center gap-3 px-4 py-2.5 text-[13.5px]" style={{ ["--i" as string]: i }}>
            <Tick />
            <span className="text-ink">{c.name}</span>
            <span className="lp-mono ml-auto text-[11.5px] tabular-nums text-ink-muted">{c.time}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-hairline bg-paper px-4 py-2.5 text-[12.5px] text-ink-muted">
        <span>9 files changed</span>
        <span className="pr-ready font-medium text-proof">All checks passed</span>
      </div>
    </div>
  )
}
