import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, type TestRequest } from '@angular/common/http/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SD_PERMISSION_CONFIGURATION, SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { routes } from '../../routes';
import { provideMdmConfiguration } from '../../../../configurations/provide-mdm-configuration';
import { DetailComponent } from '../../pages/detail/detail.component';
import type { ProductDto } from '../../services/product.model';

@Component({ template: 'idle', changeDetection: ChangeDetectionStrategy.OnPush })
class IdleComponent {}
const entity = (id: string): ProductDto => ({ id, code: id.toUpperCase(), name: 'Product ' + id, status: 'active' });

describe('real lazy feature routes', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let allowed: string[];
  beforeEach(async () => {
    allowed = ['MDM_PRODUCT_C_DETAIL', 'MDM_PRODUCT_C_UPDATE'];
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => allowed } },
      provideRouter([
        { path: '', component: IdleComponent },
        { path: 'product', canActivate: [SdPermissionGuard], providers: [provideMdmConfiguration({ apiHost: '/api/test', assetBaseUrl: '/assets/test' })], children: routes },
      ], withComponentInputBinding()),
    ] });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create('/');
  });
  afterEach(() => http.verify());
  async function request(id: string): Promise<TestRequest> {
    let result!: TestRequest;
    await vi.waitFor(() => { result = http.expectOne('/api/test/products/' + id); });
    return result;
  }

  it('does not activate while pending and consumes preloaded data exactly once', async () => {
    const navigation = harness.navigateByUrl('/product/one/detail', DetailComponent);
    const pending = await request('one');
    expect(harness.routeNativeElement?.textContent).toBe('idle');
    pending.flush(entity('one'));
    const component = await navigation;
    expect(component.entity()).toEqual(entity('one'));
    expect(harness.routeNativeElement?.textContent).toContain('Product one');
    http.expectNone('/api/test/products/one');
  });

  it('reuses the component but replaces entity when only the path ID changes', async () => {
    const first = harness.navigateByUrl('/product/one/detail', DetailComponent);
    (await request('one')).flush(entity('one'));
    const original = await first;
    const next = harness.navigateByUrl('/product/two/detail', DetailComponent);
    (await request('two')).flush(entity('two'));
    const reused = await next;
    expect(reused).toBe(original);
    expect(reused.entity().id).toBe('two');
    expect(harness.routeNativeElement?.textContent).toContain('Product two');
    expect(harness.routeNativeElement?.textContent).not.toContain('Product one');
  });

  it('cancels HTTP subscription of the superseded navigation', async () => {
    const first = harness.navigateByUrl('/product/slow/detail');
    const slow = await request('slow');
    const second = harness.navigateByUrl('/product/fast/detail', DetailComponent);
    (await request('fast')).flush(entity('fast'));
    expect((await second).entity().id).toBe('fast');
    await first;
    expect(slow.cancelled).toBe(true);
  });

  it('denies update before any HTTP request when only detail permission exists', async () => {
    allowed = ['MDM_PRODUCT_C_DETAIL'];
    await harness.navigateByUrl('/product/one/update');
    http.expectNone('/api/test/products/one');
    expect(harness.routeNativeElement?.textContent).toBe('idle');
  });
});
