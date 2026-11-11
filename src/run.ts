// The harness: for each target repo, the same install and the same checks before and after the move.
// Every row it writes to runs/results.jsonl is a real run; the README table is generated from that file only.
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { applySpec, type ApplyReport } from './apply.ts';
import { checkC, type CheckC } from './checkc.ts';
import { prBody } from './pr.ts';
import type { Spec } from './spec.ts';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const BOX = join(ROOT, 'scripts/box.sh');

export interface Target { repo: string; dir: string }
export interface StepResult { ok: boolean; exit: number | null; secs: number; errors?: number; log: string }
export interface Row {
  id: string; repo: string; commit: string; dir: string; manager: string; installCmd: string;
  startedAt: string; finishedAt: string;
  oldVersions: Record<string, string>; versionLanded: string | null;
  before: { install: StepResult; typecheck: StepResult | null; build: StepResult | null };
  after: { install: StepResult; typecheck: StepResult | null; build: StepResult | null } | null;
  retry: { version: string; install: StepResult; typecheck: StepResult | null } | null;
  checkC: Omit<CheckC, 'humanOnly'> & { humanOnly: number } | null;
  change: { files: number; added: number; removed: number; lockfileChanged: boolean } | null;
  human: number; envNames: string[];
  verdict: 'moved' | 'moved at fallback version' | 'partial' | 'red after' | 'not counted (red before)' | 'not counted (no type check)' | 'not counted (install failed)';
}

function sh(cmd: string[], cwd: string, log: string, timeoutSec: number, env: Record<string, string> = {}): StepResult {
  const t0 = Date.now();
  mkdirSync(dirname(log), { recursive: true });
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd, env: { ...process.env, ...env }, timeout: timeoutSec * 1000, maxBuffer: 1 << 28, encoding: 'utf8' });
  const out = `$ ${cmd.join(' ')}\n(cwd ${cwd})\n${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? `\n${r.error.message}` : ''}\nexit ${r.status}\n`;
  writeFileSync(log, out);
  return { ok: r.status === 0, exit: r.status, secs: Math.round((Date.now() - t0) / 100) / 10, log };
}

function managerOf(dir: string, root: string): { name: string; cmd: string[] } {
  const has = (f: string) => existsSync(join(dir, f)) || existsSync(join(root, f));
  if (has('bun.lock') || has('bun.lockb')) return { name: 'bun', cmd: ['bun', 'install', '--ignore-scripts'] };
  if (has('pnpm-lock.yaml')) return { name: 'pnpm', cmd: ['pnpm', 'install', '--ignore-scripts', '--no-frozen-lockfile', '--config.confirmModulesPurge=false'] };
  if (has('yarn.lock')) return { name: 'yarn', cmd: ['corepack', 'yarn', 'install', '--ignore-scripts'] };
  return { name: has('package-lock.json') ? 'npm' : 'npm (no lockfile)', cmd: ['npm', 'install', '--ignore-scripts', '--no-audit', '--no-fund'] };
}

const INSTALL_ENV = { CI: '1', COREPACK_ENABLE_DOWNLOAD_PROMPT: '0', COREPACK_ENABLE_STRICT: '0', HUSKY: '0', npm_config_update_notifier: 'false' };

function typecheck(dir: string, log: string): StepResult | null {
  if (!existsSync(join(dir, 'node_modules/.bin/tsc')) || !existsSync(join(dir, 'tsconfig.json'))) return null;
  const r = sh([BOX, dir, 'node_modules/.bin/tsc', '--noEmit', '-p', 'tsconfig.json'], dir, log, 900);
  r.errors = (readFileSync(log, 'utf8').match(/error TS\d+/g) ?? []).length;
  return r;
}

function build(dir: string, log: string): StepResult | null {
  const pj = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  if (!pj.scripts?.build) return null;
  return sh([BOX, dir, 'npm', 'run', 'build'], dir, log, 900);
}

function oldVersions(dir: string, spec: Spec): Record<string, string> {
  const pj = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const out: Record<string, string> = {};
  for (const s of ['dependencies', 'devDependencies']) for (const [k, v] of Object.entries<string>(pj[s] ?? {})) if (spec.packages[k]) out[k] = v;
  return out;
}

function numstat(root: string): { files: number; added: number; removed: number; lockfileChanged: boolean } {
  const r = spawnSync('git', ['-C', root, 'diff', '--numstat'], { encoding: 'utf8' });
  let files = 0, added = 0, removed = 0, lock = false;
  for (const l of r.stdout.trim().split('\n').filter(Boolean)) {
    const [a, d, f] = l.split('\t');
    if (/(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/.test(f)) { lock = true; continue; }
    files++; added += Number(a) || 0; removed += Number(d) || 0;
  }
  return { files, added, removed, lockfileChanged: lock };
}

export interface RunOptions { cache: string; work: string; logs: string; results: string; build: boolean; spec: Spec }

export function runTarget(t: Target, o: RunOptions): Row {
  const id = t.repo.replace('/', '__');
  const src = join(o.cache, id);
  if (!existsSync(join(src, '.git'))) {
    mkdirSync(o.cache, { recursive: true });
    spawnSync('git', ['clone', '--depth', '1', '--quiet', `https://github.com/${t.repo}.git`, src], { timeout: 300_000 });
  }
  const commit = spawnSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  const startedAt = new Date().toISOString();
  const L = (phase: string, step: string) => join(o.logs, id, `${phase}.${step}.log`);
  const fresh = (name: string) => { const d = join(o.work, id, name); rmSync(d, { recursive: true, force: true }); cpSync(src, d, { recursive: true }); return d; };

  // Before: untouched copy.
  const bRoot = fresh('before');
  const bDir = join(bRoot, t.dir);
  const mgr = managerOf(bDir, bRoot);
  const installAt = (root: string, dir: string, log: string) => sh(mgr.cmd, mgr.name === 'bun' && existsSync(join(root, 'bun.lock')) ? root : dir, log, 900, INSTALL_ENV);
  const row: Row = {
    id, repo: t.repo, commit, dir: t.dir, manager: mgr.name, installCmd: mgr.cmd.join(' '), startedAt, finishedAt: '',
    oldVersions: oldVersions(bDir, o.spec), versionLanded: null,
    before: { install: installAt(bRoot, bDir, L('before', 'install')), typecheck: null, build: null },
    after: null, retry: null, checkC: null, change: null, human: 0, envNames: [], verdict: 'not counted (red before)',
  };
  const done = (r: Row) => { r.finishedAt = new Date().toISOString(); appendFileSync(o.results, JSON.stringify(r) + '\n'); return r; };
  if (!row.before.install.ok) { row.verdict = 'not counted (install failed)'; return done(row); }
  row.before.typecheck = typecheck(bDir, L('before', 'typecheck'));
  if (!row.before.typecheck) { row.verdict = 'not counted (no type check)'; return done(row); }
  if (o.build) row.before.build = build(bDir, L('before', 'build'));

  // After: a second untouched copy, moved by Upkeep, then the same install and checks.
  const aRoot = fresh('after');
  const aDir = join(aRoot, t.dir);
  const rep: ApplyReport = applySpec(aRoot, o.spec);
  const c = checkC(aRoot, o.spec, rep.changedFiles);
  row.checkC = { ...c, humanOnly: c.humanOnly.length };
  row.change = numstat(aRoot);
  row.human = rep.human.length;
  row.envNames = rep.envNames;
  writeFileSync(join(o.work, id, 'PR.md'), prBody(t.repo, commit, o.spec, rep, c));
  writeFileSync(join(o.work, id, 'apply.json'), JSON.stringify(rep, null, 1));
  const aInstall = installAt(aRoot, aDir, L('after', 'install'));
  row.change.lockfileChanged = numstat(aRoot).lockfileChanged;
  row.after = { install: aInstall, typecheck: aInstall.ok ? typecheck(aDir, L('after', 'typecheck')) : null, build: null };
  if (o.build && aInstall.ok) row.after.build = build(aDir, L('after', 'build'));
  if (row.after.typecheck?.ok) row.versionLanded = o.spec.version;

  // Red after a green before: retry at the first release of the new packages, to separate the rename from release drift.
  if (row.before.typecheck.ok && !row.after.typecheck?.ok) {
    const rRoot = fresh('after-fallback');
    applySpec(rRoot, o.spec, { version: o.spec.fallbackVersion });
    const ri = installAt(rRoot, join(rRoot, t.dir), L('fallback', 'install'));
    row.retry = { version: o.spec.fallbackVersion, install: ri, typecheck: ri.ok ? typecheck(join(rRoot, t.dir), L('fallback', 'typecheck')) : null };
    if (row.retry.typecheck?.ok) row.versionLanded = o.spec.fallbackVersion;
  }

  const buildOk = !o.build || !row.before.build?.ok || row.after.build?.ok;
  if (!row.before.typecheck.ok) row.verdict = 'not counted (red before)';
  else if (!row.versionLanded || !buildOk) row.verdict = 'red after';
  else if (!c.pass) row.verdict = 'partial';
  else row.verdict = row.versionLanded === o.spec.version ? 'moved' : 'moved at fallback version';
  return done(row);
}

export function readResults(path: string): Row[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Row);
}
