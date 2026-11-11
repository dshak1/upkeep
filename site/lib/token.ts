// The pilot gate, server side. A token is base64url(JSON {email, exp}) + "." + base64url(HMAC-SHA256 of that part).
// The secret never leaves the server; the CLI asks /api/session whether its token is still good.
import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export const TOKEN_DAYS = 30

export type Verdict = { ok: true; email: string; exp: number } | { ok: false; reason: "missing" | "bad" | "expired" | "not a pilot" }

export const normalEmail = (e: string) => e.trim().toLowerCase()

/**
 * UPKEEP_PILOTS is a comma separated list of `email:code`, one per payment. The code is made by us when the payment
 * lands and given only to the buyer, so knowing a pilot's email is not enough to log in as them.
 */
export type Pilots = { has(email: string): boolean; code(email: string): string | undefined }

export function pilotList(env: string | undefined): Pilots {
  const m = new Map<string, string>()
  for (const entry of (env ?? "").split(",")) {
    const i = entry.lastIndexOf(":")
    const email = normalEmail(i > 0 ? entry.slice(0, i) : entry)
    const code = i > 0 ? entry.slice(i + 1).trim() : ""
    if (email.includes("@")) m.set(email, code)
  }
  return { has: (e) => m.has(e), code: (e) => m.get(e) || undefined }
}

const sameCode = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest())

const mac = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("base64url")

export function sign(email: string, secret: string, now = Date.now(), days = TOKEN_DAYS): string {
  if (!secret) throw new Error("UPKEEP_SESSION_SECRET is not set")
  const body = Buffer.from(JSON.stringify({ email: normalEmail(email), exp: now + days * 86_400_000 })).toString("base64url")
  return `${body}.${mac(body, secret)}`
}

/** Signature, expiry, and the email still on the pilot list. */
export function verify(token: string | undefined, secret: string, pilots: Pilots, now = Date.now()): Verdict {
  if (!token) return { ok: false, reason: "missing" }
  if (!secret) return { ok: false, reason: "bad" }
  const [body, sig, extra] = token.split(".")
  if (!body || !sig || extra !== undefined) return { ok: false, reason: "bad" }
  const want = Buffer.from(mac(body, secret))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return { ok: false, reason: "bad" }
  let claim: { email?: unknown; exp?: unknown }
  try {
    claim = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
  } catch {
    return { ok: false, reason: "bad" }
  }
  if (typeof claim.email !== "string" || typeof claim.exp !== "number") return { ok: false, reason: "bad" }
  if (claim.exp <= now) return { ok: false, reason: "expired" }
  if (!pilots.has(claim.email)) return { ok: false, reason: "not a pilot" }
  return { ok: true, email: claim.email, exp: claim.exp }
}

/** The login step: a token for a pilot who has their code, nothing for anyone else. */
export function login(email: string, code: string, secret: string, pilots: Pilots, now = Date.now()): string | null {
  const e = normalEmail(email)
  const want = pilots.code(e)
  if (!e.includes("@") || !want || !sameCode(code.trim(), want)) return null
  return sign(e, secret, now)
}

/** The CLI's loopback: only 127.0.0.1, only a numeric port, only a state it made. */
export function callbackUrl(port: string | null, state: string | null, token: string): string | null {
  if (!port || !/^\d{2,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535) return null
  if (!state || !/^[A-Za-z0-9_-]{16,128}$/.test(state)) return null
  const u = new URL(`http://127.0.0.1:${Number(port)}/callback`)
  u.searchParams.set("state", state)
  u.searchParams.set("token", token)
  return u.toString()
}

/** The /api/session check, as a pure function so tests and the CLI's tests can run it without a server. */
export function checkSession(authorization: string | null, env: { secret?: string; pilots?: string }, now = Date.now()): Verdict {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined
  return verify(token, env.secret ?? "", pilotList(env.pilots), now)
}
