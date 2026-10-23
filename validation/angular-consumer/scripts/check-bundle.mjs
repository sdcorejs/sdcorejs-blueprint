import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stats = JSON.parse(fs.readFileSync(path.join(root, 'dist/consumer/stats.json'), 'utf8'));
const outputs = stats.outputs;
const main = Object.keys(outputs).find(name => /(?:^|\/)main-[^/]+\.js$/.test(name));
assert.ok(main, 'Missing production main bundle');
const visited = new Set();
function visit(name) {
  if (visited.has(name)) return;
  visited.add(name);
  const output = outputs[name];
  assert.ok(output, 'Unknown bundle: ' + name);
  for (const input of Object.keys(output.inputs ?? {})) {
    assert.ok(!input.includes('generated/src/modules/'), 'Module eagerly bundled: ' + input);
  }
  for (const item of output.imports ?? []) {
    if (item.kind === 'dynamic-import' || item.external) continue;
    visit(outputs[item.path] ? item.path : path.posix.join(path.posix.dirname(name), item.path));
  }
}
visit(main);
for (const input of Object.keys(stats.inputs)) {
  assert.ok(!/(?:\/testing\/|\/e2e\/|\.spec\.ts$|@angular\/compiler\/)/.test(input), 'Test/JIT dependency in production: ' + input);
}
for (const page of ['list', 'detail', 'create', 'update']) {
  assert.ok(Object.values(outputs).some(output => output.entryPoint?.endsWith('/' + page + '.component.ts')), 'Page missing a lazy entry: ' + page);
}
console.log('PASS: module excluded from initial static graph; four lazy pages; no test support or Angular JIT compiler in AOT bundle.');
