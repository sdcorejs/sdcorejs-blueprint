// npm run check:sync — kiểm 10 quy tắc "Đồng bộ Markdown ↔ UI" trong AGENTS.md.
// npm run sync:accept — sau khi đã rà trang site theo Markdown mới, ghi lại dấu (locks) vào page-map.json.
import fs from 'node:fs';
import path from 'node:path';
import { normaliseProse, sectionListItems } from './lib/markdown.mjs';
import {
  CALLOUT_KINDS, CHECKLIST_HEADINGS, HERO_TYPES, LAYOUTS, LINT_STATUS,
  anchorText, contentDir, exampleIndex, loadDocs, loadSite, pageDependencies, pageMapFile,
  resolveAnchor, resolveFile, siteDir, splitRef,
} from './lib/model.mjs';

const accept = process.argv.includes('--accept');
const skipLocks = process.argv.includes('--no-locks');
const onlyPage = process.argv.find(arg => arg.startsWith('--page='))?.slice('--page='.length) ?? null;
const docs = loadDocs();
const examples = exampleIndex(docs);
const { pageMap, contents, home } = loadSite();
const errors = [];
const label = id => {
  const page = pageMap.pages[id];
  return page ? `${page.no} ${id} (#/${id})` : id;
};
const fail = (id, where, message) => errors.push({ id, where, message });

const word = list => new RegExp(`(?<!\\p{L})(${list.join('|')})(?!\\p{L})`, 'iu');
const MUST_WORDS = word(['must', 'phải', 'bắt buộc']);
const SHOULD_WORDS = word(['should', 'nên', 'ưu tiên', 'mặc định']);
const FORBID_WORDS = word(['không', 'tránh', 'cấm', 'chặn']);
const VERSION_LITERAL = /\b(angular|typescript|core|@sdcorejs\/angular)\s*v?\d+\.\d+/iu;

function checkRef(id, where, ref) {
  if (!ref) return fail(id, where, 'thiếu `ref` tới file#heading trong Markdown (quy tắc 3)');
  const resolved = resolveAnchor(docs, ref);
  if (resolved.error) fail(id, where, `${ref}: ${resolved.error} (quy tắc 4)`);
}

/** Quote must appear in the referenced Markdown section (quy tắc 3, 6). */
function checkQuote(id, where, ref, quote, words, kindLabel) {
  if (!quote) return fail(id, where, `${kindLabel} cần \`quote\` trích nguyên văn từ Markdown (quy tắc 3, 6)`);
  const text = anchorText(docs, ref);
  if (text === null) return;
  if (!normaliseProse(text).includes(normaliseProse(quote))) {
    fail(id, where, `quote không có trong ${ref}: “${quote}” (quy tắc 3, 6)`);
  } else if (words && !words.test(quote)) {
    fail(id, where, `quote cho ${kindLabel} phải là câu ${kindLabel === 'MUST' ? 'MUST/phải/bắt buộc' : kindLabel === 'SHOULD' ? 'SHOULD/nên' : 'cấm (không/tránh)'}: “${quote}”`);
  }
}

function walkStrings(value, visit, trail = '') {
  if (typeof value === 'string') visit(value, trail);
  else if (Array.isArray(value)) value.forEach((item, index) => walkStrings(item, visit, `${trail}[${index}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) walkStrings(item, visit, trail ? `${trail}.${key}` : key);
}

// ---- Bản đồ trang và nhóm --------------------------------------------------------------------
const groupedIds = pageMap.groups.flatMap(group => group.pages);
for (const id of Object.keys(pageMap.pages)) {
  if (!groupedIds.includes(id)) fail(id, 'page-map.groups', 'trang không thuộc nhóm nào');
}
for (const id of groupedIds) {
  if (!pageMap.pages[id]) fail(id, 'page-map.groups', 'nhóm trỏ tới trang không có trong page-map.pages');
}
for (const file of fs.readdirSync(path.join(contentDir, 'pages'))) {
  const id = file.replace(/\.json$/u, '');
  if (!pageMap.pages[id]) fail(id, `site/content/pages/${file}`, 'nội dung không có trong page-map.pages');
}

// Quy tắc 4: mọi file Markdown đều có trang hoặc khai báo hidden kèm lý do.
const mappedFiles = new Set();
for (const page of Object.values(pageMap.pages)) for (const ref of page.sources ?? []) mappedFiles.add(splitRef(ref).file);
for (const hidden of pageMap.hidden ?? []) {
  if (!hidden.reason) fail('page-map', `hidden ${hidden.file}`, 'thiếu lý do');
  if (!docs.has(hidden.file)) fail('page-map', `hidden ${hidden.file}`, 'file không tồn tại');
  mappedFiles.add(hidden.file);
}
for (const file of docs.keys()) {
  if (!mappedFiles.has(file)) fail('page-map', file, 'file Markdown chưa có trang trong page-map.json và không khai báo hidden (quy tắc 4)');
}

// Quy tắc 5: excerpt phải là đoạn liên tục của block example cùng path.
for (const doc of docs.values()) {
  for (const block of doc.blocks.filter(item => item.marker?.kind === 'excerpt')) {
    const canonical = examples.get(block.marker.path)?.[0];
    if (!canonical) fail('markdown', `${doc.file}:${block.line}`, `excerpt ${block.marker.path} không có block example gốc`);
    else if (!canonical.block.code.includes(block.code.trim())) {
      fail('markdown', `${doc.file}:${block.line}`, `excerpt ${block.marker.path} không còn khớp block example ở ${canonical.doc.file}:${canonical.block.line}`);
    }
  }
}

const eslintDoc = docs.get('angular-portal/conventions/eslint.md');
const images = pageMap.images ?? {};

for (const [id, page] of Object.entries(pageMap.pages)) {
  const content = contents.get(id);
  if (!content) { fail(id, `site/content/pages/${id}.json`, 'thiếu file nội dung'); continue; }
  if (!LAYOUTS.includes(page.layout)) fail(id, 'layout', `layout phải là ${LAYOUTS.join('/')}`);
  if (!page.sources?.length) fail(id, 'sources', 'trang phải có ít nhất một nguồn Markdown (quy tắc 4)');
  for (const ref of page.sources ?? []) checkRef(id, 'sources', ref);

  // Quy tắc 5: code lấy từ Markdown; file minh họa phải khai báo illustrative.
  const files = {};
  for (const [key, entry] of Object.entries(page.files ?? {})) {
    const resolved = resolveFile(docs, examples, entry);
    if (resolved.error) { fail(id, `files.${key}`, resolved.error + ' (quy tắc 5)'); continue; }
    files[key] = resolved;
    const listed = (page.illustrative ?? []).includes(key);
    if (resolved.kind === 'illustrative' && !listed) fail(id, `files.${key}`, 'file minh họa phải nằm trong danh sách illustrative (quy tắc 5)');
    if (resolved.kind !== 'illustrative' && listed) fail(id, `files.${key}`, 'file lấy từ Markdown không được khai báo illustrative');
    if (resolved.kind === 'role') checkRef(id, `files.${key}.ref`, entry.ref);
  }
  for (const key of page.illustrative ?? []) if (!page.files?.[key]) fail(id, 'illustrative', `${key} không có trong files`);

  // Quy tắc 7: checklist lấy từ Nghiệm thu / Kiểm tra trước bàn giao.
  if (page.checklist) {
    const resolved = resolveAnchor(docs, page.checklist);
    if (resolved.error) fail(id, 'checklist', `${page.checklist}: ${resolved.error}`);
    else if (!resolved.heading || !CHECKLIST_HEADINGS.includes(resolved.heading.text)) {
      fail(id, 'checklist', `${page.checklist} phải là mục “${CHECKLIST_HEADINGS.join('” hoặc “')}” (quy tắc 7)`);
    } else if (!sectionListItems(resolved.doc, resolved.heading.slug).length) {
      fail(id, 'checklist', `${page.checklist} không có mục nào (quy tắc 7)`);
    }
  }
  if (content.checklist) fail(id, 'content.checklist', 'checklist không được viết tay trong nội dung trang; khai báo page-map.checklist (quy tắc 7)');

  // Quy tắc 9: ảnh có nguồn và ngày chụp.
  const usedImages = new Set();
  if (content.hero?.img) usedImages.add(content.hero.img);
  if (content.demo?.img) usedImages.add(content.demo.img);
  for (const step of content.steps ?? []) if (step.img) usedImages.add(step.img);
  for (const src of usedImages) {
    const meta = images[src];
    if (!meta) { fail(id, src, 'ảnh chưa khai báo trong page-map.images (quy tắc 9)'); continue; }
    if (!meta.source || !/^\d{4}-\d{2}-\d{2}$/u.test(meta.capturedAt ?? '')) fail(id, src, 'ảnh phải có source và capturedAt YYYY-MM-DD (quy tắc 9)');
    if (!fs.existsSync(path.join(siteDir, src))) fail(id, src, 'không có file ảnh');
  }

  // Nội dung trang.
  if (!Array.isArray(content.tldr) || content.tldr.length !== 3) fail(id, 'tldr', 'cần đúng 3 ý nhớ');
  if (content.hero && !HERO_TYPES.includes(content.hero.type)) fail(id, 'hero.type', `phải là ${HERO_TYPES.join('/')}`);
  if (!content.steps?.length) fail(id, 'steps', 'trang cần ít nhất một bước');
  (content.steps ?? []).forEach((step, index) => {
    const where = `bước ${index + 1} “${step.title}”`;
    checkRef(id, where, step.ref);
    if (step.must) checkQuote(id, `${where} · MUST`, step.ref, step.must.quote, MUST_WORDS, 'MUST');
    if (step.should) checkQuote(id, `${where} · SHOULD`, step.ref, step.should.quote, SHOULD_WORDS, 'SHOULD');
    if (step.file) {
      const file = files[step.file];
      if (!page.files?.[step.file]) fail(id, where, `file ${step.file} không có trong page-map.files`);
      else if (file?.code) {
        const count = file.code.split('\n').length;
        for (const line of [...(step.lines ?? []), ...(step.range ?? [])]) {
          if (!Number.isInteger(line) || line < 1 || line > count) fail(id, where, `dòng ${line} nằm ngoài ${step.file} (${count} dòng) — code Markdown đã đổi?`);
        }
      }
    } else if (page.layout === 'explorer') fail(id, where, 'bước của layout Explorer phải mở một file');
    for (const focus of step.focus ?? []) {
      if (!content.hero?.items?.[focus]) fail(id, where, `focus ${focus} không có trong hero.items`);
    }
    (step.callouts ?? []).forEach((callout, position) => {
      const at = `${where} · callout ${position + 1}`;
      if (!CALLOUT_KINDS.includes(callout.kind)) fail(id, at, `kind phải là ${CALLOUT_KINDS.join('/')}`);
      const ref = callout.ref ?? step.ref;
      checkRef(id, at, ref);
      if (callout.kind === 'warn') checkQuote(id, `${at} · Tránh`, ref, callout.quote, FORBID_WORDS, 'Tránh');
    });
  });
  for (const key of ['do', 'dont']) {
    const item = content[key];
    if (!item) { fail(id, key, 'thiếu Đúng/Sai'); continue; }
    checkRef(id, key, item.ref);
    if (key === 'dont') checkQuote(id, 'Sai', item.ref, item.quote, FORBID_WORDS, 'Tránh');
  }

  // Quy tắc 8: rule ESLint hiển thị phải có trong eslint.md.
  const rules = [...(content.lint ?? []).filter(item => item.status !== 'external').map(item => item.rule), content.dont?.rule].filter(Boolean);
  for (const item of content.lint ?? []) {
    if (!LINT_STATUS.includes(item.status)) fail(id, `lint ${item.rule}`, `status phải là ${LINT_STATUS.join('/')}`);
    if (item.status !== 'external' && !item.rule) fail(id, 'lint', 'mục lint cần tên rule');
  }
  for (const rule of rules) {
    if (!eslintDoc?.text.includes(rule)) fail(id, `lint ${rule}`, 'rule không có trong angular-portal/conventions/eslint.md (quy tắc 8)');
  }

  // Quy tắc 10: phiên bản lấy từ validation/, không viết cứng.
  walkStrings(content, (text, trail) => {
    if (VERSION_LITERAL.test(text)) fail(id, trail, `phiên bản viết cứng “${text.match(VERSION_LITERAL)[0]}”; dùng {angular}/{typescript}/{core} (quy tắc 10)`);
  });

  // Quy tắc 1: Markdown đổi thì trang phải được rà lại trong cùng PR.
  const { locks: current, origins } = pageDependencies(docs, examples, id, page, content);
  if (skipLocks) {
    // Chỉ dùng khi đang soạn trang; CI luôn kiểm dấu.
  } else if (!accept) {
    const stored = page.locks ?? {};
    for (const [key, value] of Object.entries(current)) {
      if (!stored[key]) fail(id, origins[key], 'nguồn mới chưa được ghi dấu; rà trang rồi chạy npm run sync:accept (quy tắc 1)');
      else if (stored[key] !== value) {
        fail(id, origins[key], `${key.startsWith('section:') ? 'nội dung Markdown' : 'code mẫu'} đã đổi so với lần đồng bộ trước; cập nhật trang rồi chạy npm run sync:accept (quy tắc 1)`);
      }
    }
    for (const key of Object.keys(stored)) if (!(key in current)) fail(id, key, 'dấu thừa; chạy npm run sync:accept');
  } else {
    page.locks = current;
  }
}

walkStrings(home, (text, trail) => {
  if (VERSION_LITERAL.test(text)) fail('home', trail, 'phiên bản viết cứng; dùng {angular}/{typescript}/{core} (quy tắc 10)');
});
for (const card of home.jobs ?? []) for (const id of card.pages) if (!pageMap.pages[id]) fail('home', card.title, `trang ${id} không tồn tại`);

if (accept) {
  const lockErrors = errors.filter(error => !/quy tắc 1\)$/u.test(error.message));
  if (lockErrors.length) {
    report(lockErrors);
    console.error('\nChưa ghi dấu: sửa các lỗi trên trước.');
    process.exit(1);
  }
  fs.writeFileSync(pageMapFile, JSON.stringify(pageMap, null, 2) + '\n');
  console.log(`Đã ghi dấu đồng bộ cho ${Object.keys(pageMap.pages).length} trang vào site/page-map.json.`);
  process.exit(0);
}

function report(list) {
  const byPage = new Map();
  for (const error of list) {
    if (!byPage.has(error.id)) byPage.set(error.id, []);
    byPage.get(error.id).push(error);
  }
  for (const [id, items] of byPage) {
    console.error(`\n✗ ${label(id)}`);
    for (const item of items) console.error(`  - ${item.where}: ${item.message}`);
  }
}

if (onlyPage) errors.splice(0, errors.length, ...errors.filter(error => error.id === onlyPage));
if (errors.length) {
  report(errors);
  console.error(`\ncheck:sync FAIL — ${errors.length} lỗi. Markdown là nguồn quy tắc: sửa site theo Markdown (AGENTS.md).`);
  process.exit(1);
}
const pageCount = Object.keys(pageMap.pages).length;
console.log(`check:sync PASS — ${pageCount} trang, ${docs.size} file Markdown, ${examples.size} block example.`);
