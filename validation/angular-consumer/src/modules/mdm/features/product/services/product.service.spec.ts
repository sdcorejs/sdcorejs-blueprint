import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { provideMdmConfiguration } from '../../../configurations/provide-mdm-configuration';

describe('ProductService foundation HTTP contract', () => {
  let http: HttpTestingController;
  let service: ProductService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideMdmConfiguration({ apiHost: '/api/test', assetBaseUrl: '/assets/test' }), ProductService] });
    http = TestBed.inject(HttpTestingController); service = TestBed.inject(ProductService);
  });
  afterEach(() => http.verify());
  it('transmits zero-based page and trimmed keyword', () => {
    service.list({ pageIndex: 2, pageSize: 10, keyword: '  abc  ' }).subscribe();
    const request = http.expectOne(req => req.url === '/api/test/products');
    expect(request.request.params.get('pageIndex')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(request.request.params.get('keyword')).toBe('abc');
    request.flush({ items: [], total: 0 });
  });
  it('propagates API failure without fake empty success', () => {
    const error = vi.fn(); const next = vi.fn();
    service.detail('one').subscribe({ next, error });
    http.expectOne('/api/test/products/one').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 503 }));
    expect(next).not.toHaveBeenCalled();
  });
});
