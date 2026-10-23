import { test, expect } from '../../../../e2e/fixtures/api.fixture';

test('create validates, preserves draft on failed save, then saves only SaveReq fields', async ({ page, api }) => {
  await page.clock.install();
  await page.goto('/alpha/product/create');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('bắt buộc');
  expect(api.requests.filter(request => request.method === 'POST')).toHaveLength(0);
  await page.getByRole('textbox', { name: 'Mã sản phẩm' }).fill('NEW-001');
  await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('New product');
  api.failSave = true;
  // SdButton 22.3.1 intentionally throttles repeated clicks for 300 ms.
  await page.clock.runFor(301);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Không thể lưu');
  await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('New product');
  api.failSave = false;
  await page.clock.runFor(301);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page).toHaveURL(/\/alpha\/product\/created\/detail$/);
  await expect(page.locator('detail')).toContainText('New product');
  expect(api.requests.filter(request => request.method === 'POST').at(-1)?.body).toEqual({ code: 'NEW-001', name: 'New product', status: 'active' });
});

test('update receives preload, locks business identifier and saves edited data', async ({ page, api }) => {
  await page.goto('/alpha/product/one/update');
  await expect(page.getByRole('textbox', { name: 'Mã sản phẩm' })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('alpha product one');
  expect(api.requests.filter(request => request.url.pathname.endsWith('/products/one'))).toHaveLength(1);
  await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Updated product');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page).toHaveURL(/\/one\/detail$/);
  await expect(page.locator('detail')).toContainText('Updated product');
  expect(api.requests.find(request => request.method === 'PUT')?.body).toEqual({ code: 'ALPHA-one', name: 'Updated product', status: 'active' });
});

test('dirty guard cancels leaving, then discards when confirmed', async ({ page, api }) => {
  await page.clock.install();
  await page.goto('/alpha/product/create');
  await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Unsaved draft');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Unsaved draft');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.runFor(301);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page).toHaveURL(/\/alpha\/product$/);
  expect(api.requests.filter(request => request.method === 'POST')).toHaveLength(0);
});

test('status wrapper opens by keyboard and changes the submitted enum', async ({ page, api }) => {
  await page.goto('/alpha/product/one/update');
  const select = page.getByRole('combobox', { name: 'Trạng thái' });
  await select.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('option', { name: 'Ngừng hoạt động' }).click();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page).toHaveURL(/\/one\/detail$/);
  expect(api.requests.find(request => request.method === 'PUT')?.body).toMatchObject({ status: 'inactive' });
});

test('reverting an edit to the loaded value does not prompt for an unchanged draft', async ({ page, api }) => {
  const dialogs: string[] = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto('/alpha/product/one/update');
  const name = page.getByRole('textbox', { name: 'Tên sản phẩm' });
  await name.fill('temporary change');
  await name.fill('alpha product one');
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page).toHaveURL(/\/one\/detail$/);
  expect(dialogs).toEqual([]);
});
