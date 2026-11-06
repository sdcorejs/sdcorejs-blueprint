// Layout Explorer (bản 2a): bước bên trái, cây thư mục + tab + editor kiểu VS Code bên phải.
import { codeLines, codeTheme, crumbs, fileBadges, fileIcon, sourceNote, themeToggle } from './code.js';
import { callouts, endSections, lintList, pageHeader, stepBadges, stepHash, tldr } from './parts.js';
import { esc } from './util.js';

const LOOSE = 'Trích từ Markdown';

/** Dựng cây từ path của file; gộp chuỗi thư mục chỉ có một thư mục con như VS Code. */
function buildTree(page) {
  const root = { name: '', children: new Map(), files: [], fileKey: null };
  for (const key of page.fileOrder) {
    const file = page.files[key];
    const raw = file.path ?? `${LOOSE}/${file.name}`;
    const isDirectory = raw.endsWith('/');
    const parts = raw.replace(/\/$/, '').split('/').filter(Boolean);
    const leaf = isDirectory ? null : parts.pop();
    let node = root;
    for (const part of parts) {
      if (!node.children.has(part)) node.children.set(part, { name: part, children: new Map(), files: [], fileKey: null });
      node = node.children.get(part);
    }
    if (isDirectory) node.fileKey = key;
    else node.files.push({ name: file.path ? leaf : file.name, key });
  }
  function compact(node) {
    for (const [name, child] of node.children) {
      compact(child);
      if (child.children.size === 1 && !child.files.length && !child.fileKey) {
        const [only] = child.children.values();
        node.children.delete(name);
        node.children.set(`${name}/${only.name}`, { ...only, name: `${name}/${only.name}` });
      }
    }
  }
  compact(root);
  return root;
}

function treeHtml(page, node, level, ids) {
  const folders = [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name));
  const files = [...node.files].sort((a, b) => a.name.localeCompare(b.name));
  return [
    ...folders.map(folder => {
      const id = `n${ids.next++}`;
      const roleFile = folder.fileKey ? page.files[folder.fileKey] : null;
      return `<li role="treeitem" aria-level="${level}" aria-expanded="true" tabindex="-1" data-node="${id}"${folder.fileKey ? ` data-file="${esc(folder.fileKey)}" aria-selected="false"` : ''}>
        <div class="tree-row" style="padding-left:${8 + (level - 1) * 12}px"><span class="tree-twisty" aria-hidden="true">▾</span><span class="tree-name">${esc(folder.name)}${roleFile ? '/' : ''}</span></div>
        <ul role="group">${treeHtml(page, folder, level + 1, ids)}</ul>
      </li>`;
    }),
    ...files.map(item => {
      const file = page.files[item.key];
      return `<li role="treeitem" aria-level="${level}" aria-selected="false" tabindex="-1" data-file="${esc(item.key)}">
        <div class="tree-row" style="padding-left:${20 + (level - 1) * 12}px">${fileIcon(file.lang)}<span class="tree-name">${esc(item.name)}</span></div>
      </li>`;
    }),
  ].join('');
}

function lineSpan(lines) {
  if (!lines?.length) return '';
  const min = Math.min(...lines);
  const max = Math.max(...lines);
  return min === max ? `dòng ${min}` : `dòng ${min}–${max}`;
}

function stepItem(page, step) {
  const file = page.files[step.file];
  return `<li class="ex-step" data-step="${step.n}">
    <button type="button" class="ex-step-head" aria-expanded="false" aria-controls="ex-step-${step.n}" id="ex-step-head-${step.n}">
      <span class="step-no" aria-hidden="true">${step.n}</span>
      <span><span class="ex-step-title"><span class="visually-hidden">Bước ${step.n}: </span>${step.titleHtml}</span>
        <span class="ex-step-meta">${esc(file?.name ?? '')}${step.lines.length ? ` · ${lineSpan(step.lines)}` : ''}</span></span>
      <span>${stepBadges(step)}</span>
    </button>
    <div class="ex-step-body" id="ex-step-${step.n}" role="region" aria-labelledby="ex-step-head-${step.n}" hidden>
      <p>${step.textHtml}</p>
      ${callouts(step.callouts)}
      ${step.resultHtml ? `<p class="result">${step.resultHtml}</p>` : ''}
      <p class="source-link" style="margin-top:8px">Nguồn: <a href="${esc(step.source.href)}">${esc(step.source.file)}${step.source.heading ? ` · ${esc(step.source.heading)}` : ''}</a></p>
    </div>
  </li>`;
}

export function renderExplorer(data, page) {
  const tree = buildTree(page);
  return `<article data-layout="explorer">
    <div class="ex">
      <div class="ex-left">
        ${pageHeader(page)}
        ${tldr(page, { compact: true })}
        <section style="margin-top:20px" aria-labelledby="ex-steps-${page.id}">
          <h2 class="section-label" id="ex-steps-${page.id}">Các bước</h2>
          <ol class="ex-steps">${page.steps.map(step => stepItem(page, step)).join('')}</ol>
        </section>
        <div class="end" style="margin-top:24px;gap:18px">
          <section aria-labelledby="dodont-${page.id}">
            <h2 id="dodont-${page.id}" class="section-label">Đúng / Sai</h2>
            <div class="dodont" style="grid-template-columns:1fr">
              <div class="do"><p class="dodont-label">✓ ĐÚNG</p><p class="dodont-text">${page.doHtml ?? ''}</p></div>
              <div class="dont"><p class="dodont-label">✕ SAI</p><p class="dodont-text">${page.dontHtml ?? ''}</p>${page.dontRule ? `<p class="blocked-by">Bị chặn bởi: <code>${esc(page.dontRule)}</code></p>` : ''}</div>
            </div>
          </section>
          <section aria-labelledby="lint-${page.id}"><h2 id="lint-${page.id}" class="section-label">ESLint / Review</h2>${lintList(page)}</section>
        </div>
      </div>
      <div class="ex-right code-theme" data-code-theme="${codeTheme()}">
        <div class="ex-tree-pane">
          <div class="ex-tree-head"><span id="ex-tree-label-${page.id}">EXPLORER</span>${themeToggle()}</div>
          <ul class="tree" role="tree" aria-labelledby="ex-tree-label-${page.id}">${treeHtml(page, tree, 1, { next: 0 })}</ul>
          <label class="ex-file-select">File
            <select data-file-select>${page.fileOrder.map(key => `<option value="${esc(key)}">${esc(page.files[key].path ?? page.files[key].name)}</option>`).join('')}</select>
          </label>
          <div class="ex-mobile-theme">${themeToggle()}</div>
        </div>
        <div class="ex-editor">
          <div class="ex-tabs" role="tablist" aria-label="File đang mở"></div>
          <div class="ex-crumbs"></div>
          <div class="ex-code" role="tabpanel" id="ex-panel-${page.id}" tabindex="-1"></div>
        </div>
        <div class="ex-status" aria-live="polite"></div>
      </div>
    </div>
    <div class="ex-after">${endSections(data, page, { dodont: false, lint: false })}</div>
  </article>`;
}

export function mountExplorer(root, data, page, initialStep) {
  const state = { step: 0, tabs: [], active: null };
  const treeEl = root.querySelector('[role="tree"]');
  const tabsEl = root.querySelector('.ex-tabs');
  const crumbsEl = root.querySelector('.ex-crumbs');
  const codeEl = root.querySelector('.ex-code');
  const statusEl = root.querySelector('.ex-status');
  const selectEl = root.querySelector('[data-file-select]');

  function currentStep() { return page.steps[state.step - 1] ?? null; }

  function renderTabs() {
    tabsEl.innerHTML = state.tabs.map(key => {
      const file = page.files[key];
      const selected = key === state.active;
      return `<span class="ex-tab${selected ? ' active' : ''}" role="presentation">
        <span class="ex-tab-label" role="tab" id="ex-tab-${page.id}-${esc(key)}" data-tab="${esc(key)}" aria-selected="${selected}" aria-controls="ex-panel-${page.id}" tabindex="${selected ? 0 : -1}" aria-keyshortcuts="Delete" title="${esc(file.path ?? file.name)} — phím Delete để đóng">${fileIcon(file.lang)}${esc(file.name)}${file.illustrative ? ' <span class="badge illustrative">Minh họa</span>' : ''}</span>
        <button type="button" class="tab-close" data-close="${esc(key)}" tabindex="-1" aria-label="Đóng ${esc(file.name)}">×</button>
      </span>`;
    }).join('');
  }

  function renderEditor({ scroll = true } = {}) {
    const file = state.active ? page.files[state.active] : null;
    const step = currentStep();
    const onStep = file && step && step.file === state.active;
    if (!file) {
      crumbsEl.innerHTML = '';
      codeEl.innerHTML = '<p class="ex-empty">Chọn file trên cây thư mục để mở.</p>';
      codeEl.removeAttribute('aria-labelledby');
    } else {
      codeEl.setAttribute('aria-labelledby', `ex-tab-${page.id}-${state.active}`);
      crumbsEl.innerHTML = `<span class="path">${crumbs(file)}</span>${fileBadges(file)}${file.code ? `<button type="button" class="copy-button" data-copy="${esc(page.id)}:${esc(state.active)}">Sao chép</button>` : ''}`;
      if (file.lines) {
        codeEl.innerHTML = codeLines(file, onStep ? { highlight: step.lines, lens: step.lines.length ? { n: step.n, title: step.title } : null } : {}) + sourceNote(file);
      } else {
        codeEl.innerHTML = `<div class="role-card"><h3>${esc(file.path ?? file.name)}</h3><p>${file.role}</p>${file.owner ? `<p style="margin-top:6px"><strong>Owner:</strong> ${esc(file.owner)}</p>` : ''}${file.source ? `<p style="margin-top:6px">Nguồn: <a href="${esc(file.source.href)}">${esc(file.source.file)}${file.source.heading ? ` · ${esc(file.source.heading)}` : ''}</a></p>` : ''}</div>`;
      }
      if (scroll) {
        const first = onStep && step.lines.length ? codeEl.querySelector(`[data-line="${Math.min(...step.lines)}"]`) : null;
        codeEl.scrollTop = first ? Math.max(0, first.offsetTop - 60) : 0;
      }
    }
    for (const item of treeEl.querySelectorAll('[data-file]')) item.setAttribute('aria-selected', String(item.dataset.file === state.active));
    if (selectEl && state.active) selectEl.value = state.active;
    const line = onStep && step.lines.length ? Math.min(...step.lines) : 1;
    statusEl.innerHTML = `<span class="grow">${step ? `Bước ${step.n}/${page.steps.length} · ${esc(step.title)}` : ''}</span>${file?.lines ? `<span>Ln ${line}, Col 1</span><span>${esc(file.langLabel)}</span>` : ''}`;
  }

  function openFile(key, { focusTab = false } = {}) {
    if (!page.files[key]) return;
    if (!state.tabs.includes(key)) state.tabs.push(key);
    state.active = key;
    renderTabs();
    renderEditor();
    if (focusTab) tabsEl.querySelector(`[data-tab="${CSS.escape(key)}"]`)?.focus();
  }

  function closeFile(key) {
    const index = state.tabs.indexOf(key);
    if (index < 0) return;
    state.tabs.splice(index, 1);
    if (state.active === key) state.active = state.tabs[index] ?? state.tabs[index - 1] ?? null;
    renderTabs();
    renderEditor({ scroll: false });
    const next = state.active && tabsEl.querySelector(`[data-tab="${CSS.escape(state.active)}"]`);
    (next ?? codeEl).focus();
  }

  /**
   * Đưa tiêu đề bước vào vùng nhìn thấy mà không dùng scrollIntoView: scrollIntoView cuộn mọi tổ tiên,
   * kể cả khung .ex, làm tiêu đề trang bị đẩy khuất dưới header. Chỉ cuộn cột bước (desktop) hoặc cửa sổ (≤ 1099px).
   */
  function revealStep(n) {
    const head = root.querySelector(`#ex-step-head-${n}`);
    if (!head) return;
    const column = root.querySelector('.ex-left');
    const margin = 12;
    const rect = head.getBoundingClientRect();
    if (column.scrollHeight > column.clientHeight && getComputedStyle(column).overflowY !== 'visible') {
      const box = column.getBoundingClientRect();
      if (rect.top < box.top + margin || rect.bottom > box.bottom - margin) column.scrollTop += rect.top - box.top - margin;
      return;
    }
    const top = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
    if (rect.top < top + margin || rect.bottom > window.innerHeight - margin) window.scrollBy(0, rect.top - top - margin);
  }

  function goStep(n, { focus = false, reveal = true } = {}) {
    const step = page.steps[n - 1];
    if (!step) return;
    state.step = n;
    for (const item of root.querySelectorAll('.ex-step')) {
      const active = Number(item.dataset.step) === n;
      item.classList.toggle('current', active);
      item.querySelector('.ex-step-head').setAttribute('aria-expanded', String(active));
      item.querySelector('.ex-step-body').hidden = !active;
    }
    if (step.file) openFile(step.file);
    else renderEditor();
    history.replaceState(null, '', stepHash(page.id, n));
    if (focus) root.querySelector(`#ex-step-head-${n}`)?.focus({ preventScroll: true });
    if (reveal) revealStep(n);
  }

  // ---- Bước ----
  root.querySelector('.ex-steps').addEventListener('click', event => {
    const head = event.target.closest('.ex-step-head');
    if (head) goStep(Number(head.closest('.ex-step').dataset.step));
  });

  // ---- Tab ----
  tabsEl.addEventListener('click', event => {
    const close = event.target.closest('[data-close]');
    if (close) { event.stopPropagation(); closeFile(close.dataset.close); return; }
    const tab = event.target.closest('[data-tab]');
    if (tab) openFile(tab.dataset.tab);
  });
  tabsEl.addEventListener('keydown', event => {
    const tab = event.target.closest('[data-tab]');
    if (!tab) return;
    const keys = state.tabs;
    const index = keys.indexOf(tab.dataset.tab);
    let next = null;
    if (event.key === 'ArrowRight') next = keys[(index + 1) % keys.length];
    else if (event.key === 'ArrowLeft') next = keys[(index - 1 + keys.length) % keys.length];
    else if (event.key === 'Home') next = keys[0];
    else if (event.key === 'End') next = keys[keys.length - 1];
    else if (event.key === 'Delete') { event.preventDefault(); closeFile(tab.dataset.tab); return; }
    if (next) { event.preventDefault(); openFile(next, { focusTab: true }); }
  });

  // ---- Cây thư mục (ARIA tree) ----
  const visibleItems = () => [...treeEl.querySelectorAll('[role="treeitem"]')].filter(item => !item.parentElement.closest('[aria-expanded="false"]'));
  function focusItem(item) {
    if (!item) return;
    for (const other of treeEl.querySelectorAll('[role="treeitem"]')) other.tabIndex = -1;
    item.tabIndex = 0;
    item.focus();
  }
  function toggle(item, expanded) {
    if (!item.hasAttribute('aria-expanded')) return;
    item.setAttribute('aria-expanded', String(expanded));
    item.querySelector('.tree-twisty').textContent = expanded ? '▾' : '▸';
  }
  treeEl.addEventListener('click', event => {
    const item = event.target.closest('[role="treeitem"]');
    if (!item) return;
    event.stopPropagation();
    if (item.hasAttribute('aria-expanded') && (!item.dataset.file || event.target.closest('.tree-twisty'))) {
      toggle(item, item.getAttribute('aria-expanded') !== 'true');
    }
    if (item.dataset.file) openFile(item.dataset.file);
    focusItem(item);
  });
  treeEl.addEventListener('keydown', event => {
    const item = event.target.closest('[role="treeitem"]');
    if (!item) return;
    const items = visibleItems();
    const index = items.indexOf(item);
    const expandable = item.hasAttribute('aria-expanded');
    const expanded = item.getAttribute('aria-expanded') === 'true';
    switch (event.key) {
      case 'ArrowDown': focusItem(items[index + 1]); break;
      case 'ArrowUp': focusItem(items[index - 1]); break;
      case 'Home': focusItem(items[0]); break;
      case 'End': focusItem(items[items.length - 1]); break;
      case 'ArrowRight':
        if (expandable && !expanded) toggle(item, true);
        else if (expandable) focusItem(item.querySelector('[role="treeitem"]'));
        break;
      case 'ArrowLeft':
        if (expandable && expanded) toggle(item, false);
        else focusItem(item.parentElement.closest('[role="treeitem"]'));
        break;
      case 'Enter':
      case ' ':
        if (item.dataset.file) openFile(item.dataset.file);
        else if (expandable) toggle(item, !expanded);
        break;
      default: return;
    }
    event.preventDefault();
  });
  const firstItem = treeEl.querySelector('[role="treeitem"]');
  if (firstItem) firstItem.tabIndex = 0;

  selectEl?.addEventListener('change', () => openFile(selectEl.value));

  // Mở trang không có deep link: giữ tiêu đề trang ở đầu, không cuộn tới bước 1.
  goStep(initialStep || 1, { reveal: Boolean(initialStep) });

  return {
    get step() { return state.step; },
    count: page.steps.length,
    goStep,
    destroy() {},
  };
}
