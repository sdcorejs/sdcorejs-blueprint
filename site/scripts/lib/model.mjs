// Loads Markdown sources, site/page-map.json and site/content/** and resolves references between them.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findHeading, parseMarkdown, sectionText } from './markdown.mjs';

// BP_SITE_DIR/BP_REPO_DIR chỉ dùng trong test để chạy trên bản sao repo.
export const siteDir = process.env.BP_SITE_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const repoDir = process.env.BP_REPO_DIR ?? path.resolve(siteDir, '..');
export const docsRoot = 'angular-portal';
export const pageMapFile = path.join(siteDir, 'page-map.json');
export const contentDir = path.join(siteDir, 'content');

export const CHECKLIST_HEADINGS = ['Nghiệm thu', 'Kiểm tra trước bàn giao'];
export const LAYOUTS = ['explorer', 'doc'];
export const CALLOUT_KINDS = ['tip', 'info', 'warn'];
export const LINT_STATUS = ['on', 'config', 'custom', 'external'];
export const HERO_TYPES = ['flow', 'tree', 'shot', 'stack', 'compare'];

export const toPosix = file => file.split(path.sep).join('/');
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const hash = text => 'sha256-' + crypto.createHash('sha256').update(String(text).replace(/\r\n?/gu, '\n')).digest('hex').slice(0, 16);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

/** All Markdown under angular-portal/, keyed by repo-relative POSIX path. */
export function loadDocs() {
  const docs = new Map();
  for (const file of walk(path.join(repoDir, docsRoot)).filter(name => name.endsWith('.md')).sort()) {
    const relative = toPosix(path.relative(repoDir, file));
    docs.set(relative, parseMarkdown(fs.readFileSync(file, 'utf8'), relative));
  }
  return docs;
}

/** Code samples marked `<!-- example: path -->`, keyed by sample path. */
export function exampleIndex(docs) {
  const examples = new Map();
  for (const doc of docs.values()) {
    for (const block of doc.blocks) {
      if (block.marker?.kind !== 'example') continue;
      if (!examples.has(block.marker.path)) examples.set(block.marker.path, []);
      examples.get(block.marker.path).push({ doc, block });
    }
  }
  return examples;
}

export function splitRef(ref) {
  const [file, slug = null] = String(ref).split('#');
  return { file, slug: slug ? decodeURIComponent(slug) : null };
}

/** Resolve `file.md#slug` → { doc, heading } or { error }. */
export function resolveAnchor(docs, ref) {
  const { file, slug } = splitRef(ref);
  const doc = docs.get(file);
  if (!doc) return { error: `không có file Markdown ${file}` };
  if (!slug) return { doc, heading: null };
  const heading = findHeading(doc, slug);
  if (!heading) return { error: `không có heading #${slug} trong ${file}` };
  return { doc, heading };
}

export function anchorText(docs, ref) {
  const resolved = resolveAnchor(docs, ref);
  if (resolved.error) return null;
  return sectionText(resolved.doc, resolved.heading?.slug ?? null);
}

/** Resolve one entry of page-map `files` to its code, display name and note. */
export function resolveFile(docs, examples, entry) {
  const resolved = resolveFileSource(docs, examples, entry);
  if (resolved.error) return resolved;
  const name = entry.name ?? (resolved.path ? resolved.path.replace(/\/$/u, '').split('/').pop() : null);
  if (!name) return { error: 'file không có path: khai báo name' };
  return { ...resolved, name, note: entry.note ?? null };
}

function resolveFileSource(docs, examples, entry) {
  if (entry.example) {
    const matches = examples.get(entry.example) ?? [];
    if (matches.length !== 1) return { error: matches.length ? `block example ${entry.example} bị trùng` : `không có block <!-- example: ${entry.example} -->` };
    const { doc, block } = matches[0];
    return { kind: 'example', code: block.code, lang: block.lang, path: entry.example, source: `${doc.file}#${block.heading}`, sourceLine: block.line, lockKey: `example:${entry.example}` };
  }
  if (entry.block) {
    const resolved = resolveAnchor(docs, entry.block);
    if (resolved.error) return { error: resolved.error };
    const slug = resolved.heading?.slug ?? null;
    const candidates = resolved.doc.blocks.filter(block => block.heading === slug);
    const block = candidates[entry.index ?? 0];
    if (!block) return { error: `${entry.block} không có code block thứ ${(entry.index ?? 0) + 1}` };
    return {
      kind: 'block',
      code: block.code,
      lang: entry.lang ?? block.lang,
      path: entry.path ?? block.marker?.path ?? null,
      source: entry.block,
      sourceLine: block.line,
      lockKey: `block:${entry.block}[${entry.index ?? 0}]`,
    };
  }
  if (entry.illustrative) {
    const file = path.join(contentDir, entry.illustrative);
    if (!fs.existsSync(file)) return { error: `không có file minh họa site/content/${entry.illustrative}` };
    const code = fs.readFileSync(file, 'utf8').replace(/\r\n?/gu, '\n').replace(/\n$/u, '');
    return { kind: 'illustrative', code, lang: entry.lang ?? langOf(entry.path ?? entry.illustrative), path: entry.path ?? null, source: `site/content/${entry.illustrative}` };
  }
  if (entry.role) return { kind: 'role', code: null, lang: null, path: entry.path ?? null, role: entry.role, owner: entry.owner ?? null, source: entry.ref ?? null };
  return { error: 'file phải có example, block, illustrative hoặc role' };
}

export function langOf(file) {
  const extension = path.extname(String(file)).slice(1);
  return { ts: 'ts', html: 'html', scss: 'scss', json: 'json', js: 'js', mjs: 'js', md: 'md' }[extension] ?? 'text';
}

export function loadSite() {
  const pageMap = readJson(pageMapFile);
  // Bản nháp khi soạn song song: site/.work/page-map/<id>.json ghi đè entry tương ứng (không commit).
  const fragments = path.join(siteDir, '.work', 'page-map');
  if (fs.existsSync(fragments)) {
    for (const file of fs.readdirSync(fragments).filter(name => name.endsWith('.json'))) {
      const id = file.replace(/.json$/u, '');
      if (pageMap.pages[id]) Object.assign(pageMap.pages[id], readJson(path.join(fragments, file)));
    }
  }
  const contents = new Map();
  for (const id of Object.keys(pageMap.pages)) {
    const file = path.join(contentDir, 'pages', id + '.json');
    contents.set(id, fs.existsSync(file) ? readJson(file) : null);
  }
  const home = readJson(path.join(contentDir, 'home.json'));
  return { pageMap, contents, home };
}

/** Every Markdown reference a page depends on, with the text that is locked. */
export function pageDependencies(docs, examples, id, page, content) {
  const refs = new Set(page.sources ?? []);
  if (page.checklist) refs.add(page.checklist);
  for (const step of content?.steps ?? []) {
    if (step.ref) refs.add(step.ref);
    for (const callout of step.callouts ?? []) if (callout.ref) refs.add(callout.ref);
  }
  for (const key of ['do', 'dont']) if (content?.[key]?.ref) refs.add(content[key].ref);
  for (const callout of content?.callouts ?? []) if (callout.ref) refs.add(callout.ref);
  const locks = {};
  for (const ref of [...refs].sort()) {
    const text = anchorText(docs, ref);
    if (text !== null) locks['section:' + ref] = hash(text);
  }
  const origins = {};
  for (const ref of refs) origins['section:' + ref] = ref;
  for (const entry of Object.values(page.files ?? {})) {
    const resolved = resolveFile(docs, examples, entry);
    if (!resolved.lockKey) continue;
    locks[resolved.lockKey] = hash(resolved.code);
    origins[resolved.lockKey] = `${resolved.source.split('#')[0]}:${resolved.sourceLine} (${resolved.lockKey.replace(/^\w+:/u, '')})`;
  }
  return { locks: Object.fromEntries(Object.entries(locks).sort(([a], [b]) => a.localeCompare(b))), origins };
}

export function versions() {
  const foundation = readJson(path.join(repoDir, 'validation/angular-foundation/package.json'));
  const consumer = readJson(path.join(repoDir, 'validation/angular-consumer/package.json'));
  const all = { ...consumer.dependencies, ...consumer.devDependencies };
  return {
    angular: foundation.devDependencies['@angular/core'],
    typescript: foundation.devDependencies.typescript,
    core: all['@sdcorejs/angular'],
    utils: foundation.devDependencies['@sdcorejs/utils'],
  };
}
