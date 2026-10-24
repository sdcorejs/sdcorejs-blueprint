import { test, expect, product } from '../../../../e2e/fixtures/api.fixture';

test('preloads before activation, receives one entity request, and survives reload', async ({ page, api }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  api.detail = async (route, id, mount) => { await pending; await route.fulfill({ json: product(id, mount) }); };
  await page.goto('/alpha/product/one/detail');
  await expect.poll(() => api.requests.filter(request => request.url.pathname.endsWith('/products/one')).length).toBe(1);
  await expect(page.locator('detail')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Đang tải trang');
  release();
  await expect(page.locator('detail')).toContainText('Chi tiết sản phẩm #ALPHA-one');
  await expect(page.locator('sd-view')).toContainText(['alpha product one', 'active']);
  expect(api.requests.filter(request => request.url.pathname.endsWith('/products/one'))).toHaveLength(1);
  await page.reload();
  await expect(page.locator('detail')).toContainText('alpha product one');
  expect(api.requests.filter(request => request.url.pathname.endsWith('/products/one'))).toHaveLength(2);
});

test('detail permission does not grant update and denied routes never load entity', async ({ page, api }) => {
  api.permissions = ['MDM_PRODUCT_C_DETAIL'];
  await page.goto('/alpha/product/one/detail');
  await expect(page.locator('detail')).toContainText('alpha product one');
  await expect(page.getByRole('button', { name: 'Cập nhật', exact: true })).toHaveCount(0);
  await page.goto('/alpha/product/two/update');
  await expect(page).toHaveURL(/\/error\/forbidden$/);
  expect(api.requests.filter(request => request.url.pathname.endsWith('/products/two'))).toHaveLength(0);
  await expect(page.locator('update')).toHaveCount(0);
});

for (const [status, kind] of [[404, 'not-found'], [401, 'unauthorized'], [403, 'forbidden'], [503, 'unavailable']] as const) {
  test('maps HTTP ' + status + ' before detail activation', async ({ page, api }) => {
    api.detail = async route => { await route.fulfill({ status, json: { message: 'fixture' } }); };
    await page.goto('/alpha/product/one/detail');
    await expect(page).toHaveURL(new RegExp('/error/' + kind + '$'));
    await expect(page.getByRole('alert')).toHaveText(kind);
    await expect(page.locator('detail')).toHaveCount(0);
  });
}

test('network failure is unavailable, not not-found', async ({ page, api }) => {
  api.detail = async route => { await route.abort('failed'); };
  await page.goto('/alpha/product/one/detail');
  await expect(page).toHaveURL(/\/error\/unavailable$/);
});

test('wrong entity ID is rejected before activation', async ({ page, api }) => {
  api.detail = async route => { await route.fulfill({ json: product('wrong') }); };
  await page.goto('/alpha/product/one/detail');
  await expect(page).toHaveURL(/\/error\/not-found$/);
  await expect(page.locator('detail')).toHaveCount(0);
});

test('a stalled preload times out into the host error flow', async ({ page, api }) => {
  await page.clock.install();
  api.detail = async () => {};
  await page.goto('/alpha/product/one/detail');
  await expect.poll(() => api.requests.some(request => request.url.pathname.endsWith('/products/one'))).toBe(true);
  await page.clock.runFor(10_001);
  await expect(page).toHaveURL(/\/error\/unavailable$/);
  await expect(page.locator('detail')).toHaveCount(0);
});

test('cancelled slow navigation cannot overwrite a later mount', async ({ page, api }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  api.detail = async (route, id, mount) => { await pending; await route.fulfill({ json: product(id, mount) }).catch(() => {}); };
  await page.goto('/alpha/product/slow/detail');
  await expect.poll(() => api.requests.some(request => request.url.pathname.endsWith('/products/slow'))).toBe(true);
  await page.getByRole('button', { name: 'Beta', exact: true }).click();
  await expect(page).toHaveURL(/\/beta\/product$/);
  release();
  await expect(page.locator('sd-table')).toContainText('BETA-one');
  await expect(page.locator('detail')).toHaveCount(0);
});

test('list navigation and browser history display the correct ID without duplicate GETs', async ({ page, api }) => {
  await page.goto('/alpha/product/one/detail');
  await expect(page.locator('detail')).toContainText('alpha product one');
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.locator('sd-table').getByRole('link', { name: 'ALPHA-2', exact: true }).click();
  await expect(page.locator('detail')).toContainText('alpha product 2');
  await page.goBack();
  await page.goBack();
  await expect(page.locator('detail')).toContainText('alpha product one');
  expect(api.requests.filter(request => request.url.pathname.endsWith('/products/2'))).toHaveLength(1);
});
