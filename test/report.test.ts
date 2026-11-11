import { test } from 'node:test';
import assert from 'node:assert/strict';
import { counts, table } from '../src/report.ts';
import type { Row, StepResult } from '../src/run.ts';

const ok = (secs = 1): StepResult => ({ ok: true, exit: 0, secs, log: '' });
const red = (exit: number | null = 1): StepResult => ({ ok: false, exit, secs: 1, log: '' });
const pass = { pass: true, oldSpecifiers: [], oldNames: [], oldHost: [], neverTouched: [], humanOnly: 0 };
const row = (repo: string, over: Partial<Row>): Row => ({
  id: repo.replace('/', '__'), repo, commit: 'abcdef1234567', dir: '.', manager: 'npm', installCmd: 'npm install',
  startedAt: '2026-11-11T12:00:00.000Z', finishedAt: '2026-11-11T12:03:00.000Z', oldVersions: {}, versionLanded: null,
  before: { install: ok(), typecheck: ok(), build: ok() }, after: { install: ok(), typecheck: ok(), build: ok() },
  retry: null, checkC: pass, change: null, human: 0, envNames: [], verdict: 'moved', ...over,
});

test('headline and cells use the same rule: built before, built after, nothing old left', () => {
  const rows = [
    row('a/moved', {}),
    row('b/red-after', { after: { install: ok(), typecheck: red(), build: red() }, verdict: 'red after' }),
    row('c/left', { checkC: { ...pass, pass: false, oldNames: [{ file: 'x.ts', line: 1, what: 'StackProvider' }] }, verdict: 'partial' }),
    row('d/red-before', { before: { install: ok(), typecheck: red(), build: red() }, verdict: 'not counted (red before)' }),
    row('e/timeout', { before: { install: ok(), typecheck: ok(), build: red(124) }, after: null, checkC: null, verdict: 'timeout' }),
  ];
  assert.deepEqual(counts(rows), { attempted: 5, greenBefore: 3, greenAfter: 1 });
  const t = table(rows);
  assert.match(t, /\*\*1 of 3\*\* repos that built before Upkeep still build after it/);
  assert.match(t, /\| Repo \| Builds before \| Builds after \| Old package left \| Minutes \|/);
  assert.match(t, /a\/moved\/tree\/abcdef1234567\) \| yes \| yes \| no \| 3\.0 \|/);
  assert.match(t, /b\/red-after.*\| yes \| no \| no \|/);
  assert.match(t, /c\/left.*\| yes \| yes \| yes \(1 place\) \|/);
  assert.match(t, /e\/timeout.*\| timeout \| timeout \| timeout \|/);
});

test('the last run of a repo wins', () => {
  const rows = [row('a/x', { before: { install: red(), typecheck: null, build: null }, after: null, verdict: 'not counted (install failed)' }), row('a/x', {})];
  assert.deepEqual(counts(rows), { attempted: 1, greenBefore: 1, greenAfter: 1 });
});
