// Fixture tests: one per guide row and per edge the guide does not mention.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { applySpec } from '../src/apply.ts';
import { checkC } from '../src/checkc.ts';
import { loadSpec } from '../src/spec.ts';

const spec = loadSpec(new URL('../specs/hexclave.json', import.meta.url).pathname);

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'upkeep-'));
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), t);
  }
  return dir;
}
const read = (dir: string, p: string) => readFileSync(join(dir, p), 'utf8');

test('package.json: old packages renamed in place, version set, order kept (guide L13 to L24)', () => {
  const dir = fixture({ 'package.json': '{\n  "name": "x",\n  "dependencies": {\n    "@stackframe/stack": "^2.7.16",\n    "next": "15.1.11",\n    "@stackframe/stack-shared": "2.8.1"\n  }\n}\n' });
  applySpec(dir, spec);
  const j = JSON.parse(read(dir, 'package.json'));
  assert.deepEqual(Object.keys(j.dependencies), ['@hexclave/next', 'next', '@hexclave/shared']);
  assert.equal(j.dependencies['@hexclave/next'], '^1.0.136');
  assert.ok(read(dir, 'package.json').endsWith('}\n'));
});

test('imports and the names imported from the package are renamed, with their uses (guide L26 to L34)', () => {
  const dir = fixture({
    'app/layout.tsx': [
      'import { StackProvider, StackTheme } from "@stackframe/stack";',
      'import { stackServerApp } from "../stack";',
      'export default function L({ children }: { children: React.ReactNode }) {',
      '  return <StackProvider app={stackServerApp}><StackTheme>{children}</StackTheme></StackProvider>;',
      '}',
    ].join('\n'),
    'stack.ts': 'import "server-only";\nimport { StackServerApp } from "@stackframe/stack";\nexport const stackServerApp = new StackServerApp({ tokenStore: "nextjs-cookie" });\n',
  });
  const rep = applySpec(dir, spec);
  const layout = read(dir, 'app/layout.tsx');
  assert.match(layout, /import \{ HexclaveProvider, HexclaveTheme \} from "@hexclave\/next";/);
  assert.match(layout, /<HexclaveProvider app=\{stackServerApp\}><HexclaveTheme>\{children\}<\/HexclaveTheme><\/HexclaveProvider>/);
  assert.match(layout, /from "\.\.\/stack"/, 'the user\'s own stack.ts is not renamed');
  assert.equal(read(dir, 'stack.ts'), 'import "server-only";\nimport { HexclaveServerApp } from "@hexclave/next";\nexport const stackServerApp = new HexclaveServerApp({ tokenStore: "nextjs-cookie" });\n');
  assert.deepEqual(rep.changedFiles.sort(), ['app/layout.tsx', 'stack.ts']);
  assert.ok(checkC(dir, spec, rep.changedFiles).pass);
});

test('aliased imports change only the imported name; namespace imports change member names', () => {
  const dir = fixture({
    'a.ts': 'import { useStackApp as useApp } from "@stackframe/react";\nexport const f = () => useApp();\n',
    'b.ts': 'import * as S from "@stackframe/js";\nexport const app = new S.StackClientApp({ tokenStore: "cookie" });\nexport type T = S.StackServerApp;\n',
  });
  applySpec(dir, spec);
  assert.equal(read(dir, 'a.ts'), 'import { useHexclaveApp as useApp } from "@hexclave/react";\nexport const f = () => useApp();\n');
  assert.equal(read(dir, 'b.ts'), 'import * as S from "@hexclave/js";\nexport const app = new S.HexclaveClientApp({ tokenStore: "cookie" });\nexport type T = S.HexclaveServerApp;\n');
});

test('names that only look like the package are left alone', () => {
  const src = 'const StackProvider = 1;\nconst stack = { StackProvider: 2 };\nexport { StackProvider, stack };\n';
  const dir = fixture({ 'c.ts': src });
  const rep = applySpec(dir, spec);
  assert.equal(read(dir, 'c.ts'), src);
  assert.equal(rep.changedFiles.length, 0);
});

test('object keys, shorthand properties and re-exports keep this file\'s own names', () => {
  const dir = fixture({
    'd.ts': 'import { StackClientApp } from "@stackframe/stack";\nexport { StackServerApp } from "@stackframe/stack";\nexport const o = { StackClientApp, k: StackClientApp };\nexport const p = { StackClientApp: 1 };\n',
  });
  applySpec(dir, spec);
  assert.equal(read(dir, 'd.ts'), 'import { HexclaveClientApp } from "@hexclave/next";\nexport { HexclaveServerApp as StackServerApp } from "@hexclave/next";\nexport const o = { StackClientApp: HexclaveClientApp, k: HexclaveClientApp };\nexport const p = { StackClientApp: 1 };\n');
});

test('old API host is swapped, including inside a JWT issuer (guide L40, L54 to L70)', () => {
  const dir = fixture({ 'jwt.ts': 'export const iss = "https://api.stack-auth.com/api/v1/projects/" + id;\nexport const opts = { issuer: `https://api.stack-auth.com/api/v1/projects/${id}` };\n' });
  const rep = applySpec(dir, spec);
  assert.doesNotMatch(read(dir, 'jwt.ts'), /stack-auth/);
  assert.ok(rep.human.some((h) => h.what === 'JWT issuer check'), 'the iss check is flagged for a human to confirm');
});

test('deep imports are rewritten and flagged; init-stack is left and flagged', () => {
  const dir = fixture({
    'e.ts': 'import { x } from "@stackframe/stack-ui/dist/components/ui/button";\nimport init from "@stackframe/init-stack";\n',
    'package.json': '{"scripts":{"setup":"npx @stackframe/init-stack"},"devDependencies":{"@stackframe/init-stack":"2.8.1"}}',
  });
  const rep = applySpec(dir, spec);
  assert.match(read(dir, 'e.ts'), /"@hexclave\/ui\/dist\/components\/ui\/button"/);
  assert.match(read(dir, 'e.ts'), /"@stackframe\/init-stack"/);
  assert.ok(rep.human.some((h) => h.what.startsWith('deep import')));
  assert.ok(rep.human.some((h) => h.what.includes('init-stack')));
  assert.ok(rep.human.some((h) => h.what.startsWith('script "setup"')));
  const c = checkC(dir, spec, rep.changedFiles);
  assert.ok(c.pass, 'human-only packages are reported, not failed');
  assert.ok(c.humanOnly.length >= 1);
});

test('tests, tsconfig and CI are never edited; build config gets the package-name swap only', () => {
  const dir = fixture({
    'app.test.ts': 'import { StackServerApp } from "@stackframe/stack";\n',
    'tsconfig.json': '{"compilerOptions":{"paths":{"x":["node_modules/@stackframe/stack"]}}}',
    'next.config.ts': 'export default { transpilePackages: ["@stackframe/stack"], images: { domains: ["api.stack-auth.com"] } };\n',
    'tailwind.config.js': 'module.exports = { content: ["./node_modules/@stackframe/stack/dist/**/*.{js,mjs}"] };\n',
  });
  const rep = applySpec(dir, spec);
  assert.equal(read(dir, 'app.test.ts'), 'import { StackServerApp } from "@stackframe/stack";\n');
  assert.match(read(dir, 'tsconfig.json'), /@stackframe/);
  assert.equal(read(dir, 'next.config.ts'), 'export default { transpilePackages: ["@hexclave/next"], images: { domains: ["api.stack-auth.com"] } };\n');
  assert.match(read(dir, 'tailwind.config.js'), /node_modules\/@hexclave\/next\/dist/);
  assert.ok(rep.human.some((h) => h.file === 'app.test.ts'));
  assert.deepEqual(checkC(dir, spec, rep.changedFiles).neverTouched, []);
});

test('env vars are not renamed by default; their names are listed (guide L47)', () => {
  const dir = fixture({ 'f.ts': 'export const id = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;\n', '.env.example': 'STACK_SECRET_SERVER_KEY=\n' });
  const rep = applySpec(dir, spec);
  assert.match(read(dir, 'f.ts'), /NEXT_PUBLIC_STACK_PROJECT_ID/);
  assert.deepEqual(rep.envNames, ['NEXT_PUBLIC_STACK_PROJECT_ID', 'STACK_SECRET_SERVER_KEY']);
});

test('Check C catches the package swap that skips the renames (it still typechecks)', () => {
  const dir = fixture({ 'g.tsx': 'import { StackProvider } from "@stackframe/stack";\nexport const P = StackProvider;\n' });
  const rep = applySpec(dir, spec, { identifiers: false });
  assert.equal(read(dir, 'g.tsx'), 'import { StackProvider } from "@hexclave/next";\nexport const P = StackProvider;\n');
  const c = checkC(dir, spec, rep.changedFiles);
  assert.equal(c.pass, false);
  assert.deepEqual(c.oldNames.map((f) => f.what), ['StackProvider from @hexclave/next']);
});

test('type-only imports, import() types and dynamic imports', () => {
  const dir = fixture({ 'h.ts': 'import type { StackServerApp } from "@stackframe/stack";\nexport type A = StackServerApp;\nexport type B = import("@stackframe/stack").StackClientApp;\nexport const m = () => import("@stackframe/stack");\n' });
  applySpec(dir, spec);
  assert.equal(read(dir, 'h.ts'), 'import type { HexclaveServerApp } from "@hexclave/next";\nexport type A = HexclaveServerApp;\nexport type B = import("@hexclave/next").HexclaveClientApp;\nexport const m = () => import("@hexclave/next");\n');
});

test('a dry run changes nothing on disk', () => {
  const src = 'import { StackProvider } from "@stackframe/stack";\n';
  const dir = fixture({ 'i.ts': src });
  const rep = applySpec(dir, spec, { write: false });
  assert.equal(read(dir, 'i.ts'), src);
  assert.deepEqual(rep.changedFiles, ['i.ts']);
});
