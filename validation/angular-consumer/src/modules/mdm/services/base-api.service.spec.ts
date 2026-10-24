import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import type { PagingReq } from '@sdcorejs/utils/models';
import { BaseApiService } from './base-api.service';
import { provideMdmConfiguration } from '../configurations/provide-mdm-configuration';

@Injectable()
class MappingProbe extends BaseApiService {
  params<T>(req: PagingReq<T>) { return this.buildPagingReq(req); }
}

describe('module PagingReq transport mapping', () => {
  let service: MappingProbe;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(),
      provideMdmConfiguration({ apiHost: '/api/test', assetBaseUrl: '/assets/test' }), MappingProbe] });
    service = TestBed.inject(MappingProbe);
  });

  it('preserves nested filters, false/zero, operand metadata and encoded text without mutation', () => {
    type Record = { enabled: boolean; amount: number; limit: number; name: string; status: string };
    const req: PagingReq<Record> = {
      pageNumber: 0, pageSize: 20,
      filters: [{ operator: 'AND', data: [
        { field: 'enabled', operator: 'EQUAL', data: false },
        { operator: 'OR', data: [
          { field: 'amount', operator: 'EQUAL', data: 0 },
          { field: 'amount', operator: 'GREATER_THAN', data: 'limit', dataType: 'field' },
        ] },
        { field: 'name', operator: 'CONTAIN', data: 'máy lọc & nước + #1' },
        { field: 'status', operator: 'IN', data: ['active', 'inactive'] },
      ] }],
      orders: [{ field: 'amount', direction: 'DESC' }, { field: 'name', direction: 'ASC' }],
      fields: ['name', 'amount'],
    };
    const before = structuredClone(req);
    const freeze = (value: unknown): void => {
      if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    };
    freeze(req);
    const wire = new URLSearchParams(service.params(req).toString());
    expect(wire.get('pageNumber')).toBe('0');
    expect(wire.get('pageSize')).toBe('20');
    for (const key of ['filters', 'orders', 'fields'] as const) {
      expect(JSON.parse(wire.get(key)!)).toEqual(before[key]);
    }
    expect(req).toEqual(before);
  });

  it('omits absent options without inventing defaults or serializing undefined', () => {
    expect(service.params({}).keys()).toEqual([]);
  });

  it('preserves explicitly empty arrays and zero paging values', () => {
    const wire = service.params({ pageNumber: 0, pageSize: 0, filters: [], orders: [], fields: [] });
    expect(wire.get('pageNumber')).toBe('0');
    expect(wire.get('pageSize')).toBe('0');
    for (const key of ['filters', 'orders', 'fields']) expect(wire.get(key)).toBe('[]');
  });
});
