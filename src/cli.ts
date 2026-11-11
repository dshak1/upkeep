#!/usr/bin/env node
// upkeep apply <dir> [--swap-only] [--dry-run]   move one checkout and print what changed and what is left
// upkeep check <dir>                             Check C on a checkout
// upkeep run <targets.tsv> [--build] [--only owner/repo]   the harness: before and after, rows to runs/results.jsonl
// upkeep report                                  regenerate the README table from runs/results.jsonl
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { applySpec } from './apply.ts';
import { checkC } from './checkc.ts';
import { readResults, runTarget, type Target } from './run.ts';
import { writeReadme } from './report.ts';
import { loadSpec } from './spec.ts';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const spec = loadSpec(opt('--spec') ?? join(ROOT, 'specs/hexclave.json'));
const RESULTS = join(ROOT, 'runs/results.jsonl');
const [cmd, target] = args;

if (cmd === 'apply' && target) {
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
    const r = runTarget(t, { cache: join(base, 'cache'), work: join(base, 'work'), logs: join(base, 'logs'), results: RESULTS, build: flag('--build'), spec });
    console.log(`     ${r.verdict}  before ${r.before.typecheck?.ok ? 'green' : 'red'}  after ${r.after?.typecheck?.ok ? 'green' : r.after ? 'red' : 'not run'}  checkC ${r.checkC?.pass ?? '-'}  files ${r.change?.files ?? '-'}`);
  }
  writeReadme(join(ROOT, 'README.md'), readResults(RESULTS));
} else if (cmd === 'report') {
  writeReadme(join(ROOT, 'README.md'), readResults(RESULTS));
  console.log('README table written from runs/results.jsonl');
} else {
  console.log('usage: upkeep apply <dir> [--swap-only] [--dry-run] | check <dir> | run <targets.tsv> [--build] [--only owner/repo] [--again] | report');
  process.exitCode = 2;
}
