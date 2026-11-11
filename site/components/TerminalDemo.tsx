"use client"

import { useState } from "react"

/**
 * The hero as a Screen Studio take: the camera eases in on the one terminal line, the cursor clicks Copy, the
 * line runs and resolves to "Done.", and the camera eases back out. One 7 s timeline on CSS keyframes, played
 * once, transform and opacity only. The page puts `td-cam` on the whole hero, so it zooms as a recording would. Reduced motion shows the finished frame. The Copy button really copies.
 */

const LINE = "npx github:dshak1/upkeep init"
const EASE = "cubic-bezier(.65,0,.35,1)"
const T = "7s"
const D = "0.7s"

const CSS = `
.td-cam { transform-origin: var(--td-origin, 64% 52%); animation: td-cam ${T} ${D} both; }
@keyframes td-cam {
  0%, 12% { transform: scale(1); animation-timing-function: ${EASE}; }
  30%, 68% { transform: scale(var(--td-zoom, 1.6)); animation-timing-function: ${EASE}; }
  88%, 100% { transform: scale(1); }
}
.td-cursor { animation: td-cursor ${T} ${D} both; }
@keyframes td-cursor {
  0%, 22% { opacity: 0; transform: translate(150px, 110px); animation-timing-function: ${EASE}; }
  25% { opacity: 1; transform: translate(150px, 110px); animation-timing-function: ${EASE}; }
  40% { opacity: 1; transform: translate(0, 0) scale(1); }
  42% { transform: translate(0, 0) scale(0.82); }
  45% { transform: translate(0, 0) scale(1); opacity: 1; }
  60%, 100% { opacity: 0; transform: translate(0, 0); }
}
.td-copy { animation: td-copy ${T} ${D} both; }
@keyframes td-copy {
  0%, 41% { box-shadow: 0 0 0 0 rgb(61 107 255 / 0); }
  43% { box-shadow: 0 0 0 6px rgb(61 107 255 / 0.35); }
  52%, 100% { box-shadow: 0 0 0 0 rgb(61 107 255 / 0); }
}
.td-copied { animation: td-show ${T} ${D} both; --on: 43%; --off: 76%; }
.td-copylabel { animation: td-hide ${T} ${D} both; }
@keyframes td-show { 0%, 42.9% { opacity: 0; } 43%, 75.9% { opacity: 1; } 76%, 100% { opacity: 0; } }
@keyframes td-hide { 0%, 42.9% { opacity: 1; } 43%, 75.9% { opacity: 0; } 76%, 100% { opacity: 1; } }
.td-run { animation: td-run ${T} ${D} both; }
@keyframes td-run { 0%, 47.9% { opacity: 0; transform: translateY(-4px); } 50%, 59.9% { opacity: 1; transform: none; } 61%, 100% { opacity: 0; } }
.td-done { animation: td-done ${T} ${D} both; }
@keyframes td-done { 0%, 60.9% { opacity: 0; transform: translateY(-4px); } 64%, 100% { opacity: 1; transform: none; } }
.td-spin { animation: td-spin 0.8s linear infinite; }
@keyframes td-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .td-cam, .td-cursor, .td-copy, .td-copied, .td-copylabel, .td-run, .td-done { animation: none; }
  .td-cursor, .td-run, .td-copied { opacity: 0; }
}
`

function Cursor() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 drop-shadow-[0_2px_4px_rgb(0_0_0/0.6)]" aria-hidden>
      <path d="M5 3l14 7.5-6.2 1.6L10 18.5 5 3z" fill="#f5f2ea" stroke="#0c1116" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function TerminalDemo() {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard.writeText(LINE).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      },
      () => {},
    )

  return (
    <div className="relative mx-auto w-[min(680px,100%)]">
      <div>
        <div className="rounded-[12px] border border-white/10 bg-[#0b0e12] text-left shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]">
          <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.07] px-3.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="lp-mono ml-3 text-[11.5px] text-ink-muted">terminal</span>
          </div>
          <div className="px-4 pb-4 pt-4 sm:px-5">
            <div className="flex items-center gap-3">
              <code className="lp-mono min-w-0 flex-1 truncate text-[14px] text-ink sm:text-[15px]">
                <span className="select-none text-ink-muted">$ </span>
                {LINE}
              </code>
              <span className="relative">
                <button
                  type="button"
                  onClick={copy}
                  className="td-copy relative flex h-8 shrink-0 items-center rounded-[7px] bg-accent px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#5580ff]"
                >
                  {copied ? (
                    "Copied"
                  ) : (
                    <span className="relative">
                      <span className="td-copylabel">Copy</span>
                      <span className="td-copied absolute inset-0" aria-hidden>
                        Copied
                      </span>
                    </span>
                  )}
                </button>
                <span className="td-cursor pointer-events-none absolute left-[55%] top-[55%]">
                  <Cursor />
                </span>
              </span>
            </div>
            <div className="lp-mono relative mt-3 h-6 text-[13.5px]" aria-live="off">
              <span className="td-run absolute inset-0 flex items-center gap-2 text-ink-muted">
                <svg viewBox="0 0 16 16" className="td-spin size-3.5" aria-hidden>
                  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                  <path d="M14 8a6 6 0 00-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Adding .github/workflows/upkeep.yml
              </span>
              <span className="td-done absolute inset-0 flex items-center gap-2 text-ink">
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                  <path d="M3.5 8.5l3 3 6-7" stroke="#22d47b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Done.
              </span>
            </div>
          </div>
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  )
}
