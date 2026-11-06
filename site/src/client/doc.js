// Layout Doc (bản 1a + badge/callout): các bước liền nhau, rail phải ≥ 1200px có sơ đồ ghim, mục lục, tự động kiểm tra.
import { codeBlock } from './code.js';
import { callouts, endSections, hero, imageCaption, lintList, pageHeader, setHeroFocus, stepBadges, stepHash, tldr } from './parts.js';
import { esc, reducedMotion } from './util.js';

function stepSection(data, page, step) {
  const file = step.file ? page.files[step.file] : null;
  const code = file?.lines ? codeBlock(page.id, file, { highlight: step.lines, lens: step.lines.length ? { n: step.n, title: step.title } : null, range: step.range }) : '';
  const image = step.img ? `<figure class="doc-step-image"><img src="${esc(step.img)}" alt="${esc(step.imgAlt)}" loading="lazy">${imageCaption(data, step.img)}</figure>` : '';
  return `<section class="doc-step" id="buoc-${step.n}" data-step="${step.n}" aria-labelledby="buoc-${step.n}-title">
    <span class="step-no" aria-hidden="true">${step.n}</span>
    <h3 id="buoc-${step.n}-title"><span><span class="visually-hidden">Bước ${step.n}: </span>${step.titleHtml}</span>${stepBadges(step)}</h3>
    <p class="step-text">${step.textHtml}</p>
    ${callouts(step.callouts)}
    ${code}${image}
    ${step.resultHtml ? `<p class="result">${step.resultHtml}</p>` : ''}
    <p class="source-link">Nguồn: <a href="${esc(step.source.href)}">${esc(step.source.file)}${step.source.heading ? ` · ${esc(step.source.heading)}` : ''}</a></p>
  </section>`;
}

export function renderDoc(data, page) {
  const tocEnd = [
    page.doHtml ? ['dodont', 'Đúng / Sai'] : null,
    ['lint', 'Tự động kiểm tra'],
    page.checklist ? ['check', 'Checklist bàn giao'] : null,
    ['verify', 'Kiểm chứng'],
    ['src', 'Nguồn Markdown'],
  ].filter(Boolean);
  return `<article class="doc" data-layout="doc">
    <div class="doc-main">
      ${pageHeader(page)}
      ${tldr(page)}
      <div class="doc-section doc-hero-inline">${hero(data, page, page.steps[0]?.focus ?? [])}</div>
      <section class="doc-section" aria-labelledby="steps-${page.id}">
        <h2 class="section-label" id="steps-${page.id}">Các bước</h2>
        ${page.steps.map(step => stepSection(data, page, step)).join('')}
      </section>
      ${endSections(data, page)}
    </div>
    <aside class="doc-rail" aria-label="Sơ đồ và mục lục">
      <div class="doc-rail-inner">
        ${page.hero ? `<div class="rail-box rail-hero">${hero(data, page, page.steps[0]?.focus ?? [], { mini: true })}</div>` : ''}
        <nav class="rail-box" aria-label="Mục lục trang"><p class="section-label">Mục lục</p>
          <ol class="toc">${page.steps.map(step => `<li><a href="${stepHash(page.id, step.n)}" data-toc="${step.n}">${step.n}. ${esc(step.title)}</a></li>`).join('')}
          ${tocEnd.map(([key, label]) => `<li><a href="#/${page.id}" data-anchor="${key}-${page.id}">${label}</a></li>`).join('')}</ol>
        </nav>
        <div class="rail-box"><p class="section-label">Tự động kiểm tra</p>${lintList(page)}</div>
      </div>
    </aside>
  </article>`;
}

export function mountDoc(root, data, page, initialStep) {
  let current = 0;
  // Khi đang cuộn tới bước được chọn (deep link, ← →), không để scroll spy ghi đè bước hiện tại.
  let lockUntil = 0;
  const sections = [...root.querySelectorAll('.doc-step')];
  const rail = root.querySelector('.doc-rail');

  function mark(n) {
    if (n === current) return;
    current = n;
    for (const section of sections) section.classList.toggle('current', Number(section.dataset.step) === n);
    for (const link of root.querySelectorAll('[data-toc]')) {
      if (Number(link.dataset.toc) === n) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    const step = page.steps[n - 1];
    if (step && rail) setHeroFocus(rail, step.focus);
  }

  const observer = new IntersectionObserver(entries => {
    if (performance.now() < lockUntil) return;
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) mark(Number(visible[0].target.dataset.step));
  }, { rootMargin: '-20% 0px -60% 0px' });
  sections.forEach(section => observer.observe(section));

  root.addEventListener('click', event => {
    const anchor = event.target.closest('[data-anchor]');
    if (!anchor) return;
    event.preventDefault();
    document.getElementById(anchor.dataset.anchor)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });

  let destroyed = false;

  function goStep(n, { focus = true, smooth = true } = {}) {
    const target = sections[n - 1];
    if (!target || destroyed) return;
    lockUntil = performance.now() + 1200;
    mark(n);
    target.scrollIntoView({ behavior: smooth && !reducedMotion() ? 'smooth' : 'auto', block: 'start' });
    if (focus) {
      const heading = target.querySelector('h3');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    history.replaceState(null, '', stepHash(page.id, n));
  }

  // Deep link: cuộn ngay, không animate (animation còn chạy sau khi đổi trang sẽ kéo lệch trang mới).
  if (initialStep) window.requestAnimationFrame(() => goStep(initialStep, { focus: false, smooth: false }));
  else mark(1);

  return {
    get step() { return current || 1; },
    count: page.steps.length,
    goStep,
    destroy() {
      destroyed = true;
      observer.disconnect();
    },
  };
}
