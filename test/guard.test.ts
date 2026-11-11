// The guard passes on a moved repo and fails when the old package or an old name comes back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { applySpec } from '../src/apply.ts';
import { writeGuard } from '../src/guard.ts';
import { loadSpec } from '../src/spec.ts';

const spec = loadSpec(new URL('../specs/hexclave.json', import.meta.url).pathname);
const git = (dir: string, ...a: string[]) => spawnSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
const guard = (dir: string) => { git(dir, 'add', '-A'); return spawnSync('bash', ['.github/upkeep-guard.sh'], { cwd: dir, encoding: 'utf8' }); };

function repo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'upkeep-guard-'));
  for (const [p, t] of Object.entries(files)) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), t); }
  git(dir, 'init', '-q'); git(dir, 'add', '-A'); git(dir, 'commit', '-qm', 'base');
  return dir;
}
const verified = { date: '2026-11-11', typecheck: 'green before and after', build: null, versionLanded: '^1.0.136', envNames: ['STACK_SECRET_SERVER_KEY'], allow: ['app.test.ts'] };

test('after the move the guard passes, the agent block is written, and old test files are excluded by name', () => {
  const dir = repo({
    'app/page.tsx': 'import { StackProvider } from "@stackframe/stack";\nexport const P = StackProvider;\n',
    'app.test.ts': 'import "@stackframe/stack";\n',
    'CLAUDE.md': '# Project\n\nUse pnpm.\n',
  });
  applySpec(dir, spec);
  const files = writeGuard(dir, spec, verified);
  assert.deepEqual(files, ['CLAUDE.md', '.github/upkeep-guard.sh', '.github/workflows/upkeep-guard.yml']);
  const md = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(md, /^# Project\n\nUse pnpm\.\n\n<!-- upkeep:hexclave:start -->/);
  assert.match(md, /Never add `@stackframe\/\*`: those packages are frozen at 2\.8\.108/);
  const r = guard(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  writeGuard(dir, spec, verified);
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8').split('upkeep:hexclave:start').length, 2, 'rewriting replaces the block, not appends');
});

test('the guard fails when an old package import comes back', () => {
  const dir = repo({ 'a.ts': 'export {};\n' });
  writeGuard(dir, spec, { ...verified, allow: [] });
  writeFileSync(join(dir, 'b.ts'), 'import { StackServerApp } from "@stackframe/stack";\n');
  const r = guard(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /b\.ts:1:/);
});

test('the guard fails when an old name is imported from the new package, across lines', () => {
  const dir = repo({ 'a.ts': 'export {};\n' });
  writeGuard(dir, spec, { ...verified, allow: [] });
  writeFileSync(join(dir, 'c.tsx'), 'import {\n  HexclaveTheme,\n  StackProvider,\n} from "@hexclave/next";\n');
  const r = guard(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /c\.tsx: imports the old name StackProvider/);
});
