import { test, expect } from '../../src/modules/mdm/e2e';

test('mounts the same public module twice with isolated HTTP and asset URLs', async ({ page, api }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  expect(api.requests.filter(request => request.url.pathname.includes('/products'))).toHaveLength(0);
  await page.getByRole('button', { name: 'Alpha', exact: true }).click();
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  await expect(page.getByRole('link', { name: 'Tài liệu module' })).toHaveAttribute('href', '/assets/alpha/documents/consumer.txt');
  await page.getByRole('button', { name: 'Beta', exact: true }).click();
  await expect(page.locator('sd-table')).toContainText('BETA-one');
  await expect(page.getByRole('link', { name: 'Tài liệu module' })).toHaveAttribute('href', '/assets/beta/documents/consumer.txt');
  for (const mount of ['alpha', 'beta']) {
    expect((await page.request.get('/assets/' + mount + '/documents/consumer.txt')).status()).toBe(200);
  }
  await page.getByRole('button', { name: 'Alpha', exact: true }).click();
  await expect(page.locator('sd-table')).toContainText('ALPHA-one');
  expect(errors).toEqual([]);
});
