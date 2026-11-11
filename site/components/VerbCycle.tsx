/**
 * "Libraries [rename. | break. | change.]": Rema's rotating line (landing-v2/RotatingLine.tsx), one rotator. A
 * one-row window over a column of verbs rolls up on one clock, transform only. The window is as wide as the widest
 * verb and the verbs sit at the line's end, so nothing shifts. Reduced motion holds on "change.".
 */

export const VERBS = ["change.", "rename.", "break."] as const

const SLOT = 2.1
const ROLL = 0.5
const n = VERBS.length
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
.vc { --row: 1.25em; display: inline-block; vertical-align: bottom; height: var(--row); overflow: hidden; clip-path: inset(0.14em 0 0 0); margin-bottom: -0.105em; }
.vc-row { display: block; height: var(--row); line-height: var(--row); white-space: nowrap; text-align: left; }
@keyframes vc-roll { ${frames()} }
@media (prefers-reduced-motion: no-preference) {
  .vc-track { display: block; animation: vc-roll ${n * SLOT}s cubic-bezier(.65,0,.35,1) 1.4s infinite; will-change: transform; }
}
`

export function VerbCycle() {
  return (
    <>
      <span className="sr-only">change.</span>
      <span aria-hidden className="vc">
        <span className="vc-track">
          {[...VERBS, VERBS[0]].map((v, i) => (
            <span key={i} className="vc-row text-frozen">
              {v}
            </span>
          ))}
        </span>
      </span>
      <style>{CSS}</style>
    </>
  )
}
