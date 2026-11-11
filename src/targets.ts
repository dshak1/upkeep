// Finds public repos whose package.json still names an old package, and keeps the ones worth a run tonight:
// not a fork, not archived, not a copy of the provider's own source, pushed recently, TypeScript, not huge.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Spec } from './spec.ts';

function gh(args: string[]): any {
  for (let i = 0; i < 4; i++) {
    const r = spawnSync('gh', ['api', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
    if (r.status === 0) return JSON.parse(r.stdout);
    if (/rate limit|403|secondary/i.test(r.stderr)) { spawnSync('sleep', ['30']); continue; }
    return null;
  }
  return null;
}

export interface Candidate { repo: string; dir: string; pushed: string; stars: number; mb: number; license: string; paths: string[] }

export function findTargets(spec: Spec, opts: { since: string; maxMb: number; pages: number }): { all: number; kept: Candidate[] } {
  const hits = new Map<string, Set<string>>();
  for (const pkg of Object.keys(spec.packages).slice(0, 3)) {
    for (let page = 1; page <= opts.pages; page++) {
      const d = gh(['-X', 'GET', 'search/code', '-f', `q="${pkg}" filename:package.json`, '-f', 'per_page=100', '-f', `page=${page}`]);
      if (!d?.items?.length) break;
      for (const it of d.items) {
        const s = hits.get(it.repository.full_name) ?? new Set<string>();
        s.add(it.path); hits.set(it.repository.full_name, s);
      }
      process.stderr.write(`${pkg} page ${page}: ${hits.size} repos\n`);
      spawnSync('sleep', ['7']); // code search allows about 10 requests a minute
    }
  }
  const names = [...hits.keys()];
  const kept: Candidate[] = [];
  for (let i = 0; i < names.length; i += 40) {
    const chunk = names.slice(i, i + 40);
    const q = 'query{' + chunk.map((n, j) => { const [o, r] = n.split('/'); return `r${j}: repository(owner:${JSON.stringify(o)}, name:${JSON.stringify(r)}){nameWithOwner isFork isArchived pushedAt stargazerCount diskUsage primaryLanguage{name} licenseInfo{spdxId}}`; }).join(' ') + '}';
    const d = gh(['graphql', '-f', `query=${q}`]);
    for (const v of Object.values<any>(d?.data ?? {})) {
      if (!v) continue;
      const paths = [...(hits.get(v.nameWithOwner) ?? [])].sort((a, b) => a.length - b.length);
      const vendored = paths.some((p) => /^(?:packages\/(?:stack|template|init-stack|js|react)|apps\/(?:backend|dashboard))/.test(p)) || /stack-?auth|hexclave/i.test(v.nameWithOwner);
      const ok = !v.isFork && !v.isArchived && !vendored && v.pushedAt >= opts.since && v.primaryLanguage?.name === 'TypeScript' && (v.diskUsage ?? 0) / 1024 <= opts.maxMb;
      if (ok) kept.push({ repo: v.nameWithOwner, dir: dirname(paths[0]) || '.', pushed: v.pushedAt.slice(0, 10), stars: v.stargazerCount, mb: Math.round((v.diskUsage ?? 0) / 102.4) / 10, license: v.licenseInfo?.spdxId ?? '', paths });
    }
  }
  kept.sort((a, b) => b.pushed.localeCompare(a.pushed));
  return { all: names.length, kept };
}

export function writeTargets(path: string, found: { all: number; kept: Candidate[] }, opts: { since: string; maxMb: number }): void {
  const head = `# Found by \`upkeep targets\` on ${new Date().toISOString()}: ${found.all} public repos with an old package in a package.json (GitHub code search, first pages),\n# ${found.kept.length} kept: not a fork, not archived, not the provider's own source, pushed since ${opts.since}, TypeScript, under ${opts.maxMb} MB.\n# repo\tdir\tpushed\tstars\tMB\tlicense\n`;
  writeFileSync(path, head + found.kept.map((c) => [c.repo, c.dir, c.pushed, c.stars, c.mb, c.license].join('\t')).join('\n') + '\n');
}
