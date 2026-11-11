// The pilot gate, CLI side, against a local stand-in for the site that runs the site's own token code.
// Allowed, refused, expired. Fake example.com emails, a temp config dir, no network beyond 127.0.0.1.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { callbackUrl, checkSession, login as siteLogin, pilotList, sign } from '../site/lib/token.ts';

const SECRET = 'test-secret-not-real';
const PILOTS = 'pilot@example.com';
let now = Date.now();
let server: Server;
let auth: typeof import('../src/auth.ts');
const config = mkdtempSync(join(tmpdir(), 'upkeep-auth-'));

before(async () => {
  server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/session') {
      const v = checkSession(req.headers.authorization ?? null, { secret: SECRET, pilots: PILOTS }, now);
      res.writeHead(v.ok ? 200 : 401, { 'content-type': 'application/json' }).end(JSON.stringify(v));
    } else res.writeHead(404).end();
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  process.env.UPKEEP_SITE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  process.env.UPKEEP_CONFIG_HOME = config;
  delete process.env.UPKEEP_TOKEN;
  auth = await import('../src/auth.ts');
});
after(() => { server.close(); rmSync(config, { recursive: true, force: true }); });

const lines: string[] = [];
const print = (s: string) => { lines.push(s); };

test('refused: no login, one line naming the site', async () => {
  lines.length = 0;
  assert.equal(await auth.requirePilot(fetch, print), false);
  assert.deepEqual(lines, [`Upkeep needs a pilot: ${process.env.UPKEEP_SITE}`]);
});

test('allowed: the login loop saves a token, then run and init pass the gate', async () => {
  // Stands in for the browser and the site's /api/login: the pilot types their email, the site redirects to the loopback.
  const s = await auth.login({
    open: async (url) => {
      const u = new URL(url);
      const token = siteLogin('Pilot@Example.com', SECRET, pilotList(PILOTS), now)!;
      const cb = callbackUrl(u.searchParams.get('port'), u.searchParams.get('state'), token)!;
      await fetch(cb);
    },
  });
  assert.deepEqual(s.ok && s.email, 'pilot@example.com');
  const f = auth.sessionFile();
  assert.ok(existsSync(f));
  assert.equal(statSync(f).mode & 0o777, 0o600);
  assert.ok(JSON.parse(readFileSync(f, 'utf8')).token);
  lines.length = 0;
  assert.equal(await auth.requirePilot(fetch, print), true);
  assert.deepEqual(lines, []);
});

test('refused: a callback with the wrong state is turned away and saves nothing new', async () => {
  const s = auth.login({
    timeoutMs: 1500,
    open: async (url) => {
      const u = new URL(url);
      const token = sign('stranger@example.com', SECRET, now);
      const r = await fetch(`http://127.0.0.1:${u.searchParams.get('port')}/callback?state=${'x'.repeat(32)}&token=${token}`);
      assert.equal(r.status, 400);
    },
  });
  assert.deepEqual(await s, { ok: false, reason: 'timed out' });
});

test('refused: a non-pilot token, or a forged one, from UPKEEP_TOKEN', async () => {
  for (const t of [sign('stranger@example.com', SECRET, now), sign('pilot@example.com', 'another-secret', now)]) {
    process.env.UPKEEP_TOKEN = t;
    lines.length = 0;
    assert.equal(await auth.requirePilot(fetch, print), false);
    assert.equal(lines.length, 1);
  }
  delete process.env.UPKEEP_TOKEN;
});

test('expired: the saved token stops working after 30 days', async () => {
  now += 31 * 86_400_000;
  lines.length = 0;
  assert.equal(await auth.requirePilot(fetch, print), false);
  assert.deepEqual(lines, [`Upkeep needs a pilot: ${process.env.UPKEEP_SITE}`]);
  assert.deepEqual(await auth.checkToken(auth.readToken()), { ok: false, reason: 'expired' });
});

test('refused when the site cannot be reached', async () => {
  process.env.UPKEEP_TOKEN = 'anything';
  const down: typeof fetch = async () => { throw new Error('connect ECONNREFUSED'); };
  assert.equal(await auth.requirePilot(down, print), false);
  delete process.env.UPKEEP_TOKEN;
});
