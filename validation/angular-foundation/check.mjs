import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as sass from 'sass';
import { verifyRuntime } from './runtime-check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const generated = path.join(here, 'generated');
const dist = path.join(here, 'dist');
const angularDocs = path.join(root, 'angular-portal');
const documents = [
  path.join(root, 'README.md'),
  ...walk(angularDocs).filter(name => name.endsWith('.md')),
  path.join(here, 'README.md'),
  path.resolve(here, '../angular-consumer/README.md'),
];
const examples = new Map();
let localLinks = 0;

for (const file of documents) {
  const text = fs.readFileSync(file, 'utf8');
  assert.equal((text.match(/^```/gmu) ?? []).length % 2, 0, 'Unbalanced fences: ' + file);
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/u.test(target)) continue;
    const targetPath = path.resolve(path.dirname(file), target.split('#')[0]);
    assert.ok(fs.existsSync(targetPath), 'Broken link: ' + file + ' -> ' + target);
    localLinks++;
  }
  for (const match of text.matchAll(/<!-- example: ([^\r\n]+) -->\s*```(ts|scss)\r?\n([\s\S]*?)^```/gmu)) {
    const [, name, language, content] = match;
    assert.ok(name.startsWith('src/'), 'Example must be under src: ' + name);
    assert.ok(!name.split('/').includes('..'), 'Example escapes source: ' + name);
    assert.ok(!examples.has(name), 'Duplicate example: ' + name);
    examples.set(name, { content, language });
  }
}
assert.ok(examples.size > 0, 'No code samples found');

for (const directory of [generated, dist]) fs.rmSync(directory, { recursive: true, force: true });
fs.mkdirSync(generated, { recursive: true });

function write(relative, content) {
  const file = path.join(generated, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
for (const [name, example] of examples) write(name, example.content);

// Verification-only route targets. Real Core UI implementations belong to UI patterns.
const fixtureClasses = [
  ['src/app/app.component.ts', 'AppComponent'],
  ...['list', 'detail', 'create', 'update'].map(name => [
    'src/modules/mdm/features/product/pages/' + name + '/' + name + '.component.ts',
    name[0].toUpperCase() + name.slice(1) + 'Component',
  ]),
];
for (const [name, className] of fixtureClasses) {
  assert.ok(!examples.has(name), 'A real UI implementation must update the verification boundary');
  write(name, [
    "import { Component } from '@angular/core';",
    "@Component({ selector: 'bp-verification-only', standalone: true, template: '' })",
    'export class ' + className + ' {}',
  ].join('\n'));
}
const rootNames = [...examples.keys()].filter(name => name.endsWith('.ts'))
  .concat(fixtureClasses.map(([name]) => name)).map(name => path.join(generated, name));
const program = ts.createProgram(rootNames, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ES2022,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  strict: true,
  experimentalDecorators: true,
  useDefineForClassFields: true,
  verbatimModuleSyntax: true,
  skipLibCheck: true,
  noEmitOnError: true,
  rootDir: generated,
  outDir: dist,
});
const emit = program.emit();
const diagnostics = [...ts.getPreEmitDiagnostics(program), ...emit.diagnostics];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: name => name,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  }));
  process.exit(1);
}
assert.equal(emit.emitSkipped, false);

// Angular normally bundles extensionless imports. Adapt emitted verification JS for Node ESM.
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
for (const file of walk(dist).filter(name => name.endsWith('.js'))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  function specifier(node) {
    if (!ts.isStringLiteral(node) || !node.text.startsWith('.')) return node;
    const target = path.resolve(path.dirname(file), node.text);
    if (fs.existsSync(target + '.js')) return ts.factory.createStringLiteral(node.text + '.js');
    if (fs.existsSync(path.join(target, 'index.js'))) return ts.factory.createStringLiteral(node.text + '/index.js');
    throw new Error('Unresolved emitted import: ' + node.text + ' from ' + file);
  }
  const result = ts.transform(source, [context => {
    function visit(node) {
      if (ts.isImportDeclaration(node)) return ts.factory.updateImportDeclaration(
        node, node.modifiers, node.importClause, specifier(node.moduleSpecifier), node.attributes);
      if (ts.isExportDeclaration(node) && node.moduleSpecifier) return ts.factory.updateExportDeclaration(
        node, node.modifiers, node.isTypeOnly, node.exportClause, specifier(node.moduleSpecifier), node.attributes);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, node.arguments.map(specifier));
      }
      return ts.visitEachChild(node, visit, context);
    }
    return node => ts.visitNode(node, visit);
  }]);
  fs.writeFileSync(file, ts.createPrinter().printFile(result.transformed[0]));
  result.dispose();
}
const compiledStyles = sass.compileString(
  "@use 'src/modules/mdm/assets/styles' as mdm;\n.fixture { @include mdm.content-stack; }",
  { loadPaths: [generated] },
);
assert.match(compiledStyles.css, /gap: 12px/u);
const runtime = await verifyRuntime(dist);
console.log(JSON.stringify({
  markdownDocuments: documents.length,
  localLinks,
  typescriptExamples: [...examples.values()].filter(item => item.language === 'ts').length,
  scssExamples: [...examples.values()].filter(item => item.language === 'scss').length,
  verificationOnlyComponents: fixtureClasses.length,
  typecheck: 'PASS',
  sass: 'PASS',
  ...runtime,
  coreUiRendering: 'NOT RUN in foundation - run validation/angular-consumer separately',
}, null, 2));
