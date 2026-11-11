// Tonight's chart follows the README's rule: a repo counts only if it built before Upkeep touched it.
import assert from "node:assert/strict"
import { test } from "node:test"

import { summarize } from "../lib/results.ts"

const row = (id: string, verdict: string, before: boolean, after: boolean | null) =>
  JSON.stringify({ id, repo: `example/${id}`, verdict, before: { build: { ok: before } }, after: after === null ? null : { build: { ok: after } } })

test("a repo whose build failed before is not counted, even with verdict moved", () => {
  const s = summarize([row("a", "moved", true, true), row("b", "moved", false, false), row("c", "timeout", false, null), row("d", "red after", true, false)].join("\n"))
  assert.equal(s.total, 4)
  assert.equal(s.counted, 2)
  assert.deepEqual(Object.fromEntries(s.outcomes.map((o) => [o.key, o.value])), { moved: 1, red: 1, timeout: 1, skipped: 1 })
})

test("the last row per repo wins, and a broken line is skipped", () => {
  const s = summarize([row("a", "red after", true, false), "{not json", row("a", "moved", true, true)].join("\n"))
  assert.equal(s.total, 1)
  assert.equal(s.outcomes[0].key, "moved")
})
