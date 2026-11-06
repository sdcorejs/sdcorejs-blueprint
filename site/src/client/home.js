// Trang chủ: hero, Đọc theo công việc, Quy tắc chung, Kiểm chứng, danh sách trang theo nhóm.
import { esc } from './util.js';

export function renderHome(data) {
  const home = data.home;
  const first = data.order[0];
  const link = id => `<a href="#/${id}">${esc(data.pages[id].no)} ${esc(data.pages[id].title)}</a>`;
  return `<div class="home">
    <section class="home-hero">
      <p class="eyebrow">${esc(home.eyebrow).toUpperCase()}</p>
      <h1 id="page-title" tabindex="-1">${esc(home.title)}</h1>
      <p class="lead">${home.leadHtml}</p>
      <div class="home-actions">
        <a class="button primary" href="#/${first}">Bắt đầu đọc</a>
        <a class="button" href="#/bp-tree">Cây thư mục</a>
      </div>
    </section>
    <section aria-labelledby="jobs-title">
      <h2 id="jobs-title">Đọc theo công việc</h2>
      <div class="jobs">${home.jobs.map(job => `<div class="card job"><h3>${esc(job.title)}</h3><p>${job.textHtml}</p><p class="job-links">${job.pages.map(link).join('')}</p></div>`).join('')}</div>
    </section>
    <div class="home-two">
      <section class="card" aria-labelledby="rules-title">
        <h2 id="rules-title">Quy tắc chung</h2>
        <ul class="home-rules">${home.rules.items.map(item => `<li>${item}</li>`).join('')}</ul>
        <p class="source-link" style="margin-top:10px">Nguyên văn từ <a href="${esc(home.rules.source.href)}">${esc(home.rules.source.file)} · ${esc(home.rules.source.heading)}</a></p>
      </section>
      <section class="card home-verify" aria-labelledby="verify-title">
        <h2 id="verify-title">Kiểm chứng</h2>
        ${home.verification.paragraphs.map(text => `<p>${text}</p>`).join('')}
        <p class="version-chips"><code>Angular ${esc(data.versions.angular)}</code><code>TypeScript ${esc(data.versions.typescript)}</code><code>Core ${esc(data.versions.core)}</code></p>
        <p class="source-link" style="margin-top:10px">Phiên bản đọc từ <code>validation/</code>. <a href="#/bp-lint">Xem ESLint &amp; kiểm chứng →</a></p>
      </section>
    </div>
    <section aria-labelledby="all-title">
      <h2 id="all-title">Tất cả trang</h2>
      <div class="all-pages">${data.groups.map(group => `<div><p class="section-label">${esc(group.no)} · ${esc(group.name)}</p><ul>${group.pages.map(page => `<li><a href="#/${page.id}"><span class="no">${esc(page.no)}</span><span class="t">${esc(page.title)}</span></a></li>`).join('')}</ul></div>`).join('')}</div>
    </section>
  </div>`;
}
