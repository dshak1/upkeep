// Check C: what the type checker cannot see. The new package still exports every old `Stack*` name,
// so a package swap alone typechecks. This check fails when old names, old packages or the old host remain
// in files Upkeep is allowed to edit, or when a file it must never edit was touched.
import ts from 'typescript';
import { join } from 'node:path';
import { classify, listFiles, readText } from './files.ts';
import { escapeRegex, splitSpecifier, type Spec } from './spec.ts';

export interface Finding { file: string; line: number; what: string }
export interface CheckC {
  pass: boolean;
  oldSpecifiers: Finding[];   // imports or manifest entries still on an old package
  oldNames: Finding[];        // old `Stack*` names imported from a new package
  oldHost: Finding[];         // old API host in code
  neverTouched: string[];     // files in the never-edit list that changed
  humanOnly: Finding[];       // old packages with no new equivalent (reported, not failed)
}

export function checkC(dir: string, spec: Spec, changedFiles: string[] = []): CheckC {
  const r: CheckC = { pass: true, oldSpecifiers: [], oldNames: [], oldHost: [], neverTouched: [], humanOnly: [] };
  const newScopes = Object.values(spec.packages).map((p) => p.to);
  const oldNames = new Set(Object.keys(spec.identifiers.map));
  const hostRe = new RegExp(Object.keys(spec.hosts.map).map(escapeRegex).join('|'));
  for (const file of listFiles(dir)) {
    const kind = classify(file);
    if (kind === 'lockfile' || kind === 'never' || kind === 'other') continue;
    const text = readText(join(dir, file));
    if (text === null) continue;
    if (kind === 'manifest') {
      try {
        const j = JSON.parse(text);
        for (const s of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
          for (const k of Object.keys(j[s] ?? {})) {
            if (spec.packages[k]) r.oldSpecifiers.push({ file, line: 0, what: `${s}: ${k}` });
            else if (spec.humanOnlyPackages[k]) r.humanOnly.push({ file, line: 0, what: `${s}: ${k}` });
          }
        }
      } catch { /* not JSON: ignore */ }
      continue;
    }
    if (kind !== 'code' && kind !== 'config') continue;
    if (!text.includes(spec.oldScope) && !/Stack|stack/.test(text) && !hostRe.test(text)) continue;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, /\.tsx$/.test(file) ? ts.ScriptKind.TSX : /\.[cm]?ts$/.test(file) ? ts.ScriptKind.TS : ts.ScriptKind.JSX);
    const line = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
    const visit = (node: ts.Node) => {
      let lit: ts.StringLiteralLike | undefined;
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) lit = node.moduleSpecifier;
      else if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteralLike(node.arguments[0])
        && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) lit = node.arguments[0];
      if (lit) {
        const hit = splitSpecifier(spec, lit.text);
        if (hit && spec.humanOnlyPackages[hit.pkg]) r.humanOnly.push({ file, line: line(lit), what: lit.text });
        else if (hit) r.oldSpecifiers.push({ file, line: line(lit), what: lit.text });
        if (ts.isImportDeclaration(node) && newScopes.some((p) => lit!.text === p || lit!.text.startsWith(p + '/'))) {
          const nb = node.importClause?.namedBindings;
          if (nb && ts.isNamedImports(nb)) {
            for (const el of nb.elements) {
              const imported = (el.propertyName ?? el.name).text;
              if (oldNames.has(imported)) r.oldNames.push({ file, line: line(el), what: `${imported} from ${lit.text}` });
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    if (kind === 'code') {
      text.split('\n').forEach((l, i) => { if (hostRe.test(l)) r.oldHost.push({ file, line: i + 1, what: l.trim().slice(0, 120) }); });
    }
  }
  r.neverTouched = changedFiles.filter((f) => classify(f) === 'never');
  r.pass = !r.oldSpecifiers.length && !r.oldNames.length && !r.oldHost.length && !r.neverTouched.length;
  return r;
}
