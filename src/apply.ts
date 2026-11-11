// Applies a spec to a checkout: manifests, imports, the identifiers imported from the package, hosts.
// Every edit records the guide line that asked for it. What it will not do safely goes to `human`.
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { classify, listFiles, readText, type FileKind } from './files.ts';
import { escapeRegex, packageRegex, splitSpecifier, type Spec } from './spec.ts';

export interface Edit { file: string; line: number; kind: string; from: string; to: string }
export interface HumanItem { file: string; line: number; what: string; why: string }
export interface ApplyOptions {
  version?: string;          // version range written for the new packages
  identifiers?: boolean;     // false = package swap only (used to show what Check C catches)
  write?: boolean;           // false = dry run
}
export interface ApplyReport {
  changedFiles: string[];
  edits: Edit[];
  human: HumanItem[];
  envNames: string[];
  headerRefs: number;
}

const DEP_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'overrides', 'resolutions'];
const KNOWN_SUBPATHS = new Set(['', '/convex.config', '/convex-auth.config']);

function lineOf(text: string, pos: number): number {
  let n = 1;
  for (let i = 0; i < pos && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

// ---------- package.json ----------
export function transformManifest(file: string, text: string, spec: Spec, version: string, rep: ApplyReport): string {
  let j: Record<string, any>;
  try { j = JSON.parse(text); } catch { return text; }
  let changed = false;
  const renameIn = (obj: Record<string, string> | undefined, section: string) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (!Object.keys(obj).some((k) => spec.packages[k] || spec.humanOnlyPackages[k])) return obj;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      const to = spec.packages[k]?.to;
      if (to) {
        if (!(to in obj)) out[to] = section === 'peerDependencies' ? v : version;
        rep.edits.push({ file, line: lineOf(text, text.indexOf(`"${k}"`)), kind: `package (${spec.packages[k].source})`, from: `${k}@${v}`, to: `${to}@${out[to] ?? obj[to]}` });
        changed = true;
      } else {
        out[k] = v;
        if (spec.humanOnlyPackages[k]) rep.human.push({ file, line: lineOf(text, text.indexOf(`"${k}"`)), what: `${section}: ${k}`, why: spec.humanOnlyPackages[k] });
      }
    }
    return out;
  };
  for (const s of DEP_SECTIONS) if (j[s]) j[s] = renameIn(j[s], s);
  if (j.pnpm?.overrides) j.pnpm.overrides = renameIn(j.pnpm.overrides, 'pnpm.overrides');
  for (const [name, cmd] of Object.entries<string>(j.scripts ?? {})) {
    if (/(?:^|[\s;&|])stack\s|@stackframe\/init-stack/.test(String(cmd))) {
      rep.human.push({ file, line: lineOf(text, text.indexOf(`"${name}"`)), what: `script "${name}": ${cmd}`, why: 'The old `stack` CLI is no longer published; use `hexclave` from @hexclave/cli (guide L49). Upkeep never edits scripts.' });
    }
  }
  if (!changed) return text;
  const indent = /^([ \t]+)"/m.exec(text)?.[1] ?? '  ';
  return JSON.stringify(j, null, indent) + (text.endsWith('\n') ? '\n' : '');
}

// ---------- TypeScript and JavaScript ----------
function scriptKind(file: string): ts.ScriptKind {
  if (/\.tsx$/.test(file)) return ts.ScriptKind.TSX;
  if (/\.jsx$/.test(file)) return ts.ScriptKind.JSX;
  if (/\.[cm]?ts$/.test(file)) return ts.ScriptKind.TS;
  return ts.ScriptKind.JSX; // .js may hold JSX in Next apps
}

interface TextEdit { start: number; end: number; text: string }

export function transformCode(file: string, text: string, spec: Spec, opts: { identifiers: boolean; stringsOnly: boolean }, rep: ApplyReport): string {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind(file));
  const edits: TextEdit[] = [];
  const done = new Set<number>(); // string literals already rewritten
  const renames = new Map<string, string>(); // local binding -> new name
  const namespaces = new Set<string>();
  const idMap = spec.identifiers.map;
  const pkgRe = packageRegex(spec);
  const line = (pos: number) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const edit = (start: number, end: number, to: string, kind: string) => {
    edits.push({ start, end, text: to });
    rep.edits.push({ file, line: line(start), kind, from: text.slice(start, end), to });
  };

  // Rewrites a module specifier literal. Returns true when it pointed at an old package.
  const specifier = (lit: ts.StringLiteralLike): boolean => {
    const hit = splitSpecifier(spec, lit.text);
    if (!hit) return false;
    done.add(lit.getStart());
    if (spec.humanOnlyPackages[hit.pkg]) {
      rep.human.push({ file, line: line(lit.getStart()), what: `import of ${lit.text}`, why: spec.humanOnlyPackages[hit.pkg] });
      return false;
    }
    const to = spec.packages[hit.pkg].to + hit.sub;
    edit(lit.getStart() + 1, lit.getEnd() - 1, to, `import path (${spec.packages[hit.pkg].source})`);
    if (!KNOWN_SUBPATHS.has(hit.sub)) {
      rep.human.push({ file, line: line(lit.getStart()), what: `deep import ${lit.text}`, why: 'Imports a file inside the package, not its public entry. Rewritten to the same path in the new package; check the file still exists there.' });
    }
    return true;
  };

  const nameOf = (n: ts.ModuleExportName) => (ts.isIdentifier(n) ? n.text : n.text);

  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const old = specifier(node.moduleSpecifier);
      if (old && opts.identifiers && !opts.stringsOnly) {
        if (ts.isImportDeclaration(node)) {
          const nb = node.importClause?.namedBindings;
          if (nb && ts.isNamespaceImport(nb)) namespaces.add(nb.name.text);
          if (nb && ts.isNamedImports(nb)) {
            for (const el of nb.elements) {
              const imported = nameOf(el.propertyName ?? el.name);
              const to = idMap[imported];
              if (!to) continue;
              if (el.propertyName) edit(el.propertyName.getStart(), el.propertyName.getEnd(), to, `identifier (${spec.identifiers.source.split(' (')[0]})`);
              else { edit(el.name.getStart(), el.name.getEnd(), to, 'identifier (guide L26)'); renames.set(imported, to); }
            }
          }
        } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            const imported = nameOf(el.propertyName ?? el.name);
            const to = idMap[imported];
            if (!to) continue;
            // Keep this file's own exported name; only the name taken from the package changes.
            if (el.propertyName) edit(el.propertyName.getStart(), el.propertyName.getEnd(), to, 'identifier (guide L26)');
            else edit(el.name.getStart(), el.name.getEnd(), `${to} as ${imported}`, 'identifier (guide L26), exported name kept');
          }
        }
      }
    } else if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteralLike(node.arguments[0])) {
      const callee = node.expression;
      const isLoader = callee.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(callee) && callee.text === 'require')
        || (ts.isPropertyAccessExpression(callee) && /^(?:mock|doMock|unmock|requireActual|importActual|resolve)$/.test(callee.name.text));
      if (isLoader) specifier(node.arguments[0]);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      const old = specifier(node.argument.literal);
      if (old && opts.identifiers && !opts.stringsOnly && node.qualifier && ts.isIdentifier(node.qualifier) && idMap[node.qualifier.text]) {
        edit(node.qualifier.getStart(), node.qualifier.getEnd(), idMap[node.qualifier.text], 'identifier (guide L26)');
      }
    } else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !done.has(node.getStart())) {
      // Package names inside other strings: transpilePackages lists, tailwind content globs, mocks.
      const raw = text.slice(node.getStart(), node.getEnd());
      pkgRe.lastIndex = 0;
      if (pkgRe.test(raw)) {
        pkgRe.lastIndex = 0;
        const to = raw.replace(pkgRe, (m) => spec.packages[m].to);
        edit(node.getStart(), node.getEnd(), to, 'package name in a string');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (renames.size || namespaces.size) {
    const refs = (node: ts.Node) => {
      if (ts.isIdentifier(node) && renames.has(node.text)) {
        const p = node.parent;
        const to = renames.get(node.text)!;
        const skip = ts.isImportSpecifier(p)
          || (ts.isPropertyAccessExpression(p) && p.name === node)
          || (ts.isQualifiedName(p) && p.right === node)
          || ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isMethodSignature(p) || ts.isGetAccessor(p) || ts.isSetAccessor(p)) && p.name === node)
          || (ts.isJsxAttribute(p) && p.name === node)
          || (ts.isBindingElement(p) && p.propertyName === node)
          || (ts.isExportSpecifier(p) && p.propertyName !== undefined && p.name === node);
        if (!skip) {
          if (ts.isShorthandPropertyAssignment(p)) edit(node.getStart(), node.getEnd(), `${node.text}: ${to}`, 'identifier (guide L26), object key kept');
          else if (ts.isExportSpecifier(p) && !p.propertyName) edit(node.getStart(), node.getEnd(), `${to} as ${node.text}`, 'identifier (guide L26), exported name kept');
          else edit(node.getStart(), node.getEnd(), to, 'identifier (guide L26)');
        }
      }
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && namespaces.has(node.expression.text) && idMap[node.name.text]) {
        edit(node.name.getStart(), node.name.getEnd(), idMap[node.name.text], 'identifier (guide L26)');
      }
      if (ts.isQualifiedName(node) && ts.isIdentifier(node.left) && namespaces.has(node.left.text) && idMap[node.right.text]) {
        edit(node.right.getStart(), node.right.getEnd(), idMap[node.right.text], 'identifier (guide L26)');
      }
      ts.forEachChild(node, refs);
    };
    refs(sf);
  }

  edits.sort((a, b) => b.start - a.start);
  let out = text;
  let last = Infinity;
  for (const e of edits) {
    if (e.end > last) continue; // overlapping edit: keep the outer one already applied
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    last = e.start;
  }
  return replaceHosts(file, out, spec, rep);
}

// ---------- hosts (guide L40) ----------
export function replaceHosts(file: string, text: string, spec: Spec, rep: ApplyReport): string {
  let out = text;
  for (const [from, to] of Object.entries(spec.hosts.map)) {
    const re = new RegExp(escapeRegex(from), 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(out))) rep.edits.push({ file, line: lineOf(out, m.index), kind: `host (${spec.hosts.source})`, from, to });
    out = out.replace(re, to);
  }
  return out;
}

function transformText(file: string, text: string, spec: Spec, rep: ApplyReport): string {
  const re = packageRegex(spec);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) rep.edits.push({ file, line: lineOf(text, m.index), kind: 'package name in docs', from: m[1], to: spec.packages[m[1]].to });
  return replaceHosts(file, text.replace(re, (s) => spec.packages[s].to), spec, rep);
}

// ---------- the whole checkout ----------
export function applySpec(dir: string, spec: Spec, opts: ApplyOptions = {}): ApplyReport {
  const version = opts.version ?? spec.version;
  const identifiers = opts.identifiers ?? true;
  const write = opts.write ?? true;
  const rep: ApplyReport = { changedFiles: [], edits: [], human: [], envNames: [], headerRefs: 0 };
  const env = new Set<string>();
  const envRe = new RegExp(spec.optional.env.pattern, 'g');
  const hostRes = Object.keys(spec.hosts.map).map((h) => new RegExp(escapeRegex(h)));
  for (const file of listFiles(dir)) {
    const kind: FileKind = classify(file);
    if (kind === 'lockfile') continue;
    const path = join(dir, file);
    const text = readText(path);
    if (text === null) continue;
    if (kind !== 'other' || /\.env/.test(file)) for (const m of text.matchAll(envRe)) env.add(m[0]);
    rep.headerRefs += text.split(spec.optional.headers.from).length - 1;
    let out = text;
    if (kind === 'manifest') out = transformManifest(file, text, spec, version, rep);
    else if (kind === 'code') out = transformCode(file, text, spec, { identifiers, stringsOnly: false }, rep);
    else if (kind === 'config') out = /\.[cm]?[jt]s$/.test(file) ? transformCode(file, text, spec, { identifiers: false, stringsOnly: true }, rep) : transformText(file, text, spec, rep);
    else if (kind === 'text') out = transformText(file, text, spec, rep);
    else if (kind === 'never' || kind === 'other') {
      const n = text.split(spec.oldScope).length - 1;
      if (n && kind === 'never') rep.human.push({ file, line: lineOf(text, text.indexOf(spec.oldScope)), what: `${n} reference(s) to ${spec.oldScope}*`, why: 'Tests, tsconfig, lint and CI files are never edited by Upkeep, so a check cannot be made to pass by changing it.' });
    }
    if (kind === 'code' || kind === 'config') {
      if (/jwtVerify|issuer\s*:/.test(text) && /stack-auth|STACK_API_URL|stackframe/i.test(text)) {
        rep.human.push({ file, line: lineOf(out, out.search(/jwtVerify|issuer\s*:/)), what: 'JWT issuer check', why: 'If this verifies Hexclave-issued JWTs, the expected `iss` moves to the hexclave host (guide L54 to L70). A literal host was rewritten; a host built from a variable was not.' });
      }
      if (kind === 'code' && hostRes.some((r) => r.test(out))) {
        rep.human.push({ file, line: 1, what: 'old API host still present', why: 'guide L40' });
      }
    }
    if (out !== text) {
      rep.changedFiles.push(file);
      if (write) writeFileSync(path, out);
    }
  }
  rep.envNames = [...env].sort();
  return rep;
}

export function readJson(path: string): any { return JSON.parse(readFileSync(path, 'utf8')); }
