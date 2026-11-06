// npm run build — xuất site tĩnh vào site/dist/. Code lấy từ block Markdown lúc build, tô màu bằng Shiki.
import fs from 'node:fs';
import path from 'node:path';
import { createHighlighter } from 'shiki';
import { escapeHtml, renderInline } from './lib/inline.mjs';
import { sectionListItems } from './lib/markdown.mjs';
import {
  exampleIndex, loadDocs, loadSite, repoDir, resolveAnchor, resolveFile, siteDir, splitRef, versions,
} from './lib/model.mjs';

const dist = path.join(siteDir, 'dist');
const docs = loadDocs();
const examples = exampleIndex(docs);
const { pageMap, contents, home } = loadSite();
const baseline = versions();
const githubBlob = `https://github.com/${pageMap.repo}/blob/${pageMap.branch}/`;
const LANG_LABEL = { ts: 'TypeScript', html: 'HTML', scss: 'SCSS', json: 'JSON', js: 'JavaScript', text: 'Plain Text' };

// ---- Liên kết: anchor Markdown → trang site nếu có, ngược lại → GitHub --------------------------------
const anchorToPage = new Map();
for (const [id, page] of Object.entries(pageMap.pages)) {
  for (const ref of page.sources ?? []) if (!anchorToPage.has(ref)) anchorToPage.set(ref, id);
}
function githubUrl(ref) {
  const { file, slug } = splitRef(ref);
  return githubBlob + file + (slug ? '#' + slug : '');
}
function linkResolver(fromFile) {
  return href => {
    if (/^(https?:|mailto:)/u.test(href)) return href;
    if (href.startsWith('#')) return githubUrl(fromFile + href);
    const [target, slug] = href.split('#');
    const file = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), target));
    const ref = file + (slug ? '#' + slug : '');
    const page = anchorToPage.get(ref) ?? anchorToPage.get(file);
    return page ? `#/${page}` : githubUrl(ref);
  };
}
const fillVersions = text => String(text ?? '').replace(/\{(angular|typescript|core)\}/gu, (_, key) => baseline[key]);
const inline = (text, fromFile = 'angular-portal/README.md') => renderInline(fillVersions(text), linkResolver(fromFile));

function sourceInfo(ref) {
  const resolved = resolveAnchor(docs, ref);
  const { file } = splitRef(ref);
  return {
    file,
    heading: resolved.heading?.text ?? null,
    href: githubUrl(ref),
  };
}

// ---- Shiki ------------------------------------------------------------------------------------
const highlighter = await createHighlighter({
  themes: ['dark-plus', 'light-plus'],
  langs: ['ts', 'html', 'scss', 'json', 'js'],
});
// Bảo đảm contrast ≥ 4.5:1 của màu token trên nền editor và nền dòng highlight (khớp --c-bg/--c-hl trong styles.css).
// Màu dark-plus/light-plus giữ nguyên khi đã đạt; màu chưa đạt được làm đậm (Light+) hoặc sáng (Dark+) từng bước nhỏ.
const CODE_BACKGROUNDS = { light: ['#ffffff', '#e6f0fc'], dark: ['#1e1e1e', '#22364a'] };
const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
const luminance = color => {
  const [r, g, b] = color.map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
const adjusted = new Map();
function readable(hex, mode) {
  const key = mode + hex;
  if (adjusted.has(key)) return adjusted.get(key);
  let color = rgb(hex.slice(0, 7));
  const target = mode === 'light' ? 0 : 255;
  for (let step = 0; step < 40 && Math.min(...CODE_BACKGROUNDS[mode].map(bg => contrast(color, rgb(bg)))) < 4.5; step++) {
    color = color.map(value => Math.round(value + (target - value) * 0.06));
  }
  const result = '#' + color.map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  adjusted.set(key, result);
  return result;
}

function highlight(code, lang) {
  const known = highlighter.getLoadedLanguages().includes(lang);
  if (!known) return code.split('\n').map(escapeHtml);
  const { tokens } = highlighter.codeToTokens(code, {
    lang,
    themes: { dark: 'dark-plus', light: 'light-plus' },
    defaultColor: false,
  });
  return tokens.map(line => line.map(token => {
    const style = Object.entries(token.htmlStyle ?? {}).map(([key, value]) => {
      const mode = key === '--shiki-dark' ? 'dark' : key === '--shiki-light' ? 'light' : null;
      return `${key}:${mode && /^#[0-9a-f]{6}/iu.test(value) ? readable(value, mode) : value}`;
    }).join(';');
    return `<span style="${escapeHtml(style)}">${escapeHtml(token.content)}</span>`;
  }).join(''));
}

// ---- Trang ------------------------------------------------------------------------------------
// --draft: bỏ qua trang chưa có nội dung (chỉ để xem thử khi đang soạn; CI không dùng).
const draft = process.argv.includes('--draft');
if (draft) {
  for (const group of pageMap.groups) group.pages = group.pages.filter(id => contents.get(id));
  pageMap.groups = pageMap.groups.filter(group => group.pages.length);
}
const order = pageMap.groups.flatMap(group => group.pages);
const groupOf = id => pageMap.groups.find(group => group.pages.includes(id));
const pages = {};

for (const id of order) {
  const page = pageMap.pages[id];
  const content = contents.get(id);
  if (!content) throw new Error(`Thiếu site/content/pages/${id}.json — chạy npm run check:sync`);
  const files = {};
  for (const [key, entry] of Object.entries(page.files ?? {})) {
    const resolved = resolveFile(docs, examples, entry);
    if (resolved.error) throw new Error(`${page.no} ${id} files.${key}: ${resolved.error} — chạy npm run check:sync`);
    files[key] = {
      key,
      kind: resolved.kind,
      name: resolved.name,
      path: resolved.path,
      note: resolved.note,
      lang: resolved.lang,
      langLabel: LANG_LABEL[resolved.lang] ?? resolved.lang,
      code: resolved.code,
      lines: resolved.code === null ? null : highlight(resolved.code, resolved.lang),
      role: resolved.role ? inline(resolved.role) : null,
      owner: resolved.owner ?? null,
      source: resolved.source ? (resolved.kind === 'illustrative' ? { file: resolved.source, href: githubBlob + resolved.source } : sourceInfo(resolved.source)) : null,
      sourceLine: resolved.sourceLine ?? null,
      illustrative: resolved.kind === 'illustrative',
    };
  }
  const checklist = page.checklist ? (() => {
    const { doc, heading } = resolveAnchor(docs, page.checklist);
    return {
      source: sourceInfo(page.checklist),
      items: sectionListItems(doc, heading.slug).map(item => inline(item, doc.file)),
    };
  })() : null;
  const steps = (content.steps ?? []).map((step, index) => ({
    n: index + 1,
    title: fillVersions(step.title),
    titleHtml: inline(step.title),
    textHtml: inline(step.text),
    resultHtml: step.result ? inline(step.result) : null,
    file: step.file ?? null,
    lines: step.lines ?? [],
    range: step.range ?? null,
    focus: step.focus ?? [],
    must: Boolean(step.must),
    should: Boolean(step.should),
    img: step.img ?? null,
    imgAlt: step.imgAlt ?? '',
    source: sourceInfo(step.ref),
    callouts: (step.callouts ?? []).map(callout => ({ kind: callout.kind, html: inline(callout.text) })),
  }));
  const usedExamples = Object.values(files).filter(file => file.kind === 'example').length;
  pages[id] = {
    id,
    no: page.no,
    title: page.title,
    layout: page.layout,
    group: { id: groupOf(id).id, no: groupOf(id).no, name: groupOf(id).name },
    descHtml: inline(content.desc),
    desc: fillVersions(content.desc),
    minutes: content.minutes ?? null,
    movedFrom: content.movedFrom ?? null,
    tldrHtml: (content.tldr ?? []).map(item => inline(item)),
    tldrText: (content.tldr ?? []).map(fillVersions),
    hero: content.hero ? {
      ...content.hero,
      label: fillVersions(content.hero.label),
      items: (content.hero.items ?? []).map(item => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === 'string' ? fillVersions(value) : value]))),
    } : null,
    steps,
    files,
    fileOrder: Object.keys(files),
    doHtml: content.do ? inline(content.do.text) : null,
    dontHtml: content.dont ? inline(content.dont.text) : null,
    dontRule: content.dont?.rule ?? null,
    lint: (content.lint ?? []).map(item => ({ rule: item.rule ?? null, status: item.status, noteHtml: inline(item.note ?? '') })),
    demo: content.demo ? { url: content.demo.url, labelHtml: inline(content.demo.label), img: content.demo.img ?? null } : null,
    checklist,
    sources: (page.sources ?? []).map(sourceInfo),
    verification: {
      examples: usedExamples,
      blocks: Object.values(files).filter(file => file.kind === 'block').length,
      illustrative: Object.values(files).filter(file => file.kind === 'illustrative').length,
    },
    githubHref: githubUrl(page.sources?.[0] ?? 'angular-portal/README.md'),
  };
}

// ---- Trang chủ ---------------------------------------------------------------------------------
function paragraphs(ref) {
  const { doc, heading } = resolveAnchor(docs, ref);
  const lines = doc.lines.slice(heading.line, heading.end - 1);
  const result = [];
  let current = [];
  for (const line of lines) {
    if (!line.trim() || /^[-*#|>`]/u.test(line.trim())) {
      if (current.length) result.push(current.join(' '));
      current = [];
    } else current.push(line.trim());
  }
  if (current.length) result.push(current.join(' '));
  return result.map(text => inline(text, doc.file));
}
const rulesDoc = resolveAnchor(docs, home.rules);
const homeData = {
  eyebrow: home.eyebrow,
  title: home.title,
  leadHtml: inline(home.lead),
  jobs: home.jobs.map(job => ({ title: job.title, textHtml: inline(job.text), pages: job.pages.filter(id => pages[id]) })),
  rules: {
    source: sourceInfo(home.rules),
    items: sectionListItems(rulesDoc.doc, rulesDoc.heading.slug).map(item => inline(item, rulesDoc.doc.file)),
  },
  verification: { source: sourceInfo(home.verification), paragraphs: paragraphs(home.verification) },
};

const images = Object.fromEntries(Object.entries(pageMap.images ?? {}).map(([src, meta]) => [src, meta]));
const data = {
  generatedFrom: { repo: pageMap.repo, branch: pageMap.branch, comparedAt: pageMap.comparedAt },
  versions: baseline,
  githubBlob,
  groups: pageMap.groups.map(group => ({ ...group, pages: group.pages.map(id => ({ id, no: pages[id].no, title: pages[id].title })) })),
  order,
  home: homeData,
  pages,
  images,
};

// ---- Fonts ------------------------------------------------------------------------------------
const KEEP_SUBSETS = ['vietnamese', 'latin-ext', 'latin'];
function fontFaces(pkg, weights) {
  const directory = path.join(siteDir, 'node_modules', '@fontsource', pkg);
  const faces = [];
  const copies = [];
  for (const weight of weights) {
    const css = fs.readFileSync(path.join(directory, `${weight}.css`), 'utf8');
    for (const block of css.split(/\n(?=\/\* )/u)) {
      const subset = /\/\* [\w-]+?-(vietnamese|latin-ext|latin|cyrillic-ext|cyrillic|greek-ext|greek)-\d+-normal \*\//u.exec(block)?.[1];
      if (!KEEP_SUBSETS.includes(subset)) continue;
      const woff2 = /url\(\.\/files\/([^)]+\.woff2)\)/u.exec(block)[1];
      copies.push(woff2);
      faces.push(block.trim()
        .replace(/src:[^;]+;/u, `src: url(fonts/${woff2}) format('woff2');`));
    }
  }
  return { faces, copies, directory };
}

// ---- Ghi dist/ ---------------------------------------------------------------------------------
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
const fontCss = [];
for (const [pkg, weights] of [['ibm-plex-sans', [400, 500, 600, 700]], ['ibm-plex-mono', [400, 500, 600]]]) {
  const { faces, copies, directory } = fontFaces(pkg, weights);
  fontCss.push(...faces);
  for (const file of copies) fs.copyFileSync(path.join(directory, 'files', file), path.join(dist, 'fonts', file));
}
fs.cpSync(path.join(siteDir, 'src'), dist, { recursive: true });
fs.cpSync(path.join(siteDir, 'assets'), path.join(dist, 'assets'), { recursive: true });
fs.writeFileSync(path.join(dist, 'fonts.css'), fontCss.join('\n\n') + '\n');
fs.writeFileSync(path.join(dist, 'data.js'), `window.BP_DATA = ${JSON.stringify(data)};\n`);

// Trang tĩnh dự phòng khi tắt JavaScript: danh sách trang + link Markdown.
const fallback = pageMap.groups.map(group => `<h2>${escapeHtml(group.no + ' · ' + group.name)}</h2><ul>${group.pages.map(id => `<li><a href="${escapeHtml(pages[id].githubHref)}">${escapeHtml(pages[id].no + ' ' + pages[id].title)}</a></li>`).join('')}</ul>`).join('');
const indexHtml = fs.readFileSync(path.join(siteDir, 'src', 'index.html'), 'utf8').replace('<!--NOSCRIPT-->', fallback);
fs.writeFileSync(path.join(dist, 'index.html'), indexHtml);
fs.writeFileSync(path.join(dist, '404.html'), indexHtml);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

const size = fs.statSync(path.join(dist, 'data.js')).size;
console.log(`build PASS — ${order.length} trang, ${Object.values(pages).reduce((sum, page) => sum + page.fileOrder.length, 0)} file code, data.js ${(size / 1024).toFixed(0)} KB → ${path.relative(repoDir, dist)}`);
