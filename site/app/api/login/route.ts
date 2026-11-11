import { callbackUrl, login, pilotList } from "@/lib/token"

export const dynamic = "force-dynamic"

/** The login form posts here. A pilot goes back to the CLI's loopback with a token; anyone else back to /login. */
export async function POST(req: Request) {
  const form = await req.formData()
  const email = String(form.get("email") ?? "")
  const port = form.get("port") as string | null
  const state = form.get("state") as string | null
  const back = new URL("/login", req.url)
  if (port) back.searchParams.set("port", port)
  if (state) back.searchParams.set("state", state)

  const secret = process.env.UPKEEP_SESSION_SECRET ?? ""
  const token = secret ? login(email, secret, pilotList(process.env.UPKEEP_PILOTS)) : null
  if (!token) {
    back.searchParams.set("denied", "1")
    return Response.redirect(back, 303)
  }
  const cb = callbackUrl(port, state, token)
  if (!cb) {
    back.searchParams.set("bad", "1")
    return Response.redirect(back, 303)
  }
  return Response.redirect(cb, 303)
}
