import { checkSession } from "@/lib/token"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const v = checkSession(req.headers.get("authorization"), {
    secret: process.env.UPKEEP_SESSION_SECRET,
    pilots: process.env.UPKEEP_PILOTS,
  })
  return Response.json(v, { status: v.ok ? 200 : 401, headers: { "cache-control": "no-store" } })
}
