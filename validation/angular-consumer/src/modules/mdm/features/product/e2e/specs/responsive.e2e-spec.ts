import { test, expect } from '../../../../e2e/fixtures/api.fixture';

test('Core list owns scroll and keeps pagination inside the viewport', async ({ page, api }) => {
  await page.goto('/alpha/product');
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  await expect(page.locator('mat-paginator')).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight + 1);
  expect(overflow).toBe(false);
  const query = api.requests.find(request => request.url.pathname === '/api/alpha/products')?.url.searchParams;
  expect(query?.get('pageIndex')).toBe('0');
  await page.screenshot({ path: test.info().outputPath('list.png'), fullPage: true });
  await page.getByRole('link', { name: 'ALPHA-one', exact: true }).click();
  await expect(page.locator('detail')).toContainText('Chi tiết sản phẩm #ALPHA-one');
});

test('Core form fits narrow screens and keeps required controls visible', async ({ page, api }) => {
  await page.goto('/alpha/product/create');
  await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('form.png'), fullPage: true });
});
