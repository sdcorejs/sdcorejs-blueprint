// Khối code kiểu VS Code: tab tên file, breadcrumb, số dòng, highlight theo bước, CodeLens, Sao chép, Dark+/Light+.
import { announce, copyText, esc, storage } from './util.js';

const THEME_KEY = 'bp-code-theme';
const ICONS = {
  ts: ['TS', '#3178c6'],
  html: ['<>', '#e44d26'],
  scss: ['#', '#cd6799'],
  json: ['{}', '#cbcb41'],
  js: ['JS', '#cbcb41'],
  text: ['≡', '#519aba'],
};

export function fileIcon(lang) {
  const [glyph, color] = ICONS[lang] ?? ICONS.text;
  return `<span class="ficon" style="color:${color}" aria-hidden="true">${esc(glyph)}</span>`;
}

export function codeTheme() {
  const saved = storage.get(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setCodeTheme(theme) {
  storage.set(THEME_KEY, theme);
  for (const element of document.querySelectorAll('.code-theme')) element.dataset.codeTheme = theme;
  for (const button of document.querySelectorAll('[data-theme-set]')) {
    button.setAttribute('aria-pressed', String(button.dataset.themeSet === theme));
  }
  announce(theme === 'dark' ? 'Đã đổi code sang Dark+' : 'Đã đổi code sang Light+');
}

export function themeToggle() {
  const theme = codeTheme();
  return `<div class="theme-toggle" role="group" aria-label="Màu code">
    <button type="button" data-theme-set="dark" aria-pressed="${theme === 'dark'}">Dark+</button>
    <button type="button" data-theme-set="light" aria-pressed="${theme === 'light'}">Light+</button>
  </div>`;
}

export function crumbs(file) {
  const parts = (file.path ?? file.name).replace(/\/$/, '').split('/').filter(Boolean);
  return parts.map(part => `<span>${esc(part)}</span>`).join('<span class="sep" aria-hidden="true">›</span>');
}

/**
 * @param {object} file   dữ liệu file từ build (lines là HTML đã tô màu)
 * @param {object} options { highlight: number[], lens: { n, title } | null, range: [a, b] | null }
 */
export function codeLines(file, { highlight = [], lens = null, range = null } = {}) {
  const marked = new Set(highlight);
  const first = highlight.length ? Math.min(...highlight) : null;
  const [from, to] = range ?? [1, file.lines.length];
  const rows = [];
  for (let number = from; number <= to; number++) {
    if (lens && number === first) {
      rows.push(`<span class="code-lens" aria-hidden="true"><span></span><span><span class="lens">◂ Bước ${lens.n} · ${esc(lens.title)}</span></span></span>`);
    }
    const hl = marked.has(number);
    rows.push(`<span class="code-line${hl ? ' hl' : ''}" data-line="${number}"><span class="ln" aria-hidden="true">${number}</span><span class="tok">${file.lines[number - 1] || ' '}</span></span>`);
  }
  return `<pre class="code-lines" tabindex="0" aria-label="${esc(file.name)}${range ? `, dòng ${from}–${to}` : ''}"><code>${rows.join('')}</code></pre>`;
}

export function fileBadges(file) {
  const badges = [];
  if (file.illustrative) badges.push('<span class="badge illustrative">Minh họa</span>');
  if (file.note) badges.push(`<span class="badge pseudo">${esc(file.note)}</span>`);
  return badges.join(' ');
}

export function sourceNote(file) {
  if (!file.source) return '';
  if (file.illustrative) {
    return `<div class="code-note">${fileBadges(file)}<span>File minh họa, chưa có block trong Markdown: <a href="${esc(file.source.href)}">${esc(file.source.file)}</a></span></div>`;
  }
  const where = file.source.heading ? `${file.source.file} · ${file.source.heading}` : file.source.file;
  return `<div class="code-note">${fileBadges(file)}<span>Trích từ <a href="${esc(file.source.href)}">${esc(where)}</a></span></div>`;
}

/** Khối code một file cho layout Doc. */
export function codeBlock(pageId, file, options = {}) {
  return `<div class="code-theme codeblock" data-code-theme="${codeTheme()}">
    <div class="code-tabbar">
      <span class="code-tab">${fileIcon(file.lang)}${esc(file.name)}</span>
      <span class="code-tabbar-spacer"></span>
      <span class="code-tools">${themeToggle()}<button type="button" class="copy-button" data-copy="${esc(pageId)}:${esc(file.key)}">Sao chép</button></span>
    </div>
    <div class="code-crumbs" aria-label="Đường dẫn">${crumbs(file)}</div>
    <div class="code-scroll">${codeLines(file, options)}</div>
    ${sourceNote(file)}
  </div>`;
}

export function bindCodeActions(root, data) {
  root.addEventListener('click', event => {
    const themeButton = event.target.closest('[data-theme-set]');
    if (themeButton) {
      setCodeTheme(themeButton.dataset.themeSet);
      return;
    }
    const copyButton = event.target.closest('[data-copy]');
    if (copyButton) {
      const [pageId, key] = copyButton.dataset.copy.split(':');
      const file = data.pages[pageId]?.files[key];
      if (!file?.code) return;
      copyText(file.code).then(() => {
        const label = copyButton.textContent;
        copyButton.textContent = 'Đã chép';
        announce(`Đã sao chép ${file.name}`);
        window.setTimeout(() => { copyButton.textContent = label; }, 1500);
      }, () => announce('Không sao chép được; chọn code để chép thủ công.'));
    }
  });
}
