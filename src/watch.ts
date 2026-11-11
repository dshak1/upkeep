// upkeep watch: follows a provider and tells every repo that has Upkeep installed, the moment the provider ships.
//
// Sources:
//   --github owner/repo   new GitHub releases on the provider's repo (made by its release workflow)
//   --npm pkg[,pkg]       the npm registry's public change feed (replicate.npmjs.com), for real packages
// Consumers:
//   --consumers a/b,c/d   explicit list, or
//   --discover owner      every repo of that owner with .github/workflows/upkeep.yml (refreshed every 5 minutes)
//
// For each new release it sends `repository_dispatch` (event `sdk-release`, payload: tag, package, repo, source)
// to every consumer. It uses the local `gh` login, so no token is stored in any repo.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

export interface WatchOptions {
  github?: string;
  npm?: string[];
  consumers?: string[];
  discover?: string;
  intervalSec: number;
  log?: string;
  once?: boolean;
}

export interface Release { source: 'github' | 'npm'; repo: string; tag: string; pkg: string; publishedAt: string; deprecated?: string }

const now = () => new Date().toISOString();

function gh(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
}

function say(o: WatchOptions, event: string, data: Record<string, unknown>): void {
  const row = { at: now(), event, ...data };
  console.log(`${row.at}  ${event}  ${Object.entries(data).map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`).join('  ')}`);
  if (o.log) appendFileSync(o.log, JSON.stringify(row) + '\n');
}

// ---------- consumers ----------
export function discoverConsumers(owner: string): string[] {
  // One GraphQL page per 100 repos: each repo with its upkeep.yml (null when Upkeep is not installed).
  const q = `query($cursor: String) { viewer { repositories(first: 100, after: $cursor, ownerAffiliations: [OWNER, COLLABORATOR]) {
    pageInfo { hasNextPage endCursor } nodes { nameWithOwner isArchived owner { login } object(expression: "HEAD:.github/workflows/upkeep.yml") { id } } } } }`;
  const out: string[] = [];
  let cursor: string | null = null;
  for (;;) {
    const args: string[] = ['api', 'graphql', '-f', `query=${q}`, ...(cursor ? ['-f', `cursor=${cursor}`] : [])];
    const page: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: { nameWithOwner: string; isArchived: boolean; owner: { login: string }; object: unknown }[] } = JSON.parse(gh(args)).data.viewer.repositories;
    for (const r of page.nodes) if (r.owner.login === owner && !r.isArchived && r.object) out.push(r.nameWithOwner);
    if (!page.pageInfo.hasNextPage) break;
    cursor = page.pageInfo.endCursor;
  }
  return out.sort();
}

export function dispatch(consumer: string, rel: Release): void {
  gh(['api', '-X', 'POST', `repos/${consumer}/dispatches`, '-f', 'event_type=sdk-release',
    '-f', `client_payload[tag]=${rel.tag}`, '-f', `client_payload[package]=${rel.pkg}`,
    '-f', `client_payload[repo]=${rel.repo}`, '-f', `client_payload[source]=${rel.source}`]);
}

// ---------- GitHub releases ----------
function githubReleases(repo: string): { id: number; tag: string; publishedAt: string }[] {
  const rows = JSON.parse(gh(['api', `repos/${repo}/releases?per_page=10`])) as { id: number; tag_name: string; published_at: string; draft: boolean }[];
  return rows.filter((r) => !r.draft).map((r) => ({ id: r.id, tag: r.tag_name, publishedAt: r.published_at }));
}

function packageAt(repo: string, ref: string): string {
  try {
    const b64 = gh(['api', `repos/${repo}/contents/package.json?ref=${encodeURIComponent(ref)}`, '--jq', '.content']);
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')).name ?? '';
  } catch { return ''; }
}

// ---------- npm change feed ----------
const REPLICATE = 'https://replicate.npmjs.com/registry';

async function npmSeq(): Promise<number> {
  const r = await fetch(`${REPLICATE}/`);
  return (await r.json()).update_seq;
}

async function npmChanges(since: number): Promise<{ last: number; ids: string[] }> {
  const r = await fetch(`${REPLICATE}/_changes?since=${since}&limit=1000`);
  const j = await r.json() as { results: { id: string }[]; last_seq: number };
  return { last: j.last_seq ?? since, ids: j.results.map((x) => x.id) };
}

async function npmLatest(pkg: string): Promise<{ version: string; time: string; deprecated?: string }> {
  const r = await fetch(`https://registry.npmjs.org/${pkg.replace('/', '%2f')}`);
  const j = await r.json() as any;
  const version = j['dist-tags']?.latest ?? '';
  return { version, time: j.time?.[version] ?? '', deprecated: j.versions?.[version]?.deprecated };
}

// ---------- the loop ----------
export async function watch(o: WatchOptions): Promise<void> {
  let consumers = o.consumers ?? [];
  let consumersAt = 0;
  const refreshConsumers = () => {
    if (!o.discover || Date.now() - consumersAt < 5 * 60_000) return;
    consumers = discoverConsumers(o.discover);
    consumersAt = Date.now();
    say(o, 'consumers', { owner: o.discover, repos: consumers });
  };
  refreshConsumers();
  if (!o.consumers?.length && !o.discover) throw new Error('watch: give --consumers or --discover');

  const fire = (rel: Release) => {
    say(o, 'release', { source: rel.source, repo: rel.repo, tag: rel.tag, package: rel.pkg, published: rel.publishedAt, ...(rel.deprecated ? { deprecated: rel.deprecated } : {}) });
    for (const c of consumers) {
      try { dispatch(c, rel); say(o, 'dispatched', { to: c, tag: rel.tag }); }
      catch (e) { say(o, 'dispatch-failed', { to: c, error: String((e as Error).message).slice(0, 200) }); }
    }
  };

  // Everything that exists when the watcher starts is the baseline; only what ships after it fires.
  const seenGithub = new Set<number>();
  if (o.github) for (const r of githubReleases(o.github)) seenGithub.add(r.id);
  const npmSeen = new Map<string, string>();
  let seq = 0;
  if (o.npm?.length) {
    seq = await npmSeq();
    for (const p of o.npm) { const l = await npmLatest(p); npmSeen.set(p, `${l.version}|${l.deprecated ?? ''}`); }
  }
  say(o, 'watching', { github: o.github ?? '-', npm: o.npm ?? [], consumers, every: `${o.intervalSec}s` });

  for (;;) {
    refreshConsumers();
    if (o.github) {
      try {
        for (const r of githubReleases(o.github).reverse()) {
          if (seenGithub.has(r.id)) continue;
          seenGithub.add(r.id);
          fire({ source: 'github', repo: o.github, tag: r.tag, pkg: packageAt(o.github, r.tag), publishedAt: r.publishedAt });
        }
      } catch (e) { say(o, 'github-error', { error: String((e as Error).message).slice(0, 200) }); }
    }
    if (o.npm?.length) {
      try {
        const ch = await npmChanges(seq);
        seq = ch.last;
        for (const p of o.npm.filter((p) => ch.ids.includes(p))) {
          const l = await npmLatest(p);
          const key = `${l.version}|${l.deprecated ?? ''}`; // a new version, or the old package marked deprecated
          if (l.version && key !== npmSeen.get(p)) {
            npmSeen.set(p, key);
            fire({ source: 'npm', repo: `npm:${p}`, tag: l.version, pkg: p, publishedAt: l.time, deprecated: l.deprecated });
          }
        }
      } catch (e) { say(o, 'npm-error', { error: String((e as Error).message).slice(0, 200) }); }
    }
    if (o.once) return;
    await new Promise((r) => setTimeout(r, o.intervalSec * 1000));
  }
}
