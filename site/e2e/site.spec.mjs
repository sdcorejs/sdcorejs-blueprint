// Nghiệm thu site: 20 trang mở bằng deep link, bàn phím cho stepper/cây/tab, 390px không cuộn ngang, contrast ≥ 4.5:1.
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const raw = fs.readFileSync(path.join(dist, 'data.js'), 'utf8');
const data = JSON.parse(raw.slice(raw.indexOf('=') + 1).trim().replace(/;$/u, ''));
const explorerId = data.order.find(id => data.pages[id].layout === 'explorer');
const docId = data.order.find(id => data.pages[id].layout === 'doc' && data.pages[id].steps.length > 1);

/** Trả về các đoạn chữ có contrast dưới ngưỡng WCAG AA trong phạm vi selector. */
async function contrastFailures(page, scope = 'body') {
  return page.evaluate(selector => {
    const parse = value => {
      const match = /rgba?\(([^)]+)\)/u.exec(value);
      if (!match) return null;
      const parts = match[1].split(/[\s,/]+/u).filter(Boolean).map(Number);
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
    };
    const channel = value => {
      const v = value / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const luminance = color => 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    const blend = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
    const background = element => {
      const layers = [];
      for (let node = element; node; node = node.parentElement) {
        const color = parse(getComputedStyle(node).backgroundColor);
        if (color && color.a > 0) {
          layers.push(color);
          if (color.a >= 1) break;
        }
      }
      return layers.reverse().reduce((bottom, top) => blend(top, bottom), { r: 255, g: 255, b: 255, a: 1 });
    };
    const failures = [];
    const root = document.querySelector(selector);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!node.textContent.trim() || seen.has(element)) continue;
      seen.add(element);
      if (element.closest('.visually-hidden, [hidden], noscript')) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || Number(style.opacity) === 0 || !element.getClientRects().length) continue;
      const bg = background(element);
      const fg = blend(parse(style.color), bg);
      const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
      const ratio = (light + 0.05) / (dark + 0.05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      // Icon file (TS, <>, #) là đồ họa trang trí aria-hidden, lặp lại phần mở rộng trong tên file: không tính.
      if (element.closest('.ficon')) continue;
      if (ratio < (large ? 3 : 4.5)) failures.push(`${ratio.toFixed(2)} “${node.textContent.trim().slice(0, 40)}” <${element.tagName.toLowerCase()} class="${element.className}"> fg ${style.color} bg rgb(${[bg.r, bg.g, bg.b].map(Math.round).join(', ')})`);
    }
    return failures;
  }, scope);
}

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

for (const id of data.order) {
  const info = data.pages[id];
  test(`${info.no} ${id}: deep link, không cuộn ngang, contrast`, async ({ page }, testInfo) => {
    const step = Math.min(2, info.steps.length);
    await page.goto(`#/${id}/buoc-${step}`);
    await expect(page.locator('h1')).toHaveText(info.title);
    await expect(page).toHaveTitle(new RegExp(info.no));
    const current = info.layout === 'explorer' ? `.ex-step.current[data-step="${step}"]` : `.doc-step.current[data-step="${step}"]`;
    await expect(page.locator(current)).toHaveCount(1);
    await expect(page).toHaveURL(new RegExp(`#/${id}/buoc-${step}$`));
    expect(await noHorizontalScroll(page), 'cuộn ngang ngoài khối code').toBe(true);
    if (testInfo.project.name === 'desktop') {
      expect(await contrastFailures(page)).toEqual([]);
      await page.evaluate(() => localStorage.setItem('bp-code-theme', '"dark"'));
      await page.reload();
      await expect(page.locator('.code-theme').first()).toHaveAttribute('data-code-theme', 'dark');
      expect(await contrastFailures(page, '.main')).toEqual([]);
    }
  });
}

/** Vị trí tiêu đề trang so với header sticky và khung Explorer. */
async function titleLayout(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.topbar').getBoundingClientRect();
    const title = document.querySelector('h1').getBoundingClientRect();
    const frame = document.querySelector('.ex');
    const left = document.querySelector('.ex-left');
    return {
      titleTop: Math.round(title.top),
      titleBottom: Math.round(title.bottom),
      headerBottom: Math.round(header.bottom),
      leftTop: left ? Math.round(left.getBoundingClientRect().top) : null,
      leftScrollTop: left ? left.scrollTop : 0,
      frameScrollTop: frame ? frame.scrollTop : 0,
      windowScrollY: Math.round(window.scrollY),
    };
  });
}

/** Phần tử nằm trọn trong vùng nhìn thấy: dưới header và trong khung cuộn chứa nó (nếu có). */
async function fullyVisible(locator) {
  return locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    let top = document.querySelector('.topbar').getBoundingClientRect().bottom;
    let bottom = window.innerHeight;
    for (let node = element.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/(auto|scroll|hidden|clip)/u.test(style.overflowY) && node !== document.body && node !== document.documentElement) {
        const box = node.getBoundingClientRect();
        top = Math.max(top, box.top);
        bottom = Math.min(bottom, box.bottom);
      }
    }
    return rect.top >= top - 1 && rect.bottom <= bottom + 1;
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1100, height: 640 }]) {
  test(`tiêu đề trang không bị cắt khi mở trang (${viewport.width}×${viewport.height})`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mobile có test riêng');
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    for (const id of data.order) {
      await page.goto(`#/${id}`);
      await expect(page.locator('h1')).toHaveText(data.pages[id].title);
      const layout = await titleLayout(page);
      expect(layout.frameScrollTop, `${id}: khung Explorer bị cuộn`).toBe(0);
      expect(layout.leftScrollTop, `${id}: cột bước bị cuộn khi mở trang`).toBe(0);
      expect(layout.windowScrollY, `${id}: trang bị cuộn khi mở trang`).toBe(0);
      expect(layout.titleTop, `${id}: tiêu đề nằm dưới header`).toBeGreaterThanOrEqual(layout.headerBottom);
      if (layout.leftTop !== null) expect(layout.titleTop, `${id}: tiêu đề bị cắt bởi cột bước`).toBeGreaterThanOrEqual(layout.leftTop);
      await expect.poll(() => fullyVisible(page.locator('h1')), { message: `${id}: tiêu đề không hiện đủ` }).toBe(true);
    }
  });
}

test('deep link tới bước cuối hiện đủ tiêu đề bước, không cuộn khung Explorer', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  if (testInfo.project.name === 'desktop') await page.setViewportSize({ width: 1280, height: 720 });
  for (const id of data.order) {
    const last = data.pages[id].steps.length;
    await page.goto(`#/${id}/buoc-${last}`);
    await expect(page.locator('h1')).toHaveText(data.pages[id].title);
    const head = data.pages[id].layout === 'explorer'
      ? page.locator(`#ex-step-head-${last}`)
      : page.locator(`#buoc-${last}-title`);
    await expect.poll(() => fullyVisible(head), { message: `${id}: bước ${last} không hiện đủ` }).toBe(true);
    expect((await titleLayout(page)).frameScrollTop, `${id}: khung Explorer bị cuộn`).toBe(0);
  }
});

test('← → giữ tiêu đề bước trong vùng nhìn thấy', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'phím dành cho desktop');
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const id of data.order.filter(key => data.pages[key].layout === 'explorer')) {
    await page.goto(`#/${id}`);
    await page.locator('h1').click();
    for (let n = 2; n <= data.pages[id].steps.length; n++) {
      await page.keyboard.press('ArrowRight');
      await expect(page).toHaveURL(new RegExp(`#/${id}/buoc-${n}$`));
      await expect.poll(() => fullyVisible(page.locator(`#ex-step-head-${n}`)), { message: `${id}: bước ${n}` }).toBe(true);
    }
    expect((await titleLayout(page)).frameScrollTop, `${id}: khung Explorer bị cuộn`).toBe(0);
  }
});

/**
 * Vùng cuộn (overflow-x auto/scroll/hidden) có nội dung rộng hơn khung. Khối code, tab editor và cây ASCII
 * được phép cuộn ngang trong khối của nó (accessibility.md: code block dài cuộn trong khối).
 */
async function horizontalOverflow(page) {
  return page.evaluate(() => {
    const allowed = '.code-scroll, .ex-code, .ex-tabs, .hero-tree, .hero-compare-scroll';
    const out = [];
    for (const element of document.querySelectorAll('#app *')) {
      // .visually-hidden cố ý cắt nội dung 1px cho trình đọc màn hình.
      if (!element.getClientRects().length || element.closest(allowed) || element.closest('.visually-hidden')) continue;
      const style = getComputedStyle(element);
      // Tên file/đường dẫn dài cố ý cắt bằng dấu “…”: không phải cuộn ngang.
      if (style.textOverflow === 'ellipsis' || !/(auto|scroll|hidden|clip)/u.test(style.overflowX)) continue;
      if (element.scrollWidth > element.clientWidth + 1) out.push(`.${element.className} tràn ${element.scrollWidth - element.clientWidth}px`);
    }
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push('trang cuộn ngang');
    return out;
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1100, height: 720 }, { width: 960, height: 720 }, { width: 390, height: 844 }]) {
  test(`không cuộn ngang trong cột bước, rail, sidebar ở mọi bước (${viewport.width}px)`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'đã đặt viewport trong test');
    test.setTimeout(240_000);
    await page.setViewportSize(viewport);
    for (const id of data.order) {
      for (let n = 1; n <= data.pages[id].steps.length; n++) {
        await page.goto(`#/${id}/buoc-${n}`);
        await expect(page.locator('h1')).toHaveText(data.pages[id].title);
        expect(await horizontalOverflow(page), `${id} bước ${n}`).toEqual([]);
      }
    }
  });
}

test('font tự host: Be Vietnam Pro cho chữ, JetBrains Mono cho code, có subset tiếng Việt, không gọi host ngoài', async ({ page, baseURL }) => {
  const external = [];
  page.on('request', request => {
    if (!request.url().startsWith(baseURL) && !request.url().startsWith('data:')) external.push(request.url());
  });
  await page.goto(`#/${docId}`);
  await expect(page.locator('h1')).toHaveText(data.pages[docId].title);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const family = selector => getComputedStyle(document.querySelector(selector)).fontFamily.split(',')[0].replace(/["']/gu, '').trim();
    const loaded = [...document.fonts].filter(face => face.status === 'loaded');
    return {
      body: family('.page-desc'),
      label: family('.section-label'),
      code: family('.code-lines'),
      // U+1EA0–1EF9: chữ Việt có dấu (ạ, ế, ữ…) nằm trong subset vietnamese.
      vietnameseSans: loaded.some(face => face.family.replace(/["']/gu, '') === 'Be Vietnam Pro' && /U\+1EA0/iu.test(face.unicodeRange)),
      vietnameseMono: [...document.fonts].some(face => face.family.replace(/["']/gu, '') === 'JetBrains Mono' && /U\+1EA0/iu.test(face.unicodeRange)),
      sansReady: document.fonts.check('16px "Be Vietnam Pro"', 'Tiếng Việt có dấu: ạ ế ữ'),
      monoReady: document.fonts.check('13px "JetBrains Mono"', 'const ữ = 1;'),
    };
  });
  expect(fonts).toEqual({
    body: 'Be Vietnam Pro',
    label: 'Be Vietnam Pro',
    code: 'JetBrains Mono',
    vietnameseSans: true,
    vietnameseMono: true,
    sansReady: true,
    monoReady: true,
  });
  expect(external, 'site gọi tài nguyên ngoài lúc chạy').toEqual([]);
});

test('trang chủ và trang không tồn tại', async ({ page }) => {
  await page.goto('#/');
  await expect(page.locator('h1')).toContainText('Angular Portal');
  await expect(page.locator('.all-pages a')).toHaveCount(data.order.length);
  expect(await noHorizontalScroll(page)).toBe(true);
  expect(await contrastFailures(page)).toEqual([]);
  await page.goto('#/khong-co');
  await expect(page.locator('h1')).toHaveText('Không tìm thấy trang');
});

test('phím ← → đổi bước, bỏ qua khi đang gõ', async ({ page }) => {
  for (const id of [explorerId, docId]) {
    await page.goto(`#/${id}`);
    await page.locator('h1').click();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`#/${id}/buoc-2$`));
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`#/${id}/buoc-1$`));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#page-search').fill('abc');
  await page.locator('#page-search').press('ArrowRight');
  await expect(page).toHaveURL(new RegExp(`#/${docId}/buoc-1$`));
});

test('cây thư mục ARIA và tab dùng được bằng bàn phím', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'cây thư mục thành dropdown dưới 1100px');
  await page.goto(`#/${explorerId}`);
  const tree = page.getByRole('tree');
  const items = tree.getByRole('treeitem');
  await items.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  // Tới file cuối cùng và mở bằng Enter.
  await page.keyboard.press('End');
  const last = items.last();
  await expect(last).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(last).toHaveAttribute('aria-selected', 'true');
  const tabs = page.getByRole('tab');
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  const count = await tabs.count();
  expect(count).toBeGreaterThanOrEqual(2);
  // ← → trên tablist đổi tab đang mở; Delete đóng tab.
  await page.locator('[role="tab"][aria-selected="true"]').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toBeFocused();
  await page.keyboard.press('Delete');
  await expect(tabs).toHaveCount(count - 1);
  // Accordion bước có aria-expanded.
  await expect(page.locator('.ex-step-head[aria-expanded="true"]')).toHaveCount(1);
  // ← → không đổi bước khi focus trong cây.
  await items.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(new RegExp(`#/${explorerId}/buoc-1$`));
});

test('checklist và theme code được lưu', async ({ page }) => {
  const id = data.order.find(key => data.pages[key].checklist);
  await page.goto(`#/${id}`);
  const first = page.locator('[data-check="0"]');
  await first.click();
  await expect(first).toHaveAttribute('aria-checked', 'true');
  await page.locator('[data-theme-set="light"]:visible').first().click();
  await page.reload();
  await expect(page.locator('[data-check="0"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.checklist-count')).toHaveText(`1/${data.pages[id].checklist.items.length}`);
  await expect(page.locator('.code-theme').first()).toHaveAttribute('data-code-theme', 'light');
});

test('tìm trang không cần gõ dấu', async ({ page }, testInfo) => {
  await page.goto('#/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Mở danh sách trang' }).click();
  await page.locator('#page-search').fill('phan quyen');
  const visible = page.locator('.nav-list li:not([hidden])');
  await expect(visible.filter({ hasText: 'Phân quyền: G/C/A' })).toHaveCount(1);
  expect(await visible.count()).toBeLessThan(data.order.length);
  await page.locator('#page-search').fill('khong co trang nay');
  await expect(page.locator('.nav-empty')).toBeVisible();
});
