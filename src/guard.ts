// After a move: (a) the verified "what changed" block in the repo's agent instructions, so a coding agent
// writing new code reaches for the new package, and (b) a CI check that fails if the old package or names come back.
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import type { Spec } from './spec.ts';

export interface Verified { date: string; typecheck: string; build: string | null; versionLanded: string; envNames: string[]; allow: string[] }

const START = '<!-- upkeep:hexclave:start -->';
const END = '<!-- upkeep:hexclave:end -->';

export function agentBlock(spec: Spec, v: Verified): string {
  const names = Object.values(spec.identifiers.map).filter((n) => /Provider|ServerApp|ClientApp|useHexclaveApp|Handler|Theme$/.test(n) && !/Constructor|Json/.test(n));
  return [
    START,
    '## Auth SDK: Hexclave (was Stack Auth)',
    '',
    `Moved from \`@stackframe/*\` to \`@hexclave/*\` by Upkeep on ${v.date}, following Hexclave's migration guide (${spec.guide.url}).`,
    `Checked on that move: type check ${v.typecheck}${v.build ? `, build ${v.build}` : ''}, on ${Object.values(spec.packages)[0].to}@${v.versionLanded.replace(/^\^/, '')}.`,
    '',
    `- Install and import ${Object.values(spec.packages).slice(0, 3).map((p) => `\`${p.to}\``).join(', ')}. Never add \`@stackframe/*\`: those packages are frozen at ${spec.frozen.version} (last release ${spec.frozen.lastRelease}).`,
    `- Use the \`Hexclave*\` names (${names.map((n) => `\`${n}\``).join(', ')}). The old \`Stack*\` names still resolve as aliases; do not use them in new code.`,
    `- API host: \`${Object.values(spec.hosts.map)[0]}\`.`,
    ...(v.envNames.length ? [`- Env vars: the SDK reads \`HEXCLAVE_*\` first, then the old \`STACK_*\` names. This repo still sets ${v.envNames.map((n) => `\`${n}\``).join(', ')}.`] : []),
    '- CI: `.github/workflows/upkeep-guard.yml` fails if an old package or an old name comes back.',
    END,
  ].join('\n');
}

export function guardScript(spec: Spec, allow: string[]): string {
  const tpl = readFileSync(new URL('../templates/upkeep-guard.sh', import.meta.url), 'utf8');
  const excludes = ["':!*lock*'", "':!**/bun.lock'", "':!.github/upkeep-guard.sh'", "':!AGENTS.md'", "':!CLAUDE.md'", ...allow.map((f) => `':!${f}'`)].join(' ');
  return tpl
    .replaceAll('__GUIDE__', spec.guide.url)
    .replaceAll('__FROZEN__', spec.frozen.version)
    .replaceAll('__PKGS__', Object.keys(spec.packages).map((p) => p.replace(spec.oldScope, '')).join('|'))
    .replaceAll('__NAMES__', Object.keys(spec.identifiers.map).join('|'))
    .replaceAll('__EXCLUDES__', excludes);
}

export const WORKFLOW = `name: upkeep-guard
on: [push, pull_request]
jobs:
  old-sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: No old @stackframe/* package or Stack* name
        run: bash .github/upkeep-guard.sh
`;

// Writes both. Returns the files it added or changed.
export function writeGuard(root: string, spec: Spec, v: Verified): string[] {
  const files: string[] = [];
  const target = existsSync(join(root, 'AGENTS.md')) || !existsSync(join(root, 'CLAUDE.md')) ? 'AGENTS.md' : 'CLAUDE.md';
  const p = join(root, target);
  const old = existsSync(p) ? readFileSync(p, 'utf8') : '';
  const block = agentBlock(spec, v);
  const next = old.includes(START) ? old.slice(0, old.indexOf(START)) + block + old.slice(old.indexOf(END) + END.length) : (old ? old.replace(/\n*$/, '\n\n') : '') + block + '\n';
  writeFileSync(p, next);
  files.push(target);
  mkdirSync(join(root, '.github/workflows'), { recursive: true });
  writeFileSync(join(root, '.github/upkeep-guard.sh'), guardScript(spec, v.allow));
  chmodSync(join(root, '.github/upkeep-guard.sh'), 0o755);
  writeFileSync(join(root, '.github/workflows/upkeep-guard.yml'), WORKFLOW);
  files.push('.github/upkeep-guard.sh', '.github/workflows/upkeep-guard.yml');
  return files;
}
