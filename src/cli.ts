#!/usr/bin/env node
// upkeep apply <dir> [--swap-only] [--dry-run]   move one checkout and print what changed and what is left
// upkeep check <dir>                             Check C on a checkout
// upkeep run <targets.tsv> [--build] [--only owner/repo] [--minutes 6]   the harness (a repo over its minutes is recorded as timeout): before and after, rows to runs/results.jsonl
// upkeep targets [--since 2026-08-01]                  find public repos still on the old packages
// upkeep guard-rows                              add the agent block and CI guard to moved repos from earlier runs
// upkeep report                                  regenerate the README table from runs/results.jsonl
// upkeep login                                   log in with the email you paid with (run and init need it)
// upkeep init [dir]                              add .github/workflows/upkeep.yml to a repo
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { applySpec } from './apply.ts';
import { init, login, requirePilot } from './auth.ts';
import { checkC } from './checkc.ts';
import { addGuard, readResults, runTarget, type Row, type Target } from './run.ts';
import { appendFileSync, existsSync } from 'node:fs';
import { writeReadme } from './report.ts';
import { loadSpec } from './spec.ts';
import { findTargets, writeTargets } from './targets.ts';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const spec = loadSpec(opt('--spec') ?? join(ROOT, 'specs/hexclave.json'));
const RESULTS = join(ROOT, 'runs/results.jsonl');
const [cmd, target] = args;
if ((cmd === 'run' || cmd === 'init') && !(await requirePilot())) process.exit(1);

if (cmd === 'login') {
  const s = await login();
  console.log(s.ok ? `Logged in as ${s.email}.` : `Login failed (${s.reason}).`);
  process.exitCode = s.ok ? 0 : 1;
} else if (cmd === 'init') {
  console.log(init(resolve(target ?? '.'), join(ROOT, 'templates/upkeep.yml')));
} else if (cmd === 'apply' && target) {
  const rep = applySpec(target, spec, { identifiers: !flag('--swap-only'), write: !flag('--dry-run') });
  for (const f of rep.changedFiles) {
    const es = rep.edits.filter((e) => e.file === f);
    console.log(`${f}  (${es.length} edits)`);
    for (const e of es.slice(0, 6)) console.log(`   L${e.line}  ${e.from}  ->  ${e.to}   [${e.kind}]`);
    if (es.length > 6) console.log(`   ... ${es.length - 6} more`);
  }
  console.log(`\n${rep.changedFiles.length} files changed. Left for a human: ${rep.human.length}.`);
  for (const h of rep.human) console.log(`   ${h.file}:${h.line}  ${h.what}`);
  if (rep.envNames.length) console.log(`   env vars kept (the SDK reads both names): ${rep.envNames.join(', ')}`);
} else if (cmd === 'check' && target) {
  const c = checkC(target, spec);
  console.log(`Check C: ${c.pass ? 'PASS' : 'FAIL'}`);
  for (const [k, v] of Object.entries(c)) if (Array.isArray(v) && v.length) { console.log(`  ${k}: ${v.length}`); for (const x of v.slice(0, 8)) console.log(`    ${typeof x === 'string' ? x : `${x.file}:${x.line}  ${x.what}`}`); }
  process.exitCode = c.pass ? 0 : 1;
} else if (cmd === 'run' && target) {
  const base = opt('--work-root') ?? join(homedir(), 'work/upkeep-runs');
  const only = opt('--only');
  const targets: Target[] = readFileSync(target, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => { const [repo, dir] = l.split('\t'); return { repo: repo.trim(), dir: (dir ?? '.').trim() || '.' }; })
    .filter((t) => !only || t.repo === only);
  const doneIds = new Set(flag('--again') ? [] : readResults(RESULTS).map((r) => r.repo));
  for (const t of targets) {
    if (doneIds.has(t.repo)) { console.log(`skip ${t.repo} (already in results; --again to rerun)`); continue; }
    console.log(`run  ${t.repo} ${t.dir}`);
    let r: Row;
    try { r = runTarget(t, { cache: join(base, 'cache'), work: join(base, 'work'), logs: join(base, 'logs'), results: RESULTS, build: flag('--build'), spec, budgetSec: Number(opt('--minutes') ?? 6) * 60 }); }
    catch (e) {
      // The harness itself failed on this repo (for example the clone failed): keep it in the table as an error.
      const now = new Date().toISOString(), fail = { ok: false, exit: null, secs: 0, log: String((e as Error).message).split('\n')[0] };
      appendFileSync(RESULTS, JSON.stringify({ id: t.repo.replace('/', '__'), repo: t.repo, commit: '', dir: t.dir, manager: '', installCmd: '', startedAt: now, finishedAt: now,
        oldVersions: {}, versionLanded: null, before: { install: fail, typecheck: null, build: null }, after: null, retry: null, checkC: null, change: null,
        human: 0, envNames: [], verdict: 'error' } satisfies Row) + '\n');
      console.log(`     error: ${fail.log}`); continue;
    }
    console.log(`     ${r.verdict}  before ${r.before.typecheck?.ok ? 'green' : 'red'}  after ${r.after?.typecheck?.ok ? 'green' : r.after ? 'red' : 'not run'}  checkC ${r.checkC?.pass ?? '-'}  files ${r.change?.files ?? '-'}`);
  }
  writeReadme(join(ROOT, 'README.md'), readResults(RESULTS));
} else if (cmd === 'targets') {
  const o = { since: opt('--since') ?? '2026-08-01', maxMb: Number(opt('--max-mb') ?? 150), pages: Number(opt('--pages') ?? 10) };
  const found = findTargets(spec, o);
  const out = opt('--out') ?? join(ROOT, 'targets/hexclave-search.tsv');
  writeTargets(out, found, o);
  console.log(`${found.all} repos found, ${found.kept.length} kept -> ${out}`);
} else if (cmd === 'guard-rows') {
  // Adds the agent block and the CI guard to moved repos from runs made before the guard step existed.
  const base = opt('--work-root') ?? join(homedir(), 'work/upkeep-runs');
  const latest = new Map<string, Row>();
  for (const r of readResults(RESULTS)) latest.set(r.id, r);
  for (const r of latest.values()) {
    if (r.guard || r.verdict === 'red after' || r.verdict.startsWith('not counted')) continue;
    const root = join(base, 'work', r.id, 'after');
    const applyJson = join(base, 'work', r.id, 'apply.json');
    if (!existsSync(root) || !existsSync(applyJson)) continue;
    const g = addGuard(root, spec, r, JSON.parse(readFileSync(applyJson, 'utf8')));
    appendFileSync(RESULTS, JSON.stringify({ ...r, guard: g }) + '\n');
    console.log(`${r.repo}: guard ${g.passes ? 'passes' : 'FAILS'} (${g.files.join(', ')})`);
  }
  writeReadme(join(ROOT, 'README.md'), readResults(RESULTS));
} else if (cmd === 'report') {
  writeReadme(join(ROOT, 'README.md'), readResults(RESULTS));
  console.log('README table written from runs/results.jsonl');
} else {
  console.log('usage: upkeep login | init [dir] | apply <dir> [--swap-only] [--dry-run] | check <dir> | run <targets.tsv> [--build] [--only owner/repo] [--again] | report');
  process.exitCode = 2;
}
