import { test, expect, type Api } from '../../../../e2e/fixtures/api.fixture';

const latestListQuery = (api: Api) => api.requests.filter(request => request.url.pathname === '/api/alpha/products').at(-1)?.url.searchParams;
const quickSearchFilter = (term: string) => ({ operator: 'OR', data: [
  { field: 'code', operator: 'CONTAIN', data: term },
  { field: 'name', operator: 'CONTAIN', data: term },
] });

test('quick search preserves the code hyperlink without list detail or edit actions', async ({ page, api }) => {
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  const search = page.getByRole('textbox', { name: 'Tìm kiếm', exact: true });
  await search.fill('one');
  await search.press('Enter');
  await expect.poll(() => JSON.parse(latestListQuery(api)?.get('filters') ?? 'null')).toEqual([quickSearchFilter('one')]);
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
  await expect.poll(() => JSON.parse(latestListQuery(api)?.get('filters') ?? 'null')).toEqual([quickSearchFilter('no-such-product')]);
  await expect(page.locator('sd-table').getByRole('link')).toHaveCount(0);
  await expect(page.locator('sd-table')).toContainText('Không có kết quả phù hợp');
});

test('pagination sends the next zero-based page', async ({ page, api }) => {
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect.poll(() => latestListQuery(api)?.get('pageNumber')).toBe('1');
  await expect(page.locator('sd-table')).toContainText('ALPHA-21');
  await expect(page.locator('sd-table')).not.toContainText('ALPHA-one');
});

test('column filter combines with quick search and clearing restores the result', async ({ page, api }) => {
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect.poll(() => latestListQuery(api)?.get('pageNumber')).toBe('1');
  const codeFilter = page.locator('column-filter').first().getByRole('textbox');
  await codeFilter.fill('ALPHA-2');
  await codeFilter.press('Enter');
  const column = { field: 'code', operator: 'CONTAIN', data: 'ALPHA-2' };
  await expect.poll(() => JSON.parse(latestListQuery(api)?.get('filters') ?? 'null')).toEqual([column]);
  expect(latestListQuery(api)?.get('pageNumber')).toBe('0');
  await expect(page.locator('sd-table').getByRole('link')).toHaveCount(11);
  const search = page.getByRole('textbox', { name: 'Tìm kiếm', exact: true });
  await search.fill('29');
  await search.press('Enter');
  await expect.poll(() => JSON.parse(latestListQuery(api)?.get('filters') ?? 'null')).toEqual([column, quickSearchFilter('29')]);
  await expect(page.locator('sd-table').getByRole('link')).toHaveText(['ALPHA-29']);
  await codeFilter.fill('');
  await codeFilter.press('Enter');
  await search.fill('');
  await search.press('Enter');
  await expect.poll(() => JSON.parse(latestListQuery(api)?.get('filters') ?? 'null')).toEqual([]);
  await expect(page.locator('sd-table').getByRole('link')).toHaveCount(20);
});

test('server sort sends ASC/DESC orders and retains them while paging', async ({ page, api }) => {
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  const sort = page.getByRole('button', { name: 'Mã sản phẩm', exact: true });
  await sort.click();
  await expect.poll(() => JSON.parse(latestListQuery(api)?.get('orders') ?? 'null')).toEqual([{ field: 'code', direction: 'ASC' }]);
  await expect(page.locator('sd-table').getByRole('link').first()).toHaveText('ALPHA-10');
  await sort.click();
  await expect.poll(() => JSON.parse(latestListQuery(api)?.get('orders') ?? 'null')).toEqual([{ field: 'code', direction: 'DESC' }]);
  await expect(page.locator('sd-table').getByRole('link').first()).toHaveText('ALPHA-one');
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect.poll(() => latestListQuery(api)?.get('pageNumber')).toBe('1');
  expect(JSON.parse(latestListQuery(api)!.get('orders')!)).toEqual([{ field: 'code', direction: 'DESC' }]);
  await expect(page.locator('sd-table').getByRole('link').first()).toHaveText('ALPHA-50');
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
