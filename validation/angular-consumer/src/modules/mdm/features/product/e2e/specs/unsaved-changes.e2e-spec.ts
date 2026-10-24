import type { Page } from '@playwright/test';
import { test, expect } from '../../../../e2e/fixtures/api.fixture';

const editors = [
  { mode: 'create', url: '/alpha/product/create', backUrl: '/alpha/product', initialName: '' },
  { mode: 'update', url: '/alpha/product/one/update', backUrl: '/alpha/product/one/detail', initialName: 'alpha product one' },
] as const;

async function enterEditor(page: Page, mode: 'create' | 'update'): Promise<void> {
  await page.goto('/alpha/product');
  if (mode === 'create') {
    await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
  } else {
    await page.getByRole('link', { name: 'ALPHA-one', exact: true }).click();
    await page.getByRole('button', { name: 'Cập nhật', exact: true }).click();
  }
}

async function expectUnloadProtection(page: Page, dirty: boolean): Promise<void> {
  // Core adds/removes the listener in an Angular effect; wait for the input render to settle.
  await expect.poll(() => page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  })).toBe(dirty);
}

for (const editor of editors) {
  test(editor.mode + ': page Back cancels without losing draft, then discards without saving', async ({ page, api }) => {
    await page.clock.install();
    await enterEditor(page, editor.mode);
    await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Unsaved draft');
    const dialogs: string[] = [];
    const cancelled = page.waitForEvent('dialog').then(async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
    await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
    await cancelled;
    await expect(page).toHaveURL(editor.url);
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Unsaved draft');
    await expect(page.getByRole('status').filter({ hasText: 'Đang tải trang' })).toHaveCount(0);
    await page.clock.runFor(301);
    const discarded = page.waitForEvent('dialog').then(async dialog => { dialogs.push(dialog.type()); await dialog.accept(); });
    await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
    await discarded;
    await expect(page).toHaveURL(editor.backUrl);
    expect(dialogs).toEqual(['confirm', 'confirm']);
    expect(api.requests.filter(request => request.method !== 'GET')).toHaveLength(0);
  });

  test(editor.mode + ': browser Back can be cancelled and retried, and Forward restores a clean editor', async ({ page, api }) => {
    await enterEditor(page, editor.mode);
    const name = page.getByRole('textbox', { name: 'Tên sản phẩm' });
    await name.fill('History draft');
    const dialogs: string[] = [];
    page.once('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
    await page.goBack();
    await expect(page).toHaveURL(editor.url);
    await expect(name).toHaveValue('History draft');
    page.once('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.accept(); });
    await page.goBack();
    await expect(page).toHaveURL(editor.backUrl);
    await page.goForward();
    await expect(page).toHaveURL(editor.url);
    await expect(name).toHaveValue(editor.initialName);
    expect(dialogs).toEqual(['confirm', 'confirm']);
    expect(api.requests.filter(request => request.method !== 'GET')).toHaveLength(0);
  });

  test(editor.mode + ': module navigation shares the guard and tears down the previous registration', async ({ page, api }) => {
    await page.clock.install();
    await enterEditor(page, editor.mode);
    await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Alpha draft');
    const dialogs: string[] = [];
    const cancelled = page.waitForEvent('dialog').then(async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
    await page.getByRole('button', { name: 'Beta', exact: true }).click();
    await cancelled;
    await expect(page).toHaveURL(editor.url);
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Alpha draft');
    await expect(page.getByRole('status').filter({ hasText: 'Đang tải trang' })).toHaveCount(0);
    await page.clock.runFor(301);
    const discarded = page.waitForEvent('dialog').then(async dialog => { dialogs.push(dialog.type()); await dialog.accept(); });
    await page.getByRole('button', { name: 'Beta', exact: true }).click();
    await discarded;
    await expect(page).toHaveURL('/beta/product');
    if (editor.mode === 'create') {
      await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    } else {
      await page.getByRole('link', { name: 'BETA-one', exact: true }).click();
      await page.getByRole('button', { name: 'Cập nhật', exact: true }).click();
    }
    await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Beta draft');
    const betaCancelled = page.waitForEvent('dialog').then(async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
    await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
    await betaCancelled;
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Beta draft');
    expect(dialogs).toEqual(['confirm', 'confirm', 'confirm']);
    expect(api.requests.filter(request => request.method !== 'GET')).toHaveLength(0);
  });

  test(editor.mode + ': browser Forward cancellation restores the history position', async ({ page, api }) => {
    await enterEditor(page, editor.mode);
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(page).toHaveURL('/');
    await page.goBack();
    await expect(page).toHaveURL(editor.url);
    await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Forward draft');
    const dialogs: string[] = [];
    page.once('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
    await page.goForward();
    await expect(page).toHaveURL(editor.url);
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Forward draft');
    page.once('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.accept(); });
    await page.goForward();
    await expect(page).toHaveURL('/');
    await page.goBack();
    await expect(page).toHaveURL(editor.url);
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue(editor.initialName);
    expect(dialogs).toEqual(['confirm', 'confirm']);
  });

  test(editor.mode + ': failed save keeps both route and unload protection active', async ({ page, api }) => {
    await enterEditor(page, editor.mode);
    if (editor.mode === 'create') await page.getByRole('textbox', { name: 'Mã sản phẩm' }).fill('NEW-001');
    await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Failed save draft');
    api.failSave = true;
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Không thể lưu' })).toBeVisible();
    const dialog = page.waitForEvent('dialog');
    const back = page.getByRole('button', { name: 'Quay lại', exact: true }).click();
    const confirmation = await dialog;
    expect(confirmation.type()).toBe('confirm');
    await confirmation.dismiss();
    await back;
    await expect(page).toHaveURL(editor.url);
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Failed save draft');
    await expectUnloadProtection(page, true);
    expect(api.requests.filter(request => request.method !== 'GET')).toHaveLength(1);
  });

  test(editor.mode + ': reload uses native beforeunload and cancellation retains the draft', async ({ page, api }) => {
    await enterEditor(page, editor.mode);
    await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Reload draft');
    await expectUnloadProtection(page, true);
    const cancelledDialog = page.waitForEvent('dialog');
    // Trigger a real reload without waiting for a load event that cancellation prevents.
    const cancelledReload = page.evaluate(() => window.location.reload());
    const first = await cancelledDialog;
    expect(first.type()).toBe('beforeunload');
    await first.dismiss();
    await cancelledReload;
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Reload draft');
    const acceptedDialog = page.waitForEvent('dialog');
    const acceptedReload = page.reload();
    const second = await acceptedDialog;
    expect(second.type()).toBe('beforeunload');
    await second.accept();
    await acceptedReload;
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue(editor.initialName);
    expect(api.requests.filter(request => request.method !== 'GET')).toHaveLength(0);
  });

  test(editor.mode + ': closing the browser tab runs beforeunload and honours cancel/discard', async ({ page, api }) => {
    await enterEditor(page, editor.mode);
    await page.getByRole('textbox', { name: 'Tên sản phẩm' }).fill('Tab draft');
    await expectUnloadProtection(page, true);
    const cancelledDialog = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const first = await cancelledDialog;
    expect(first.type()).toBe('beforeunload');
    await first.dismiss();
    expect(page.isClosed()).toBe(false);
    await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Tab draft');
    const acceptedDialog = page.waitForEvent('dialog');
    const closed = page.waitForEvent('close');
    await page.close({ runBeforeUnload: true });
    const second = await acceptedDialog;
    expect(second.type()).toBe('beforeunload');
    await second.accept();
    await closed;
    expect(api.requests.filter(request => request.method !== 'GET')).toHaveLength(0);
  });

  test(editor.mode + ': pristine and reverted forms leave or close without prompting', async ({ page, api }) => {
    const dialogs: string[] = [];
    page.on('dialog', async dialog => { dialogs.push(dialog.type()); await dialog.accept(); });
    await enterEditor(page, editor.mode);
    await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
    await expect(page).toHaveURL(editor.backUrl);
    // Page Back is a new navigation; enter the editor again using the actual UI.
    await enterEditor(page, editor.mode);
    const name = page.getByRole('textbox', { name: 'Tên sản phẩm' });
    await name.fill('temporary change');
    await name.fill(editor.initialName);
    await expectUnloadProtection(page, false);
    const closed = page.waitForEvent('close');
    await page.close({ runBeforeUnload: true });
    await closed;
    expect(dialogs).toEqual([]);
  });
}
