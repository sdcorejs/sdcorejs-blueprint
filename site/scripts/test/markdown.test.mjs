import assert from 'node:assert/strict';
import test from 'node:test';
import { renderInline } from '../lib/inline.mjs';
import { normaliseProse, parseMarkdown, sectionListItems, sectionText } from '../lib/markdown.mjs';

const sample = [
  '# Tiêu đề',
  '',
  '## List — bố cục chuẩn',
  '',
  'Không đặt `overflow-hidden` cho list đơn giản.',
  '',
  '### Relation dùng pipe `<entity>Detail`',
  '',
  '<!-- example: src/a.ts -->',
  '```ts',
  'export const a = 1;',
  '```',
  '',
  '```html',
  '<p>## không phải heading</p>',
  '```',
  '',
  '## Nghiệm thu',
  '',
  '- [ ] Mục một',
  '  tiếp dòng.',
  '- Mục hai',
  '',
  '## List — bố cục chuẩn',
].join('\n');

test('heading dùng slug kiểu GitHub, kể cả dấu tiếng Việt, em dash và trùng tên', () => {
  const doc = parseMarkdown(sample, 'sample.md');
  assert.deepEqual(doc.headings.map(heading => heading.slug), [
    'tiêu-đề',
    'list--bố-cục-chuẩn',
    'relation-dùng-pipe-entitydetail',
    'nghiệm-thu',
    'list--bố-cục-chuẩn-1',
  ]);
});

test('code block nhận marker example, heading sở hữu và index trong mục', () => {
  const doc = parseMarkdown(sample, 'sample.md');
  assert.equal(doc.blocks.length, 2);
  assert.deepEqual(doc.blocks[0].marker, { kind: 'example', path: 'src/a.ts', line: 9 });
  assert.equal(doc.blocks[0].code, 'export const a = 1;');
  assert.equal(doc.blocks[1].marker, null);
  assert.equal(doc.blocks[1].heading, 'relation-dùng-pipe-entitydetail');
  assert.equal(doc.blocks[1].index, 1);
});

test('đọc checklist và text của mục', () => {
  const doc = parseMarkdown(sample, 'sample.md');
  assert.deepEqual(sectionListItems(doc, 'nghiệm-thu'), ['Mục một tiếp dòng.', 'Mục hai']);
  assert.match(sectionText(doc, 'list--bố-cục-chuẩn'), /overflow-hidden/u);
  assert.match(sectionText(doc, 'list--bố-cục-chuẩn'), /Relation dùng pipe/u, 'mục gồm cả heading con');
  assert.equal(sectionText(doc, 'không-có'), null);
});

test('fence không đóng bị báo lỗi', () => {
  assert.throws(() => parseMarkdown('```ts\nconst a = 1;', 'broken.md'), /không được đóng/u);
});

test('so khớp quote bỏ qua backtick, hoa thường và khoảng trắng', () => {
  assert.equal(normaliseProse('Không  dùng `any`'), normaliseProse('không dùng any'));
});

test('inline Markdown luôn escape HTML', () => {
  assert.equal(renderInline('<b>x</b> `a<b>` **đậm** [link](x.md)', href => `/#${href}`),
    '&lt;b&gt;x&lt;/b&gt; <code>a&lt;b&gt;</code> <strong>đậm</strong> <a href="/#x.md">link</a>');
});
