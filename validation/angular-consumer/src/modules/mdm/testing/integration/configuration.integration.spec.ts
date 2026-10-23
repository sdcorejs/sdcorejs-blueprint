import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideMdmConfiguration } from '../../index';
import { MDM_CONFIGURATION } from '../../configurations/mdm.configuration';
import { AssetService } from '../../services/asset.service';
import { ProductService } from '../../features/product/services/product.service';

describe('module/feature provider ownership', () => {
  it('isolates two mounts and never installs child providers in root', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const root = TestBed.inject(EnvironmentInjector);
    const original = { apiHost: '/api/alpha/', assetBaseUrl: '/assets/alpha/' };
    const a = createEnvironmentInjector([provideMdmConfiguration(original)], root);
    const b = createEnvironmentInjector([provideMdmConfiguration({ apiHost: '/api/beta', assetBaseUrl: '/assets/beta' })], root);
    const fa = createEnvironmentInjector([ProductService], a);
    const fb = createEnvironmentInjector([ProductService], b);
    try {
      original.apiHost = '/mutated';
      expect(a.get(MDM_CONFIGURATION).apiHost).toBe('/api/alpha');
      expect(Object.isFrozen(a.get(MDM_CONFIGURATION))).toBe(true);
      expect(root.get(MDM_CONFIGURATION, null)).toBeNull();
      expect(root.get(ProductService, null)).toBeNull();
      expect(a.get(ProductService, null)).toBeNull();
      expect(fa.get(ProductService)).not.toBe(fb.get(ProductService));
      expect(fa.get(AssetService)).toBe(a.get(AssetService));
      expect(a.get(AssetService)).not.toBe(b.get(AssetService));
      expect(b.get(AssetService).url('documents', 'consumer.txt')).toBe('/assets/beta/documents/consumer.txt');
      fa.get(ProductService).detail('id/with ?#').subscribe();
      fb.get(ProductService).detail('b').subscribe();
      const http = TestBed.inject(HttpTestingController);
      http.expectOne('/api/alpha/products/id%2Fwith%20%3F%23').flush({ id: 'a' });
      http.expectOne('/api/beta/products/b').flush({ id: 'b' });
      http.verify();
    } finally { fb.destroy(); fa.destroy(); b.destroy(); a.destroy(); }
  });
});
