// The pilot gate, CLI side. `upkeep login` opens <site>/login with a loopback callback (127.0.0.1, a random port and
// a random state), the site signs a token for a pilot's email, and the token is kept in ~/.config/upkeep/session.json.
// `upkeep run` and `upkeep init` ask <site>/api/session whether the token is still good before doing anything.
// The signing secret lives only on the site; the CLI never sees it.
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const SITE = (process.env.UPKEEP_SITE ?? 'https://upkeep-mu-nine.vercel.app').replace(/\/+$/, '');
export const NEEDS_PILOT = `Upkeep needs a pilot: ${SITE}`;

export const sessionFile = () => join(process.env.UPKEEP_CONFIG_HOME ?? join(homedir(), '.config'), 'upkeep', 'session.json');

/** UPKEEP_TOKEN (for CI) wins over the saved session. */
export function readToken(): string | undefined {
  if (process.env.UPKEEP_TOKEN?.trim()) return process.env.UPKEEP_TOKEN.trim();
  const f = sessionFile();
  if (!existsSync(f)) return undefined;
  try { return JSON.parse(readFileSync(f, 'utf8')).token || undefined; } catch { return undefined; }
}

export function saveToken(token: string, email?: string): void {
  const f = sessionFile();
  mkdirSync(dirname(f), { recursive: true, mode: 0o700 });
  writeFileSync(f, JSON.stringify({ token, email, site: SITE }, null, 2) + '\n', { mode: 0o600 });
  chmodSync(f, 0o600);
}

export type Session = { ok: true; email: string; exp: number } | { ok: false; reason: string };

export async function checkToken(token: string | undefined, fetcher: typeof fetch = fetch): Promise<Session> {
  if (!token) return { ok: false, reason: 'missing' };
  try {
    const r = await fetcher(`${SITE}/api/session`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    const body = (await r.json()) as Session;
    return r.ok && body.ok ? body : { ok: false, reason: body.ok === false ? body.reason : `http ${r.status}` };
  } catch (e) {
    return { ok: false, reason: `offline: ${(e as Error).message}` };
  }
}

/** The gate in front of `run` and `init`. Prints one line and returns false when there is no valid pilot. */
export async function requirePilot(fetcher: typeof fetch = fetch, print: (s: string) => void = console.error): Promise<boolean> {
  const s = await checkToken(readToken(), fetcher);
  if (s.ok) return true;
  print(NEEDS_PILOT);
  return false;
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch { /* the URL is printed too */ }
}

/** Waits for the site to send the browser back to 127.0.0.1:<port>/callback?state=..&token=.. */
export function login(opts: { open?: (url: string) => void; timeoutMs?: number; fetcher?: typeof fetch } = {}): Promise<Session> {
  const state = randomBytes(24).toString('base64url');
  return new Promise((resolveP) => {
    const server = createServer(async (req, res) => {
      const u = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (u.pathname !== '/callback') { res.writeHead(404).end(); return; }
      const got = Buffer.from(u.searchParams.get('state') ?? '');
      const want = Buffer.from(state);
      const token = u.searchParams.get('token') ?? '';
      if (got.length !== want.length || !timingSafeEqual(got, want) || !token) {
        res.writeHead(400, { 'content-type': 'text/plain' }).end('This login did not come from your terminal. Run upkeep login again.');
        return;
      }
      const s = await checkToken(token, opts.fetcher);
      if (s.ok) saveToken(token, s.email);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(
        `<!doctype html><meta charset="utf-8"><title>Upkeep</title><body style="font:16px system-ui;display:grid;place-items:center;height:90vh;color:#0a0a0a">` +
        `<p>${s.ok ? 'Logged in. You can close this tab and go back to your terminal.' : 'That login did not work. Go back to your terminal.'}</p></body>`,
      );
      clearTimeout(timer);
      server.close();
      resolveP(s);
    });
    const timer = setTimeout(() => { server.close(); resolveP({ ok: false, reason: 'timed out' }); }, opts.timeoutMs ?? 5 * 60_000);
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as { port: number }).port;
      const url = `${SITE}/login?port=${port}&state=${state}`;
      console.log(`Opening ${url}`);
      (opts.open ?? (process.env.UPKEEP_NO_BROWSER ? () => {} : openBrowser))(url);
    });
  });
}

/** upkeep init: adds .github/workflows/upkeep.yml to the repo in `dir`. */
export function init(dir: string, template: string): string {
  const out = join(dir, '.github', 'workflows', 'upkeep.yml');
  if (existsSync(out)) return `${out} is already there.`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, readFileSync(template, 'utf8'));
  return `Added ${out}. Commit it, and Upkeep checks this repo every Monday.`;
}
