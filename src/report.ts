// Writes the README results table from runs/results.jsonl. Nothing in the table is typed by hand.
import { readFileSync, writeFileSync } from 'node:fs';
import type { Row, StepResult } from './run.ts';


export function latestRows(rows: Row[]): Row[] {
  const by = new Map<string, Row>();
  for (const r of rows) by.set(r.id, r); // last run per repo wins
  return [...by.values()];
}

const builtBefore = (r: Row) => !!r.before.build?.ok;
const builtAfter = (r: Row) => builtBefore(r) && !!r.after?.build?.ok && !!r.checkC?.pass;
const cutOff = (r: Row, s: StepResult | null | undefined) => r.verdict === 'timeout' && !!s && !s.ok && (s.exit === 124 || s.exit === 137 || s.exit === null);

function buildCell(r: Row, phase: 'before' | 'after'): string {
  if (r.verdict === 'error') return 'error';
  const steps = phase === 'before' ? [r.before.install, r.before.typecheck, r.before.build] : [r.after?.install, r.after?.typecheck, r.after?.build];
  if (steps.some((s) => cutOff(r, s))) return 'timeout';
  if (r.verdict === 'timeout' && !(phase === 'before' ? r.before.build : r.after?.build)) return 'timeout';
  if (phase === 'before' && !r.before.install.ok) return 'no (install failed)';
  if (phase === 'after' && !r.after) return 'not moved';
  if (phase === 'after' && !r.after!.install.ok) return 'no (install failed)';
  const s = phase === 'before' ? r.before.build : r.after!.build;
  if (!s) return (phase === 'before' ? r.before.typecheck : r.after!.typecheck) ? 'no build script' : 'no (no type check)';
  return s.ok ? 'yes' : 'no';
}

function oldLeft(r: Row): string {
  if (!r.checkC) return r.verdict === 'timeout' ? 'timeout' : r.verdict === 'error' ? 'error' : 'not moved';
  if (r.checkC.pass) return 'no';
  const n = r.checkC.oldSpecifiers.length + r.checkC.oldNames.length + r.checkC.oldHost.length;
  return n ? `yes (${n} place${n === 1 ? "" : "s"})` : 'no, but a file it must not edit changed';
}

const minutes = (r: Row) => ((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 60000).toFixed(1);

export function counts(rows: Row[]): { attempted: number; greenBefore: number; greenAfter: number } {
  const rs = latestRows(rows);
  return { attempted: rs.length, greenBefore: rs.filter(builtBefore).length, greenAfter: rs.filter(builtAfter).length };
}

export function table(rows: Row[]): string {
  const rs = latestRows(rows);
  const c = counts(rows);
  const head = [
    `**${c.greenAfter} of ${c.greenBefore}** repos that built before Upkeep still build after it, with none of the old package left (${c.attempted} repos attempted).`,
    '',
    '| Repo | Builds before | Builds after | Old package left | Minutes |',
    '|---|---|---|---|---|',
  ];
  const order = (r: Row) => (builtAfter(r) ? 0 : builtBefore(r) ? 1 : 2);
  const body = rs.sort((a, b) => order(a) - order(b) || a.repo.localeCompare(b.repo)).map((r) =>
    `| [${r.repo}](https://github.com/${r.repo}/tree/${r.commit}) | ${buildCell(r, 'before')} | ${buildCell(r, 'after')} | ${oldLeft(r)} | ${minutes(r)} |`);
  return [...head, ...body].join('\n');
}

export function writeReadme(readme: string, rows: Row[]): void {
  const t = readFileSync(readme, 'utf8');
  const start = '<!-- results:start -->', end = '<!-- results:end -->';
  const block = `${start}\n${table(rows)}\n${end}`;
  const out = t.includes(start) ? t.slice(0, t.indexOf(start)) + block + t.slice(t.indexOf(end) + end.length) : `${t}\n${block}\n`;
  writeFileSync(readme, out);
}
