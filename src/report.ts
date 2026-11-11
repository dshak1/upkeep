// Writes the README results table from runs/results.jsonl. Nothing in the table is typed by hand.
import { readFileSync, writeFileSync } from 'node:fs';
import type { Row, StepResult } from './run.ts';

const cell = (s: StepResult | null | undefined) => !s ? 'n/a' : s.ok ? `green${s.secs ? ` (${s.secs}s)` : ''}` : `red${s.errors !== undefined ? ` (${s.errors} errors)` : ''}`;

export function latestRows(rows: Row[]): Row[] {
  const by = new Map<string, Row>();
  for (const r of rows) by.set(r.id, r); // last run per repo wins
  return [...by.values()];
}

export function table(rows: Row[]): string {
  const rs = latestRows(rows);
  const counted = rs.filter((r) => r.before.typecheck?.ok);
  const moved = counted.filter((r) => r.verdict === 'moved' || r.verdict === 'moved at fallback version');
  const head = [
    `**${moved.length} of ${counted.length}** repos that type-checked before the move still type-check after it, with no old package import or old name left (Check C). ` +
    `${rs.length} repos attempted; ${rs.length - counted.length} were not counted because they were red, had no type check or failed to install before Upkeep touched them.`,
    '',
    '| Repo | Commit | Manager | Old version | Type check before | Type check after | Build before | Build after | Check C | Files changed | Lines +/- | Left for a human | Verdict |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  const order = (r: Row) => (r.verdict.startsWith('moved') ? 0 : r.verdict === 'partial' ? 1 : r.verdict === 'red after' ? 2 : 3);
  const body = rs.sort((a, b) => order(a) - order(b) || a.repo.localeCompare(b.repo)).map((r) => {
    const after = r.retry?.typecheck?.ok ? `${cell(r.after?.typecheck)}; green at ${r.retry.version}` : cell(r.after?.typecheck);
    return `| [${r.repo}](https://github.com/${r.repo}) | \`${r.commit.slice(0, 7)}\` | ${r.manager} | ${Object.values(r.oldVersions).join(', ') || 'n/a'} | ${cell(r.before.typecheck)} | ${r.after ? after : 'not run'} | ${cell(r.before.build)} | ${cell(r.after?.build)} | ${r.checkC ? (r.checkC.pass ? 'pass' : 'fail') : 'not run'} | ${r.change?.files ?? ''} | ${r.change ? `+${r.change.added} / -${r.change.removed}` : ''} | ${r.after ? r.human : ''} | ${r.verdict} |`;
  });
  return [...head, ...body].join('\n');
}

export function writeReadme(readme: string, rows: Row[]): void {
  const t = readFileSync(readme, 'utf8');
  const start = '<!-- results:start -->', end = '<!-- results:end -->';
  const block = `${start}\n${table(rows)}\n${end}`;
  const out = t.includes(start) ? t.slice(0, t.indexOf(start)) + block + t.slice(t.indexOf(end) + end.length) : `${t}\n${block}\n`;
  writeFileSync(readme, out);
}
