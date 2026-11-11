// The pilot gate, server side: allowed, refused, expired. Fake example.com emails only.
import assert from "node:assert/strict"
import { test } from "node:test"

import { callbackUrl, checkSession, login, pilotList, sign, verify } from "../lib/token.ts"

const SECRET = "test-secret-not-real"
const PILOTS = pilotList(" Pilot@Example.com , other@example.com")
const NOW = Date.UTC(2026, 10, 11, 13, 0, 0)

test("allowed: a pilot's email gets a token that verifies", () => {
  const t = login("pilot@example.com", SECRET, PILOTS, NOW)
  assert.ok(t)
  const v = verify(t, SECRET, PILOTS, NOW + 1000)
  assert.deepEqual(v.ok && v.email, "pilot@example.com")
  assert.equal(checkSession(`Bearer ${t}`, { secret: SECRET, pilots: "pilot@example.com" }, NOW).ok, true)
})

test("refused: an email not on the pilot list gets no token", () => {
  assert.equal(login("stranger@example.com", SECRET, PILOTS, NOW), null)
  assert.equal(login("", SECRET, PILOTS, NOW), null)
})

test("refused: a token signed with another secret, edited, or missing", () => {
  const forged = sign("pilot@example.com", "another-secret", NOW)
  assert.deepEqual(verify(forged, SECRET, PILOTS, NOW), { ok: false, reason: "bad" })
  const t = sign("pilot@example.com", SECRET, NOW)
  const [, sig] = t.split(".")
  const edited = `${Buffer.from(JSON.stringify({ email: "stranger@example.com", exp: NOW + 1e9 })).toString("base64url")}.${sig}`
  assert.deepEqual(verify(edited, SECRET, PILOTS, NOW), { ok: false, reason: "bad" })
  assert.deepEqual(checkSession(null, { secret: SECRET, pilots: "pilot@example.com" }, NOW), { ok: false, reason: "missing" })
})

test("refused: a pilot taken off the list loses access with the same token", () => {
  const t = sign("other@example.com", SECRET, NOW)
  assert.deepEqual(verify(t, SECRET, pilotList("pilot@example.com"), NOW), { ok: false, reason: "not a pilot" })
})

test("expired: a token past its 30 days is refused", () => {
  const t = sign("pilot@example.com", SECRET, NOW)
  assert.equal(verify(t, SECRET, PILOTS, NOW + 29 * 86_400_000).ok, true)
  assert.deepEqual(verify(t, SECRET, PILOTS, NOW + 30 * 86_400_000), { ok: false, reason: "expired" })
})

test("the loopback only ever points at 127.0.0.1 with a numeric port", () => {
  const s = "abcdefghijklmnop1234"
  assert.equal(callbackUrl("54321", s, "tok"), `http://127.0.0.1:54321/callback?state=${s}&token=tok`)
  assert.equal(callbackUrl("evil.com", s, "tok"), null)
  assert.equal(callbackUrl("80", s, "tok"), null)
  assert.equal(callbackUrl("54321", "short", "tok"), null)
  assert.equal(callbackUrl("54321@evil.com", s, "tok"), null)
})
