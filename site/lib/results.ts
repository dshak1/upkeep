// Tonight's runs, read from runs/results.jsonl on upkeep's main branch, the same file the README table is
// written from. Refreshed every five minutes, so a merged batch shows up without a redeploy.

type Step = { ok?: boolean } | null | undefined
type Row = {
  id: string
  repo: string
  verdict: string
  before?: { typecheck?: Step; build?: Step }
  after?: { typecheck?: Step; build?: Step } | null
  change?: { files?: number } | null
}

export type Outcome = { key: string; label: string; value: number; color: string }
export type Results = { total: number; counted: number; outcomes: Outcome[]; starter?: { files?: number; buildGreen: boolean } }

const URL_MAIN = "https://raw.githubusercontent.com/dshak1/upkeep/main/runs/results.jsonl"

const KINDS: Record<string, { label: string; color: string; order: number }> = {
  moved: { label: "Built before and after, none of the old package left", color: "#22d47b", order: 0 },
  red: { label: "Build broke after the move, so no pull request", color: "#e5484d", order: 1 },
  timeout: { label: "Not counted: stopped at our 6 minute limit", color: "#5b6573", order: 2 },
  skipped: { label: "Not counted: its build already failed before", color: "#5b6573", order: 3 },
}

// The README's rule: a repo counts only if it built before Upkeep touched it.
const kindOf = (r: Row) =>
  r.verdict === "timeout"
    ? "timeout"
    : !r.before?.build?.ok
      ? "skipped"
      : r.after?.build?.ok && r.verdict.startsWith("moved")
        ? "moved"
        : "red"

export function summarize(text: string): Results {
  const last = new Map<string, Row>()
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    try {
      const r = JSON.parse(line) as Row
      if (r.id && r.verdict) last.set(r.id, r)
    } catch {
      // A half-written line: skip it.
    }
  }
  const rows = [...last.values()]
  const counts = new Map<string, number>()
  for (const r of rows) counts.set(kindOf(r), (counts.get(kindOf(r)) ?? 0) + 1)
  const outcomes = [...counts.entries()]
    .map(([key, value]) => ({ key, value, label: KINDS[key].label, color: KINDS[key].color }))
    .sort((a, b) => KINDS[a.key].order - KINDS[b.key].order)
  const s = rows.find((r) => r.repo === "hexclave/multi-tenant-starter-template")
  return {
    total: rows.length,
    counted: outcomes.filter((o) => o.key === "moved" || o.key === "red").reduce((n, o) => n + o.value, 0),
    outcomes,
    starter: s ? { files: s.change?.files, buildGreen: Boolean(s.before?.build?.ok && s.after?.build?.ok) } : undefined,
  }
}

export async function loadResults(): Promise<Results | null> {
  try {
    const r = await fetch(URL_MAIN, { next: { revalidate: 300 } })
    if (!r.ok) return null
    const s = summarize(await r.text())
    return s.total ? s : null
  } catch {
    return null
  }
}
