// A migration spec: the provider's guide turned into data (see specs/hexclave.json).
import { readFileSync } from 'node:fs';

export interface Spec {
  provider: string;
  guide: { url: string; commit: string };
  oldScope: string;
  packages: Record<string, { to: string; source: string }>;
  humanOnlyPackages: Record<string, string>;
  version: string;
  fallbackVersion: string;
  identifiers: { source: string; map: Record<string, string> };
  hosts: { source: string; map: Record<string, string> };
  optional: { headers: { source: string; from: string; to: string }; env: { source: string; pattern: string } };
  notes: string[];
}

export function loadSpec(path: string): Spec {
  return JSON.parse(readFileSync(path, 'utf8')) as Spec;
}

// Old package names, longest first, so `@stackframe/stack-shared` is matched before `@stackframe/stack`.
export function oldPackages(spec: Spec): string[] {
  return Object.keys(spec.packages).sort((a, b) => b.length - a.length);
}

// '@stackframe/stack/convex.config' -> { pkg: '@stackframe/stack', sub: '/convex.config' }
export function splitSpecifier(spec: Spec, s: string): { pkg: string; sub: string } | null {
  for (const pkg of [...oldPackages(spec), ...Object.keys(spec.humanOnlyPackages)]) {
    if (s === pkg || s.startsWith(pkg + '/')) return { pkg, sub: s.slice(pkg.length) };
  }
  return null;
}

// Matches an old package name inside any string (globs, arrays of package names, docs), not a longer name.
export function packageRegex(spec: Spec): RegExp {
  const names = oldPackages(spec).map((p) => p.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'));
  return new RegExp(`(${names.join('|')})(?![\\w-])`, 'g');
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}
