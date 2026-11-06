// Thành phần dùng chung giữa layout Doc và Explorer.
import { esc, storage } from './util.js';

const CALLOUT = {
  tip: { label: 'Mẹo', icon: '✓' },
  info: { label: 'Lưu ý', icon: 'i' },
  warn: { label: 'Tránh', icon: '!' },
};
const LINT_BADGE = {
  on: ['eslint', 'ESLINT', 'Đã bật'],
  config: ['eslint', 'ESLINT', 'Cấu hình thêm'],
  custom: ['custom', 'CUSTOM RULE', 'Custom rule'],
  external: ['review', 'REVIEW', 'Ngoài ESLint'],
};

export const stepHash = (id, n) => `#/${id}/buoc-${n}`;

export function callouts(list) {
  if (!list?.length) return '';
  return `<div class="callouts">${list.map(callout => {
    const meta = CALLOUT[callout.kind];
    return `<div class="callout ${callout.kind}"><span class="callout-icon" aria-hidden="true">${meta.icon}</span><p><strong>${meta.label}.</strong>${callout.html}</p></div>`;
  }).join('')}</div>`;
}

export function stepBadges(step) {
  return [
    step.must ? '<span class="badge must" title="Markdown có câu bắt buộc">MUST</span>' : '',
    step.should ? '<span class="badge should">SHOULD</span>' : '',
  ].join('');
}

export function pageHeader(page, { compact = false } = {}) {
  const chips = [
    page.minutes ? `<span class="chip">${page.minutes} phút đọc</span>` : '',
    `<span class="chip">${page.steps.length} bước</span>`,
    page.movedFrom ? `<span class="chip warn">Từ portal-template ${esc(page.movedFrom)}</span>` : '',
  ].join('');
  return `<header class="doc-header">
    <p class="eyebrow"><a href="#/">Blueprint</a> / ${esc(page.group.name)} / ${esc(page.no)}</p>
    <h1 class="page-title" id="page-title" tabindex="-1">${esc(page.title)}</h1>
    <p class="page-desc">${page.descHtml}</p>
    <div class="chips">${chips}</div>
    ${compact ? '' : ''}
  </header>`;
}

export function tldr(page, { compact = false } = {}) {
  return `<section aria-labelledby="tldr-${page.id}">
    <h2 class="section-label" id="tldr-${page.id}">Nhớ 3 điều</h2>
    <ol class="tldr${compact ? ' compact' : ''}">${page.tldrHtml.map(item => `<li><span>${item}</span></li>`).join('')}</ol>
  </section>`;
}

export function imageCaption(data, src) {
  const meta = data.images[src];
  if (!meta) return '';
  return `<p class="figure-caption">${meta.stale ? '<span class="badge stale">Ảnh cũ</span>' : ''}${meta.staleNote ? `<span>${esc(meta.staleNote)}</span>` : ''}<span>Nguồn: ${esc(meta.source)} · chụp ${esc(meta.capturedAt)}</span></p>`;
}

/** Hình chính: flow, tree, shot, stack, compare. `focus` = các index đang sáng. */
export function hero(data, page, focus = [], { mini = false } = {}) {
  const model = page.hero;
  if (!model) return '';
  const on = index => focus.includes(index) ? ' on' : '';
  const items = model.items ?? [];
  let body = '';
  if (model.type === 'flow' || model.type === 'stack') {
    body = `<ol class="${model.type === 'flow' ? 'hero-flow' : 'hero-stack'}">${items.map((item, index) => `<li><div class="hero-node${on(index)}" data-hero-index="${index}"><b>${esc(item.t)}</b>${item.s ? `<span>${esc(item.s)}</span>` : ''}</div></li>`).join('')}</ol>`;
  } else if (model.type === 'tree') {
    body = `<ul class="hero-tree">${items.map((item, index) => `<li class="${on(index).trim()}" data-hero-index="${index}">${esc(item.t)}</li>`).join('')}</ul>`;
  } else if (model.type === 'compare') {
    // Mỗi giá trị “a · b · c” tách thành token không bẻ giữa từ; chỉ xuống dòng giữa các token.
    const tokens = value => String(value ?? '').split(/\s+·\s+/u).map(token => `<span class="cmp-token">${esc(token)}</span>`).join('<span class="cmp-sep" aria-hidden="true"> · </span>');
    body = mini
      // Rail hẹp (280px): xếp dọc thay vì bảng 3 cột.
      ? `<ul class="hero-compare-list">${items.map((item, index) => `<li class="${on(index).trim()}" data-hero-index="${index}">
          <b>${esc(item.role)}</b>
          <p class="ok"><span aria-hidden="true">✓</span><span class="visually-hidden">Đúng:</span> ${tokens(item.ok)}</p>
          <p class="bad"><span aria-hidden="true">✕</span><span class="visually-hidden">Sai:</span> ${tokens(item.bad)}</p>
        </li>`).join('')}</ul>`
      : `<div class="hero-compare-scroll"><table class="hero-compare">
          <thead><tr><th scope="col">Loại</th><th scope="col">✓ Đúng</th><th scope="col">✕ Sai</th></tr></thead>
          <tbody>${items.map((item, index) => `<tr class="${on(index).trim()}" data-hero-index="${index}"><th scope="row">${esc(item.role)}</th><td class="ok">${tokens(item.ok)}</td><td class="bad">${tokens(item.bad)}</td></tr>`).join('')}</tbody>
        </table></div>`;
  } else if (model.type === 'shot') {
    body = `<div class="hero-shot" style="aspect-ratio:${esc(model.ratio ?? 'auto')}">
        <img src="${esc(model.img)}" alt="${esc(model.alt ?? '')}" loading="lazy">
        ${items.map((item, index) => `<span class="pin${on(index)}" data-hero-index="${index}" style="left:${esc(item.x)};top:${esc(item.y)}" aria-hidden="true">${index + 1}</span>`).join('')}
      </div>
      <ol class="pin-legend">${items.map((item, index) => `<li class="${on(index).trim()}" data-hero-index="${index}"><span class="n" aria-hidden="true">${index + 1}</span><span>${esc(item.t)}</span></li>`).join('')}</ol>
      ${mini ? '' : imageCaption(data, model.img)}`;
  }
  return `<figure class="hero hero-kind-${model.type}"><figcaption class="hero-label">${mini ? 'Sơ đồ' : 'Hình chính'} · ${esc(model.label)}</figcaption>${body}</figure>`;
}

export function setHeroFocus(root, focus) {
  for (const element of root.querySelectorAll('[data-hero-index]')) {
    element.classList.toggle('on', focus.includes(Number(element.dataset.heroIndex)));
  }
}

// ---- Cuối trang: Đúng/Sai → Tự động kiểm tra → Checklist → Kiểm chứng → Nguồn → Trước/sau ----
function dodont(page) {
  if (!page.doHtml && !page.dontHtml) return '';
  return `<section aria-labelledby="dodont-${page.id}">
    <h2 id="dodont-${page.id}">Đúng / Sai</h2>
    <div class="dodont">
      <div class="do"><p class="dodont-label">✓ ĐÚNG</p><p class="dodont-text">${page.doHtml ?? ''}</p></div>
      <div class="dont"><p class="dodont-label">✕ SAI</p><p class="dodont-text">${page.dontHtml ?? ''}</p>${page.dontRule ? `<p class="blocked-by">Bị chặn bởi: <code>${esc(page.dontRule)}</code></p>` : ''}</div>
    </div>
  </section>`;
}

export function lintList(page) {
  if (!page.lint.length) return '<p>Chưa có kiểm tra tự động cho trang này.</p>';
  return `<ul class="lint-list">${page.lint.map(item => {
    const [kind, badge, status] = LINT_BADGE[item.status];
    return `<li><span class="badge ${kind}">${badge}</span>${item.rule ? `<span class="lint-rule">${esc(item.rule)}</span>` : ''}<span>${status}${item.noteHtml ? ` · ${item.noteHtml}` : ''}</span></li>`;
  }).join('')}</ul>`;
}

function lintSection(page) {
  return `<section aria-labelledby="lint-${page.id}"><h2 id="lint-${page.id}">Tự động kiểm tra</h2>${lintList(page)}
    <p class="source-link">Tên rule theo <a href="#/bp-lint">conventions/eslint.md</a>.</p></section>`;
}

const checklistKey = id => `bp-checklist:${id}`;

function checklist(page) {
  if (!page.checklist) return '';
  const done = new Set(storage.get(checklistKey(page.id), []));
  const total = page.checklist.items.length;
  return `<section aria-labelledby="check-${page.id}" data-checklist="${esc(page.id)}">
    <div class="checklist-head"><h2 id="check-${page.id}">Checklist bàn giao</h2><span class="checklist-count" aria-live="polite">${[...done].filter(index => index < total).length}/${total}</span></div>
    <ul class="checklist">${page.checklist.items.map((item, index) => `<li><button type="button" class="check" role="checkbox" aria-checked="${done.has(index)}" data-check="${index}"><span class="check-box" aria-hidden="true"></span><span class="check-text">${item}</span></button></li>`).join('')}</ul>
    <p class="source-link">Lấy từ <a href="${esc(page.checklist.source.href)}">${esc(page.checklist.source.file)} · ${esc(page.checklist.source.heading)}</a></p>
  </section>`;
}

export function bindChecklist(root) {
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-check]');
    if (!button) return;
    const section = button.closest('[data-checklist]');
    const id = section.dataset.checklist;
    const checked = button.getAttribute('aria-checked') !== 'true';
    button.setAttribute('aria-checked', String(checked));
    const indexes = [...section.querySelectorAll('[data-check]')]
      .filter(item => item.getAttribute('aria-checked') === 'true')
      .map(item => Number(item.dataset.check));
    storage.set(checklistKey(id), indexes);
    section.querySelector('.checklist-count').textContent = `${indexes.length}/${section.querySelectorAll('[data-check]').length}`;
  });
}

function verification(data, page) {
  const { examples, blocks, illustrative } = page.verification;
  const lines = [];
  if (examples) lines.push(`${examples} block <code>example</code> được <a href="${esc(data.githubBlob)}validation/angular-foundation/README.md">validation/angular-foundation</a> trích từ Markdown và type-check với Angular ${esc(data.versions.angular)} / TypeScript ${esc(data.versions.typescript)}.`);
  if (blocks) lines.push(`${blocks} đoạn code/mã giả trích từ Markdown không có marker <code>example</code>: không được type-check.`);
  if (illustrative) lines.push(`${illustrative} file <span class="badge illustrative">Minh họa</span> chưa có block trong Markdown, không thuộc bộ kiểm chứng.`);
  if (!lines.length) lines.push('Trang không có code mẫu.');
  const demo = page.demo ? `<p style="margin-top:10px">Demo: <a href="${esc(page.demo.url)}">${page.demo.labelHtml}</a></p>${page.demo.img ? `<figure class="demo-figure"><img src="${esc(page.demo.img)}" alt="" loading="lazy">${imageCaption(data, page.demo.img)}</figure>` : ''}` : '';
  return `<section aria-labelledby="verify-${page.id}"><h2 id="verify-${page.id}">Kiểm chứng</h2>
    <ul class="verify-list">${lines.map(line => `<li>${line}</li>`).join('')}</ul>${demo}
    <p class="source-link" style="margin-top:8px">Core UI thật, AOT và Playwright: <a href="${esc(data.githubBlob)}validation/angular-consumer/README.md">validation/angular-consumer</a> (Core ${esc(data.versions.core)}).</p>
  </section>`;
}

function sources(page) {
  return `<section aria-labelledby="src-${page.id}"><h2 id="src-${page.id}">Nguồn Markdown</h2>
    <ul class="sources">${page.sources.map(source => `<li><a href="${esc(source.href)}">${esc(source.file)}${source.heading ? `#${esc(source.heading)}` : ''}</a></li>`).join('')}</ul>
    <p class="source-link" style="margin-top:6px">Markdown là nguồn quy tắc; trang này chỉ trình bày lại.</p>
  </section>`;
}

function pager(data, page) {
  const index = data.order.indexOf(page.id);
  const previous = data.pages[data.order[index - 1]];
  const next = data.pages[data.order[index + 1]];
  return `<nav class="pager" aria-label="Trang trước và sau">
    ${previous ? `<a href="#/${previous.id}"><span class="dir">← Trước · ${esc(previous.no)}</span>${esc(previous.title)}</a>` : '<span></span>'}
    ${next ? `<a class="next" href="#/${next.id}"><span class="dir">Sau · ${esc(next.no)} →</span>${esc(next.title)}</a>` : ''}
  </nav>`;
}

export function endSections(data, page, { dodont: withDodont = true, lint = true } = {}) {
  return `<div class="end">${withDodont ? dodont(page) : ''}${lint ? lintSection(page) : ''}${checklist(page)}${verification(data, page)}${sources(page)}${pager(data, page)}</div>`;
}
