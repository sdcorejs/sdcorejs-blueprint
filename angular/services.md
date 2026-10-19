# Services và model

## Phạm vi

Code dưới đây minh họa configuration, service scope, typed HTTP và cách xây dựng resource URL. Nó không phải một generic CRUD framework và không định nghĩa API backend thật.

Nếu project đã dùng SdApiService hoặc helper tương thích từ Core/@sdcorejs/utils, tích hợp vào implementation đó. Không tạo thêm HTTP stack song song chỉ để sao chép mẫu.

## Helper dùng chung trong module

### src/modules/mdm/utils/resource-url.ts

<!-- example: src/modules/mdm/utils/resource-url.ts -->
```ts
/** Ghép các path segment riêng lẻ vào base URL; không nhận query string. */
export function resourceUrl(baseUrl: string, ...segments: string[]): string {
  const path = segments.map(segment => {
    if (segment.length === 0 || segment === '.' || segment === '..') {
      throw new Error('Resource URL requires non-empty path segments.');
    }
    return encodeURIComponent(segment);
  }).join('/');
  const base = baseUrl.replace(/\/+$/u, '');
  return path ? base + '/' + path : base || '/';
}
```

Mỗi đối số là một segment: resourceUrl(host, 'products', id). Không truyền 'products/' + id thành một segment. Query/paging dùng HttpParams.

Helper có hai consumer thật trong mẫu: BaseApiService và AssetService. Không tạo thêm helper trùng chức năng trong từng feature.

## Base API service

### src/modules/mdm/services/base-api.service.ts

<!-- example: src/modules/mdm/services/base-api.service.ts -->
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MDM_CONFIGURATION } from '../configurations/mdm.configuration';
import { resourceUrl } from '../utils/resource-url';

@Injectable()
export abstract class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly configuration = inject(MDM_CONFIGURATION);

  protected apiUrl(...segments: string[]): string {
    return resourceUrl(this.configuration.apiHost, ...segments);
  }
}
```

Base này chỉ cung cấp HttpClient/config và URL. Không đăng ký abstract base làm provider và không đưa toàn bộ CRUD/workflow vào base. Feature có thể không kế thừa nếu không có nhu cầu.

## Asset service của module

### src/modules/mdm/services/asset.service.ts

<!-- example: src/modules/mdm/services/asset.service.ts -->
```ts
import { inject, Injectable } from '@angular/core';
import { MDM_CONFIGURATION } from '../configurations/mdm.configuration';
import { resourceUrl } from '../utils/resource-url';

@Injectable()
export class AssetService {
  private readonly configuration = inject(MDM_CONFIGURATION);

  url(...segments: string[]): string {
    return resourceUrl(this.configuration.assetBaseUrl, ...segments);
  }
}
```

AssetService được đăng ký bởi provideMdmConfiguration, không phải root singleton toàn Portal. Ví dụ gọi trong module: assets.url('templates', 'import.xlsx') hoặc assets.url('features', 'product', 'templates', 'import.xlsx').

Đây là static resource URL, không thay API ký URL tải file private.

## Model/DTO của feature

### src/modules/mdm/features/product/services/api.model.ts

<!-- example: src/modules/mdm/features/product/services/api.model.ts -->
```ts
export type ProductStatus = 'active' | 'inactive';

export interface ProductDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
}

/** Hợp đồng minh họa: pageIndex bắt đầu từ 0. */
export interface ProductListRequest {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly keyword?: string;
}

export interface ProductListResponse {
  readonly items: ProductDto[];
  readonly total: number;
}

export interface ProductSaveRequest {
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
}
```

Mẫu DTO chỉ có các trường cần cho ví dụ. Không suy giới hạn field, quyền hoặc backend endpoint từ đó. Map riêng sang request thay vì gửi lại toàn bộ DTO có id.

## Feature API service

### src/modules/mdm/features/product/services/api.service.ts

<!-- example: src/modules/mdm/features/product/services/api.service.ts -->
```ts
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  ProductDto,
  ProductListRequest,
  ProductListResponse,
  ProductSaveRequest,
} from './api.model';

@Injectable()
export class ApiService extends BaseApiService {
  list(request: ProductListRequest): Observable<ProductListResponse> {
    let params = new HttpParams()
      .set('pageIndex', request.pageIndex)
      .set('pageSize', request.pageSize);
    const keyword = request.keyword?.trim();
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<ProductListResponse>(this.apiUrl('products'), { params });
  }

  get(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(this.apiUrl('products', id));
  }

  create(request: ProductSaveRequest): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl('products'), request);
  }

  update(id: string, request: ProductSaveRequest): Observable<ProductDto> {
    return this.http.put<ProductDto>(this.apiUrl('products', id), request);
  }
}
```

ApiService không đặt providedIn root; đăng ký ở route feature theo [Routing](routing.md). Tên file không lặp product vì đã có context trong đường dẫn; các type DTO giữ tên nghiệp vụ để dễ nhận diện.

Service trả lỗi HTTP cho consumer/interceptor xử lý, không đổi lỗi thành mảng rỗng hoặc success giả. Loading, dirty state, notification và navigation thuộc page/drawer theo UI patterns.

Đây là hợp đồng paging minh họa; adapter với sd-table phải đối chiếu type request/response của Core và API đích trong UI pattern tương ứng.

## Nghiệm thu

- Hai module instance với cấu hình khác nhau không dùng nhầm API/asset URL.
- Root injector không được vô tình chứa feature service.
- ID chứa ký tự đặc biệt được encode đúng một segment.
- Query được truyền qua HttpParams; body mutation giữ đúng SaveRequest.
- Lỗi HTTP được giữ để consumer xử lý.
