/**
 * Rema's rotating line (landing-v2/RotatingLine.tsx), cut to one rotator: a one-row window over a column of
 * phrases that rolls up on one clock, transform only, on a CSS animation. Each row is centred, so no width
 * changes and nothing shifts. Reduced motion shows the first phrase still. Screen readers get one sentence.
 */

export const STEPS = ["reads the release", "rewrites the imports", "runs your own tests", "opens the pull request"] as const

const SLOT = 2.2
const ROLL = 0.45
const n = STEPS.length
const pct = (x: number) => `${(x * 100).toFixed(3)}%`

function frames() {
  const r = ROLL / SLOT
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    out.push(`${pct(i / n)} { transform: translateY(calc(var(--row) * ${-i})); }`)
    out.push(`${pct((i + 1 - r) / n)} { transform: translateY(calc(var(--row) * ${-i})); }`)
  }
  out.push(`100% { transform: translateY(calc(var(--row) * ${-n})); }`)
  return out.join(" ")
}

const CSS = `
.rl { --row: 1.35em; }
.rl-win { display: block; height: var(--row); overflow: hidden; }
.rl-row { display: block; height: var(--row); line-height: var(--row); white-space: nowrap; text-align: center; }
@keyframes rl-roll { ${frames()} }
@media (prefers-reduced-motion: no-preference) {
  .rl-track { display: block; animation: rl-roll ${n * SLOT}s cubic-bezier(.65,0,.35,1) 0.9s infinite; will-change: transform; }
}
`

export function RollLine({ className = "" }: { className?: string }) {
  const column = [...STEPS, STEPS[0]]
  return (
    <p className={`rl ${className}`}>
      <span className="sr-only">Upkeep reads the release, rewrites the imports, runs your own tests and opens the pull request.</span>
      <span aria-hidden className="flex flex-col items-center">
        <span className="leading-[1.35em] text-ink">Upkeep</span>
        <span className="rl-win">
          <span className="rl-track block">
            {column.map((w, i) => (
              <span key={i} className="rl-row text-accent">
                {w}
              </span>
            ))}
          </span>
        </span>
      </span>
      <style>{CSS}</style>
    </p>
  )
}
