import { test, expect } from '../../../../e2e/fixtures/api.fixture';

test('quick search preserves the code hyperlink without list detail or edit actions', async ({ page, api }) => {
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  const search = page.getByRole('textbox', { name: 'Tìm kiếm', exact: true });
  await search.fill('one');
  await search.press('Enter');
  await expect.poll(() => api.requests.some(request => request.url.searchParams.get('keyword') === 'one')).toBe(true);
  const code = page.locator('sd-table').getByRole('link', { name: 'ALPHA-one', exact: true });
  await expect(code).toHaveAttribute('href', '/alpha/product/one/detail');
  await expect(page.locator('sd-table').getByRole('link')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Chi tiết|Cập nhật|Chỉnh sửa/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Chi tiết|Cập nhật|Chỉnh sửa/ })).toHaveCount(0);
  await code.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('detail')).toContainText('alpha product one');
});

test('list-only permission retains plain identifiers without detail links or create actions', async ({ page, api }) => {
  api.permissions = ['MDM_PRODUCT_C_LIST'];
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  await expect(page.locator('sd-table').getByRole('link')).toHaveCount(0);
  await expect(page.locator('sd-table').getByText('ALPHA-one', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Tạo mới', exact: true })).toHaveCount(0);
});

test('empty search is an empty result, not a failed request', async ({ page, api }) => {
  await page.goto('/alpha/product');
  const search = page.getByRole('textbox', { name: 'Tìm kiếm', exact: true });
  await search.fill('no-such-product');
  await search.press('Enter');
  await expect.poll(() => api.requests.some(request => request.url.searchParams.get('keyword') === 'no-such-product')).toBe(true);
  await expect(page.locator('sd-table').getByRole('link')).toHaveCount(0);
  await expect(page.locator('sd-table')).toContainText('Không có kết quả phù hợp');
});

test('pagination sends the next zero-based page', async ({ page, api }) => {
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect.poll(() => api.requests.some(request => request.url.searchParams.get('pageIndex') === '1')).toBe(true);
  await expect(page.locator('sd-table')).toContainText('ALPHA-21');
  await expect(page.locator('sd-table')).not.toContainText('ALPHA-one');
});

test('list HTTP failure renders Core error instead of an empty success', async ({ page, api }) => {
  api.failList = true;
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table').getByRole('alert')).toContainText('Không thể tải dữ liệu');
  await expect(page.locator('sd-table')).not.toContainText('Chưa có dữ liệu');
  api.failList = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
});
