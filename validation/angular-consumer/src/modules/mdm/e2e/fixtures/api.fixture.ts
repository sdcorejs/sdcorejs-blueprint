import { test as base, expect, type Route } from '@playwright/test';

type Product = { id: string; code: string; name: string; status: 'active' | 'inactive' };
export const permissions = ['LIST', 'DETAIL', 'CREATE', 'UPDATE'].map(action => 'MDM_PRODUCT_C_' + action);
export const product = (id = 'one', mount = 'alpha'): Product => ({ id, code: mount.toUpperCase() + '-' + id, name: mount + ' product ' + id, status: 'active' });
export interface Api {
  requests: Array<{ url: URL; method: string; body: unknown }>;
  permissions: string[];
  records: Map<string, Product>;
  detail?: (route: Route, id: string, mount: string) => Promise<void>;
  failSave: boolean;
  failList: boolean;
}
export const test = base.extend<{ api: Api; browserErrors: void }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use();
    expect(errors, 'Uncaught browser exceptions').toEqual([]);
  }, { auto: true }],
  api: async ({ page }, use) => {
    const api: Api = { requests: [], permissions: [...permissions], records: new Map(), failSave: false, failList: false };
    await page.route('**/api/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const body: unknown = request.postData() ? request.postDataJSON() : undefined;
      api.requests.push({ url, method, body });
      if (url.pathname === '/api/permissions') { await route.fulfill({ json: api.permissions }); return; }
      const [, , mount, resource, id] = url.pathname.split('/');
      if (resource !== 'products') { await route.fulfill({ status: 404 }); return; }
      if (method === 'GET' && id) {
        if (api.detail) { await api.detail(route, id, mount); return; }
        await route.fulfill({ json: api.records.get(mount + '/' + id) ?? product(id, mount) }); return;
      }
      if (method === 'GET') {
        if (api.failList) { await route.fulfill({ status: 503, json: { message: 'list unavailable' } }); return; }
        const keyword = url.searchParams.get('keyword') ?? '';
        const rows = Array.from({ length: 65 }, (_, index) => product(index === 0 ? 'one' : String(index + 1), mount)).filter(row => (row.code + row.name).includes(keyword));
        const start = Number(url.searchParams.get('pageIndex')) * Number(url.searchParams.get('pageSize'));
        await route.fulfill({ json: { items: rows.slice(start, start + Number(url.searchParams.get('pageSize'))), total: rows.length } }); return;
      }
      if (api.failSave) { await route.fulfill({ status: 503, json: { message: 'test failure' } }); return; }
      const saved = { ...(body as Omit<Product, 'id'>), id: id ?? 'created' };
      api.records.set(mount + '/' + saved.id, saved);
      await route.fulfill({ json: saved });
    });
    await use(api);
  },
});
export { expect };
