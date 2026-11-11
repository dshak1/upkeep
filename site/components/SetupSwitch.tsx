"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"

import { Pill } from "@/components/Pill"

/**
 * Copied from Rema's landing-v4/SetupSwitch.tsx: the two-box switch (36 px track on #f4f4f6, 7 px corners, the
 * chosen box white with a 1 px 3 px shadow), one panel of fixed height, and the ink setup pill whose copy glyph
 * turns into a check for 1200 ms. Here the two tabs are the two ways to install Upkeep.
 */

type Way = "action" | "cli"

type Tab = { id: Way; label: string; title: string; text: string; copy: string; note: string }

const KEY = "upkeep:setup-switch"

function Branch() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-[18px]">
      <circle cx="6" cy="4.5" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="15.5" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="7.5" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6.4v7.2M14 9.4c0 3-4 2.6-7.4 4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Prompt() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-[18px]">
      <path d="M4 6l4 4-4 4M10.5 14.5H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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

export function SetupSwitch({ actionLine, cliLine }: { actionLine: string; cliLine: string }) {
  const TABS: Tab[] = [
    {
      id: "action",
      label: "GitHub Action",
      title: "in your repo",
      text: actionLine,
      copy: "Copy the Action line",
      note: "Adds .github/workflows/upkeep.yml. Commit it, and Upkeep checks every Monday.",
    },
    {
      id: "cli",
      label: "CLI",
      title: "terminal",
      text: cliLine,
      copy: "Copy the CLI line",
      note: "Asks you to log in first. Login works once you have a pilot.",
    },
  ]
  const [who, setWho] = useState<Way>("action")
  const [copied, setCopied] = useState<Way | null>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY)
      if (saved === "action" || saved === "cli") setWho(saved)
    } catch {
      // Blocked storage: the default tab is fine.
    }
  }, [])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(null), 1200)
    return () => clearTimeout(t)
  }, [copied])

  const pick = (next: Way, focus = false) => {
    setWho(next)
    try {
      window.localStorage.setItem(KEY, next)
    } catch {
      // As above.
    }
    if (focus) tabs.current[TABS.findIndex((t) => t.id === next)]?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
    e.preventDefault()
    const i = TABS.findIndex((t) => t.id === who)
    const n = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length
    pick(TABS[n].id, true)
  }

  const tab = TABS.find((t) => t.id === who) ?? TABS[0]
  const copy = () => {
    navigator.clipboard.writeText(tab.text).then(
      () => setCopied(tab.id),
      () => setCopied(null),
    )
  }

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="How to install"
        onKeyDown={onKey}
        className="inline-flex h-9 items-stretch gap-[2px] rounded-[7px] border border-[#dfdfdf] bg-[#f4f4f6] p-[3px]"
      >
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`setup-tab-${t.id}`}
            aria-selected={who === t.id}
            aria-controls="setup-panel"
            tabIndex={who === t.id ? 0 : -1}
            onClick={() => pick(t.id)}
            className={`flex h-7 items-center rounded-[4px] px-[11px] text-[12px] transition-[background-color,color,box-shadow] duration-150 ${
              who === t.id ? "bg-white font-semibold text-[#0b1015] shadow-[0_1px_3px_rgba(11,16,21,0.12)]" : "font-normal text-[rgba(11,16,21,0.68)] hover:text-[#0b1015]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id="setup-panel"
        role="tabpanel"
        aria-labelledby={`setup-tab-${who}`}
        className="mt-5 overflow-hidden rounded-[8px] border border-hairline bg-paper-raised text-left"
      >
        <div className="flex h-10 items-center gap-2 border-b border-hairline px-4 text-ink-muted">
          {who === "action" ? <Branch /> : <Prompt />}
          <span className="lp-mono text-[12.5px]">{tab.title}</span>
        </div>
        <div className="flex min-h-[104px] items-center px-4 py-5 sm:px-5">
          <p className="lp-mono break-all text-[14px] leading-[1.7] text-ink">
            <span className="select-none text-accent">$ </span>
            {tab.text}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-[1.6] text-ink-muted">{tab.note}</p>

      <div className="mt-6 flex justify-center">
        <Pill kind="setup" tone="ink" onClick={copy} icon={who === "action" ? <Branch /> : <Prompt />} trailing={<CopyGlyph done={copied === who} />}>
          {copied === who ? "Copied" : tab.copy}
        </Pill>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? `Copied the ${copied === "action" ? "Action" : "CLI"} line.` : ""}
      </p>
    </div>
  )
}
