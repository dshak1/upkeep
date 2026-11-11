import { Pill } from "@/components/Pill"

const PILOT = process.env.NEXT_PUBLIC_PILOT_URL?.trim()

type Search = Promise<{ port?: string; state?: string; denied?: string; bad?: string }>

export default async function Login({ searchParams }: { searchParams: Search }) {
  const { port = "", state = "", denied, bad } = await searchParams
  const fromCli = Boolean(port && state)
  return (
    <main className="lp flex min-h-screen flex-col items-center px-4 pt-28 sm:pt-36">
      <a href="/" className="text-[17px] font-semibold tracking-[-0.02em]">
        Upkeep<span className="text-accent">.</span>
      </a>
      <h1 className="mt-10 text-center text-[28px] font-semibold tracking-[-0.025em] sm:text-[34px]">Log in to the Upkeep CLI</h1>
      {!fromCli || bad ? (
        <p className="mt-4 max-w-[40ch] text-center text-[15px] leading-[1.6] text-ink-muted">
          Start from your terminal: run <span className="lp-mono text-ink">npx github:dshak1/upkeep login</span>, and it opens this page.
        </p>
      ) : (
        <form action="/api/login" method="post" className="mt-8 flex w-full max-w-[360px] flex-col gap-3">
          <input type="hidden" name="port" value={port} />
          <input type="hidden" name="state" value={state} />
          <label htmlFor="email" className="text-[13px] text-ink-muted">
            The email you paid with
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            className="h-11 rounded-[8px] border border-hairline bg-paper px-3 text-[15px] outline-none transition-shadow focus:border-ink/30 focus:shadow-[0_0_0_3px_rgb(47_92_255/0.15)]"
          />
          <Pill type="submit" kind="utility" tone="ink" className="mt-2 w-full">
            Log in
          </Pill>
          {denied ? (
            <p role="alert" className="mt-2 text-center text-[14px] leading-[1.6] text-ink-muted">
              That email has no pilot yet.{" "}
              {PILOT ? (
                <a href={PILOT} className="text-accent underline underline-offset-2">
                  Start one for $49
                </a>
              ) : (
                <a href="/" className="text-accent underline underline-offset-2">
                  See the pilot
                </a>
              )}
              .
            </p>
          ) : null}
        </form>
      )}
    </main>
  )
}
