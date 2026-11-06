// Khởi động site: header, sidebar, router hash (#/<id>, #/<id>/buoc-<n>), phím ← →.
import { bindCodeActions } from './code.js';
import { mountDoc, renderDoc } from './doc.js';
import { mountExplorer, renderExplorer } from './explorer.js';
import { renderHome } from './home.js';
import { bindChecklist } from './parts.js';
import { arrowsBelongToFocus, esc, fold } from './util.js';

const data = window.BP_DATA;
const app = document.getElementById('app');
let controller = null;
let currentId = null;

function shell() {
  app.innerHTML = `<header class="topbar">
      <button type="button" class="menu-button" aria-label="Mở danh sách trang" aria-expanded="false" aria-controls="sidebar">☰</button>
      <a class="brand" href="#/"><span class="brand-mark" aria-hidden="true">BP</span><span class="brand-name">SDCoreJS Blueprint</span></a>
      <ul class="stack-tabs" aria-label="Nhóm Blueprint">
        <li><a class="stack-tab" aria-current="page" href="#/">Angular Portal</a></li>
        <li><span class="stack-tab" aria-disabled="true">NestJS · sắp có</span></li>
        <li><span class="stack-tab" aria-disabled="true">React · sắp có</span></li>
      </ul>
      <span class="topbar-spacer"></span>
      <a class="gh-link" href="${esc(data.githubBlob)}angular-portal/README.md">Markdown trên GitHub ↗</a>
    </header>
    <div class="shell">
      <nav class="sidebar" id="sidebar" aria-label="Danh sách trang">
        <div class="search"><label class="visually-hidden" for="page-search">Tìm trang</label><input id="page-search" type="search" placeholder="Tìm trang…" autocomplete="off"></div>
        <a class="nav-home" href="#/">Trang chủ</a>
        <div class="nav-groups">${data.groups.map(group => `<div class="nav-group" data-group="${esc(group.id)}">
          <p class="nav-group-title">${esc(group.no)} ${esc(group.name)}</p>
          <ul class="nav-list">${group.pages.map(page => `<li data-search="${esc(fold([page.no, page.title, data.pages[page.id].desc, ...data.pages[page.id].tldrText].join(' ')))}"><a class="nav-link" href="#/${page.id}" data-nav="${page.id}"><span class="no">${esc(page.no)}</span><span>${esc(page.title)}</span></a></li>`).join('')}</ul>
        </div>`).join('')}</div>
        <p class="nav-empty" hidden>Không có trang phù hợp.</p>
      </nav>
      <div class="backdrop"></div>
      <main class="main" id="main" tabindex="-1"></main>
    </div>`;
}

function setDrawer(open) {
  const sidebar = document.getElementById('sidebar');
  const button = app.querySelector('.menu-button');
  sidebar.classList.toggle('open', open);
  app.querySelector('.backdrop').classList.toggle('open', open);
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? 'Đóng danh sách trang' : 'Mở danh sách trang');
  if (open) document.getElementById('page-search').focus();
}

function bindShell() {
  app.querySelector('.menu-button').addEventListener('click', () => setDrawer(!document.getElementById('sidebar').classList.contains('open')));
  app.querySelector('.backdrop').addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('sidebar').classList.contains('open')) {
      setDrawer(false);
      app.querySelector('.menu-button').focus();
    }
  });
  document.getElementById('sidebar').addEventListener('click', event => {
    if (event.target.closest('a')) setDrawer(false);
  });
  const search = document.getElementById('page-search');
  search.addEventListener('input', () => {
    const terms = fold(search.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const group of app.querySelectorAll('.nav-group')) {
      let groupShown = 0;
      for (const item of group.querySelectorAll('[data-search]')) {
        const match = terms.every(term => item.dataset.search.includes(term));
        item.hidden = !match;
        if (match) groupShown++;
      }
      group.hidden = groupShown === 0;
      shown += groupShown;
    }
    app.querySelector('.nav-empty').hidden = shown > 0;
  });
  const main = document.getElementById('main');
  bindCodeActions(main, data);
  bindChecklist(main);

  document.addEventListener('keydown', event => {
    if (!controller || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (arrowsBelongToFocus(event.target)) return;
    const next = controller.step + (event.key === 'ArrowRight' ? 1 : -1);
    if (next < 1 || next > controller.count) return;
    event.preventDefault();
    controller.goStep(next, { focus: true });
  });
}

function parseHash() {
  const match = /^#\/([\w-]+)?(?:\/buoc-(\d+))?\/?$/.exec(location.hash || '#/');
  if (!match) return { id: null, step: null, invalid: true };
  return { id: match[1] ?? null, step: match[2] ? Number(match[2]) : null };
}

function setActiveNav(id) {
  for (const link of app.querySelectorAll('[data-nav]')) {
    if (link.dataset.nav === id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const home = app.querySelector('.nav-home');
  if (!id) home.setAttribute('aria-current', 'page');
  else home.removeAttribute('aria-current');
  const page = id ? data.pages[id] : null;
  app.querySelector('.gh-link').href = page ? page.githubHref : `${data.githubBlob}angular-portal/README.md`;
}

function route() {
  const { id, step, invalid } = parseHash();
  const main = document.getElementById('main');
  if (id && id === currentId && controller) {
    if (step && step !== controller.step) controller.goStep(Math.min(step, controller.count));
    return;
  }
  controller?.destroy();
  controller = null;
  // Dừng smooth scroll của trang trước (← → trên layout Doc) để không kéo lệch trang mới.
  window.scrollTo({ top: window.scrollY, behavior: 'instant' });
  currentId = id;
  setActiveNav(id);
  if (invalid || (id && !data.pages[id])) {
    document.title = 'Không tìm thấy · SDCoreJS Blueprint';
    main.innerHTML = `<div class="notfound"><h1 id="page-title" tabindex="-1">Không tìm thấy trang</h1><p style="margin-top:8px">Đường dẫn <code>${esc(location.hash)}</code> không khớp trang nào. <a href="#/">Về trang chủ</a>.</p></div>`;
  } else if (!id) {
    document.title = 'SDCoreJS Blueprint · Angular Portal';
    main.innerHTML = renderHome(data);
  } else {
    const page = data.pages[id];
    document.title = `${page.no} ${page.title} · SDCoreJS Blueprint`;
    const target = step ? Math.min(Math.max(step, 1), page.steps.length) : null;
    main.innerHTML = page.layout === 'explorer' ? renderExplorer(data, page) : renderDoc(data, page);
    // Trang mới luôn bắt đầu từ đầu; deep link tự cuộn tới bước sau khi mount.
    window.scrollTo(0, 0);
    controller = page.layout === 'explorer' ? mountExplorer(main, data, page, target) : mountDoc(main, data, page, target);
  }
  if (!controller) window.scrollTo(0, 0);
  main.querySelector('#page-title')?.focus({ preventScroll: true });
}

shell();
bindShell();
window.addEventListener('hashchange', route);
route();
app.removeAttribute('aria-busy');
