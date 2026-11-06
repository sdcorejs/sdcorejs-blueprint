// Chạy check:sync trên bản sao repo, sửa thử Markdown và kiểm thông báo chỉ đúng file và trang.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoDir = path.resolve(siteDir, '..');
const script = path.join(siteDir, 'scripts', 'check-sync.mjs');

function copyRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-sync-'));
  fs.cpSync(path.join(repoDir, 'angular-portal'), path.join(root, 'angular-portal'), { recursive: true });
  for (const name of ['angular-foundation', 'angular-consumer']) {
    fs.mkdirSync(path.join(root, 'validation', name), { recursive: true });
    fs.copyFileSync(path.join(repoDir, 'validation', name, 'package.json'), path.join(root, 'validation', name, 'package.json'));
  }
  for (const name of ['page-map.json', 'content', 'assets']) {
    fs.cpSync(path.join(siteDir, name), path.join(root, 'site', name), { recursive: true });
  }
  return root;
}

function run(root) {
  const result = spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, BP_REPO_DIR: root, BP_SITE_DIR: path.join(root, 'site') },
  });
  return { status: result.status, output: result.stdout + result.stderr };
}

function edit(root, file, from, to) {
  const target = path.join(root, file);
  const text = fs.readFileSync(target, 'utf8');
  assert.ok(text.includes(from), `fixture: ${file} không còn chứa “${from}”`);
  fs.writeFileSync(target, text.replace(from, to));
}

test('repo hiện tại PASS', () => {
  const root = copyRepo();
  const { status, output } = run(root);
  assert.equal(status, 0, output);
  assert.match(output, /check:sync PASS/u);
});

test('đổi tên heading → FAIL, chỉ đúng anchor và trang', () => {
  const root = copyRepo();
  edit(root, 'angular-portal/project-structure/routes.md', '## Contract vào route có ID', '## Contract route có ID');
  const { status, output } = run(root);
  assert.equal(status, 1);
  assert.match(output, /BP-05 bp-routes/u);
  assert.match(output, /angular-portal\/project-structure\/routes\.md#contract-vào-route-có-id/u);
  assert.match(output, /không có heading/u);
});

test('sửa một dòng trong block example → FAIL, chỉ file Markdown, dòng và trang', () => {
  const root = copyRepo();
  edit(root, 'angular-portal/project-structure/routes.md', "title: 'Tạo sản phẩm',", "title: 'Tạo mới sản phẩm',");
  const { status, output } = run(root);
  assert.equal(status, 1);
  assert.match(output, /BP-05 bp-routes/u);
  assert.match(output, /angular-portal\/project-structure\/routes\.md:\d+ \(src\/modules\/mdm\/features\/product\/routes\.ts\): code mẫu đã đổi/u);
});

test('sửa quy tắc trong mục nguồn → FAIL cho trang dùng mục đó', () => {
  const root = copyRepo();
  edit(root, 'angular-portal/project-structure/routes.md', 'Không hardcode các URL lỗi', 'Tránh hardcode các URL lỗi');
  const { status, output } = run(root);
  assert.equal(status, 1);
  assert.match(output, /routes\.md#lỗi-trước-activation: nội dung Markdown đã đổi/u);
});

test('file Markdown mới chưa map → FAIL', () => {
  const root = copyRepo();
  fs.writeFileSync(path.join(root, 'angular-portal/conventions/new-topic.md'), '# Chủ đề mới\n');
  const { status, output } = run(root);
  assert.equal(status, 1);
  assert.match(output, /angular-portal\/conventions\/new-topic\.md: file Markdown chưa có trang/u);
});

test('rule ESLint không có trong eslint.md → FAIL', () => {
  const root = copyRepo();
  edit(root, 'site/content/pages/bp-routes.json', '"rule": "no-restricted-imports"', '"rule": "no-made-up-rule"');
  const { status, output } = run(root);
  assert.equal(status, 1);
  assert.match(output, /lint no-made-up-rule: rule không có trong angular-portal\/conventions\/eslint\.md/u);
});

test('callout Tránh không có câu cấm trong Markdown → FAIL', () => {
  const root = copyRepo();
  edit(root, 'site/content/pages/bp-routes.json', '"quote": "Không hardcode các URL lỗi của một Portal vào module tái sử dụng."', '"quote": "Câu không có trong Markdown."');
  const { status, output } = run(root);
  assert.equal(status, 1);
  assert.match(output, /quote không có trong angular-portal\/project-structure\/routes\.md#lỗi-trước-activation/u);
});

test('phiên bản viết cứng trong nội dung → FAIL', () => {
  const root = copyRepo();
  edit(root, 'site/content/pages/bp-routes.json', 'Với Core {core},', 'Với Core 22.3.1,');
  const { status, output } = run(root);
  assert.equal(status, 1);
  assert.match(output, /phiên bản viết cứng/u);
});
