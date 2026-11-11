// The pull request body for one moved repo: what changed, which guide line asked for it, what a human must do.
import type { ApplyReport } from './apply.ts';
import type { CheckC } from './checkc.ts';
import type { Spec } from './spec.ts';

const scopeOf = (names: string[]) => {
  const scopes = new Set(names.map((n) => (n.startsWith('@') ? n.split('/')[0] + '/*' : n)));
  return scopes.size === 1 && names.length > 1 ? [...scopes][0] : names.join(', ');
};
const fromNames = (spec: Spec) => scopeOf(Object.keys(spec.packages));
const toNames = (spec: Spec) => scopeOf(Object.values(spec.packages).map((p) => p.to));

export function prBody(repo: string, commit: string, spec: Spec, rep: ApplyReport, c: CheckC): string {
  const byKind = new Map<string, number>();
  for (const e of rep.edits) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
  const lines = [
    `# Move ${repo} from ${fromNames(spec)} to ${toNames(spec)}`,
    '',
    `${spec.provider} renamed its packages. The old ones still work and are frozen; this moves the code to the new ones, following the migration guide (${spec.guide.url}).`,
    `Base commit: \`${commit.slice(0, 12)}\`.`,
    '',
    '## What changed',
    '',
    `${rep.changedFiles.length} files.`,
    '',
    '| Change | Count |',
    '|---|---|',
    ...[...byKind.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${n} |`),
    '',
    '## Checks',
    '',
    `- Old package imports left in source and manifests: ${c.oldSpecifiers.length}`,
    `- Old names imported from the new packages: ${c.oldNames.length}`,
    `- Old API host left in code: ${c.oldHost.length}`,
    `- Files Upkeep must never edit (tests, tsconfig, lint, CI) that changed: ${c.neverTouched.length}`,
    '- Type check: see the results table in the Upkeep README for the before and after runs.',
    '',
    '## Left for a human',
    '',
    ...(rep.human.length ? rep.human.map((h) => `- \`${h.file}:${h.line}\` ${h.what}. ${h.why}`) : ['- Nothing found.']),
    ...(rep.envNames.length ? [`- Env vars, not renamed: ${rep.envNames.map((n) => `\`${n}\``).join(', ')}.`] : []),
    ...spec.notes.map((n) => `- ${n}`),
    '',
  ];
  return lines.join('\n');
}
