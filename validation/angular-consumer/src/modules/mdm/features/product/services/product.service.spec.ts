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
  it('transmits the full PagingReq using the module base mapping', () => {
    const filters = [{ field: 'name', operator: 'CONTAIN', data: 'máy lọc & nước + #1' }] as const;
    service.list({ pageNumber: 2, pageSize: 10, filters: [...filters], orders: [{ field: 'code', direction: 'DESC' }], fields: ['id', 'name'] }).subscribe();
    const request = http.expectOne(req => req.url === '/api/test/products');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(JSON.parse(request.request.params.get('filters')!)).toEqual(filters);
    expect(JSON.parse(request.request.params.get('orders')!)).toEqual([{ field: 'code', direction: 'DESC' }]);
    expect(JSON.parse(request.request.params.get('fields')!)).toEqual(['id', 'name']);
    expect(request.request.params.has('keyword')).toBe(false);
    expect(request.request.params.has('pageIndex')).toBe(false);
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
