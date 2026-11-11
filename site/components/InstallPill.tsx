"use client"

import { useEffect, useState } from "react"

/**
 * The install line as one pill: a two-box switch (Rema's SetupSwitch track), the command in mono, and a copy
 * button whose glyph turns into a check for 1200 ms. Sits on the hero's dark gradient.
 */

type Way = "action" | "cli"
const KEY = "upkeep:setup-switch"

function CopyGlyph({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 3.5v-.4A1.6 1.6 0 008.9 1.5H3.1A1.6 1.6 0 001.5 3.1v5.8a1.6 1.6 0 001.6 1.6h.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function InstallPill({ actionLine, cliLine }: { actionLine: string; cliLine: string }) {
  const [way, setWay] = useState<Way>("action")
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(KEY)
      if (s === "action" || s === "cli") setWay(s)
    } catch {}
  }, [])
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(t)
  }, [copied])
  const pick = (w: Way) => {
    setWay(w)
    try {
      window.localStorage.setItem(KEY, w)
    } catch {}
  }
  const text = way === "action" ? actionLine : cliLine
  const tabs: { id: Way; label: string }[] = [
    { id: "action", label: "GitHub Action" },
    { id: "cli", label: "CLI" },
  ]
  return (
    <div className="w-full max-w-[640px]">
      <div className="flex items-center gap-1.5 rounded-[12px] border border-white/12 bg-[#0c1116]/70 p-1.5 backdrop-blur-md">
        <div role="tablist" aria-label="How to install" className="flex h-9 shrink-0 items-stretch gap-[2px] rounded-[8px] bg-white/[0.06] p-[3px]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={way === t.id}
              onClick={() => pick(t.id)}
              className={`flex h-[30px] items-center rounded-[6px] px-2.5 text-[12px] transition-[background-color,color] duration-150 ${
                way === t.id ? "bg-[#2a333d] font-semibold text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <code className="lp-mono min-w-0 flex-1 truncate px-2 text-[13px] text-ink" title={text}>
          <span className="select-none text-ink-muted">$ </span>
          {text}
        </code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true), () => setCopied(false))}
          aria-label={way === "action" ? "Copy the Action line" : "Copy the CLI line"}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-white/[0.08] px-3 text-[13px] font-medium text-ink transition-colors hover:bg-white/[0.14]"
        >
          <CopyGlyph done={copied} />
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <p className="mt-2.5 pl-1 text-[13px] text-ink-muted">
        {way === "action" ? "Adds .github/workflows/upkeep.yml. Commit it, and Upkeep checks every Monday." : "Asks you to log in first. Login works once you have a pilot."}
      </p>
      <p className="sr-only" aria-live="polite">
        {copied ? "Copied." : ""}
      </p>
    </div>
  )
}
