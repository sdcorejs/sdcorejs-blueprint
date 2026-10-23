import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = path.join(root, 'generated');
const replacements = new Set(['src/main.ts', 'src/app/app.routes.ts', 'src/modules/mdm/features/product/routes.ts']);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
// Delete only this script's fixed generated directory, never the authored sources.
assert.equal(path.dirname(generated), root);
fs.rmSync(generated, { recursive: true, force: true });
const examples = new Set();
for (const doc of walk(path.resolve(root, '../../angular-portal')).filter(file => file.endsWith('.md'))) {
  for (const match of fs.readFileSync(doc, 'utf8').matchAll(/<!-- example: ([^\r\n]+) -->\s*```(?:ts|scss)\r?\n([\s\S]*?)^```/gmu)) {
    const [, name, source] = match;
    assert.ok(name.startsWith('src/') && !name.split('/').includes('..'));
    assert.ok(!examples.has(name), 'Duplicate example: ' + name);
    examples.add(name);
    const destination = path.join(generated, name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, source);
  }
}
assert.equal(examples.size, 16, 'Review the extraction boundary when Blueprint examples change');
for (const file of walk(path.join(root, 'src'))) {
  const name = path.relative(root, file).replaceAll('\\', '/');
  if (name.includes('/e2e/')) continue;
  assert.ok(!examples.has(name) || replacements.has(name), 'Unreviewed Blueprint override: ' + name);
  const destination = path.join(generated, name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
console.log('Node ' + process.version + ': prepared 16 Markdown examples plus consumer UI/guard/resolver composition (3 explicit entry overrides).');
