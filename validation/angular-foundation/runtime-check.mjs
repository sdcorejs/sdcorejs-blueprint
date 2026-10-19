import '@angular/compiler';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEnvironmentInjector, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';

class RecordingBackend {
  requests = [];
  handle(request) {
    const subject = new Subject();
    this.requests.push({
      request,
      respond(body) {
        subject.next(new HttpResponse({ body, status: 200 }));
        subject.complete();
      },
      fail(status) {
        subject.error(new HttpErrorResponse({ status, statusText: 'Simulated backend failure' }));
      },
    });
    return subject.asObservable();
  }
}

export async function verifyRuntime(dist) {
  const read = relative => import(pathToFileURL(path.join(dist, relative)).href);
  const entry = await read('src/modules/mdm/index.js');
  const { MDM_CONFIGURATION } = await read('src/modules/mdm/configurations/mdm.configuration.js');
  const { AssetService } = await read('src/modules/mdm/services/asset.service.js');
  const { ApiService } = await read('src/modules/mdm/features/product/services/api.service.js');
  const { appRoutes } = await read('src/app/app.routes.js');
  assert.deepEqual(Object.keys(entry).sort(), ['mdmRoutes', 'provideMdmConfiguration']);

  const backend = new RecordingBackend();
  const root = createEnvironmentInjector([{ provide: HttpClient, useValue: new HttpClient(backend) }], Injector.NULL);
  const owned = [root];
  const child = (providers, parent) => {
    const injector = createEnvironmentInjector(providers, parent);
    owned.push(injector);
    return injector;
  };

  try {
    const original = { apiHost: '/api/a/', assetBaseUrl: 'https://cdn.example.com/a/' };
    const moduleA = child([entry.provideMdmConfiguration(original)], root);
    const moduleB = child([entry.provideMdmConfiguration({ apiHost: '/api/b', assetBaseUrl: '/assets/b' })], root);
    const featureA = child([ApiService], moduleA);
    const featureB = child([ApiService], moduleB);
    original.apiHost = '/changed-after-registration';
    assert.equal(moduleA.get(MDM_CONFIGURATION).apiHost, '/api/a');
    assert.ok(Object.isFrozen(moduleA.get(MDM_CONFIGURATION)));
    assert.equal(root.get(MDM_CONFIGURATION, null), null);
    assert.equal(root.get(ApiService, null), null);
    assert.equal(moduleA.get(ApiService, null), null);

    const apiA = featureA.get(ApiService);
    const apiB = featureB.get(ApiService);
    const assetsA = moduleA.get(AssetService);
    const assetsB = moduleB.get(AssetService);
    assert.notEqual(assetsA, assetsB);
    assert.equal(assetsA.url('features', 'product', 'templates', 'import file.xlsx'),
      'https://cdn.example.com/a/features/product/templates/import%20file.xlsx');
    assert.equal(assetsB.url('icons', 'status.svg'), '/assets/b/icons/status.svg');

    let received;
    apiA.get('id/with ?#').subscribe(value => { received = value; });
    const get = backend.requests.at(-1);
    assert.equal(get.request.url, '/api/a/products/id%2Fwith%20%3F%23');
    const product = { id: 'record-1', code: 'SP-001', name: 'Sản phẩm A', status: 'active' };
    get.respond(product);
    assert.equal(received, product);

    apiB.list({ pageIndex: 0, pageSize: 20, keyword: '  máy lọc  ' }).subscribe();
    const list = backend.requests.at(-1);
    assert.equal(list.request.url, '/api/b/products');
    assert.equal(list.request.params.get('pageIndex'), '0');
    assert.equal(list.request.params.get('keyword'), 'máy lọc');
    list.respond({ items: [], total: 0 });

    const body = { code: 'SP-002', name: 'Sản phẩm B', status: 'active' };
    apiA.create(body).subscribe();
    const create = backend.requests.at(-1);
    assert.equal(create.request.method, 'POST');
    assert.equal(create.request.body, body);
    create.respond({ id: 'created-id', ...body });

    let error;
    apiB.update('record-2', body).subscribe({ error: value => { error = value; } });
    const update = backend.requests.at(-1);
    assert.equal(update.request.url, '/api/b/products/record-2');
    assert.equal(update.request.method, 'PUT');
    assert.equal(update.request.body, body);
    update.fail(503);
    assert.ok(error instanceof HttpErrorResponse);
    assert.equal(error.status, 503);

    for (const apiHost of ['', 'api/relative', '//other-origin/api', '/api?token=x', '/api?', '/api#']) {
      assert.throws(() => entry.provideMdmConfiguration({ apiHost, assetBaseUrl: '/assets/mdm' }));
    }
    const mounted = await appRoutes.find(route => route.path === 'mdm').loadChildren();
    const mountedModule = mounted[0];
    const routeModule = child(mountedModule.providers, root);
    const mdmRoutes = mountedModule.children;
    const productRoutes = await mdmRoutes.find(route => route.path === 'product').loadChildren();
    const routeFeature = child(productRoutes[0].providers, routeModule);
    routeFeature.get(ApiService).get('via-lazy-boundary').subscribe();
    const lazy = backend.requests.at(-1);
    assert.equal(lazy.request.url, '/api/mdm/products/via-lazy-boundary');
    lazy.respond(product);
    for (const route of productRoutes[0].children) {
      assert.equal(typeof await route.loadComponent(), 'function');
    }
    assert.equal(routeModule.get(AssetService).url('images', 'sample.svg'), '/assets/mdm/images/sample.svg');
    return { dependencyInjection: 'PASS', httpContract: 'PASS', lazyRouteBoundary: 'PASS' };
  } finally {
    for (const injector of owned.reverse()) injector.destroy();
  }
}
