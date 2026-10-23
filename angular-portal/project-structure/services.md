# Services và model

## Phạm vi

Code dưới đây minh họa configuration, service scope, typed HTTP và cách xây dựng resource URL. Nó không phải một generic CRUD framework và không định nghĩa API backend thật.

Nếu project đã dùng SdApiService hoặc helper tương thích từ Core/@sdcorejs/utils, tích hợp vào implementation đó. Không tạo thêm HTTP stack song song chỉ để sao chép mẫu.

Resolver phụ thuộc service của đúng entity, ví dụ ProductService/CustomerService hiện hữu trong consumer. Service entity sở hữu cách tải dữ liệu, endpoint, mapping và cache; resolver gọi detail(id) rồi xử lý contract điều hướng. Không inject generic ApiService/SdApiService/HttpClient trực tiếp trong resolver. Các block API bên dưới minh họa typed HTTP và DI; tái sử dụng service entity đã có, không tạo thêm lớp bọc chỉ để khớp tên ví dụ.

## Convention tên file, class và hàm

- File nằm trong feature/services. Model và service đặt tên theo entity: `<entity>.model.ts`, `<entity>.service.ts`, ví dụ `product.model.ts` / `product.service.ts`, `customer.model.ts` / `customer.service.ts`. Class/type mang tên entity: ProductService, ProductDto.
- Kiểu bất đồng bộ theo contract service của consumer: `Promise` hoặc `Observable` đều được. Không bắt buộc chuyển đổi chỉ để khớp Blueprint; mẫu HTTP bên dưới dùng `Observable` vì đang minh họa Angular HttpClient. Pipe detail giữ kiểu phù hợp với service và dùng cùng `async` trong template.
- Model request dùng hậu tố Req, response dùng Res: ProductListReq, ProductListRes, ProductSaveReq. DTO entity vẫn là ProductDto; không bắt buộc tạo thêm kiểu Res nếu response chính là DTO hoặc không có body.
- Mặc định gom const, enum, type/interface, DTO và Req/Res liên quan của entity vào cùng file `<entity>.model.ts`. Với feature có ít model, một file là đủ; có thể nhóm các khai báo liên quan trong file để dễ đọc.
- Có thể tách file khi nội dung lớn hoặc một nhóm có trách nhiệm/phạm vi sử dụng riêng rõ ràng. Tách theo nhóm liên quan, không mặc định tạo một file cho mỗi model/const/enum hay thêm các thư mục constants/enums/models riêng.
- Hàm CRUD: list(req), detail(id), create(req), update(id, req), delete(idOrIds). Tên detail thống nhất với route :id/detail; HTTP GET bên trong implementation vẫn là get của HTTP client.
- Hàm tác vụ đặt lowerCamelCase theo nghiệp vụ: approve(reqOrReqs), reject(reqOrReqs). Chỉ thêm tác vụ mà consumer thực sự có.
- delete nhận một ID hoặc mảng ID; approve/reject nhận một Req hoặc mảng Req. Dữ liệu riêng của từng bản ghi nằm trong Req tương ứng, không buộc cả lô dùng chung một payload.

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
  readonly #configuration = inject(MDM_CONFIGURATION);

  url(...segments: string[]): string {
    return resourceUrl(this.#configuration.assetBaseUrl, ...segments);
  }
}
```

AssetService được đăng ký bởi provideMdmConfiguration, không phải root singleton toàn Portal. Ví dụ gọi trong module: assets.url('templates', 'import.xlsx') hoặc assets.url('features', 'product', 'templates', 'import.xlsx').

Đây là static resource URL, không thay API ký URL tải file private.

## Model/DTO của feature

File model cũng chứa const và enum của feature khi có nhu cầu. Mẫu dưới đây dùng ít kiểu dữ liệu nên giữ chung một file; chỉ bổ sung các khai báo mà nghiệp vụ thực tế cần.

### src/modules/mdm/features/product/services/product.model.ts

<!-- example: src/modules/mdm/features/product/services/product.model.ts -->
```ts
export type ProductStatus = 'active' | 'inactive';

export const PRODUCT_STATUS_OPTIONS = [
  { id: 'active', name: 'Đang hoạt động' },
  { id: 'inactive', name: 'Ngừng hoạt động' },
] satisfies Array<{ id: ProductStatus; name: string }>;

export interface ProductDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
}

/** Hợp đồng minh họa: pageIndex bắt đầu từ 0. */
export interface ProductListReq {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly keyword?: string;
}

export interface ProductListRes {
  readonly items: ProductDto[];
  readonly total: number;
}

export interface ProductSaveReq {
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
}
```

Mẫu DTO chỉ có các trường cần cho ví dụ. Không suy giới hạn field, quyền hoặc backend endpoint từ đó. Map riêng sang request thay vì gửi lại toàn bộ DTO có id.

## Feature API service

### src/modules/mdm/features/product/services/product.service.ts

<!-- example: src/modules/mdm/features/product/services/product.service.ts -->
```ts
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  ProductDto,
  ProductListReq,
  ProductListRes,
  ProductSaveReq,
} from './product.model';

@Injectable()
export class ProductService extends BaseApiService {
  list(req: ProductListReq): Observable<ProductListRes> {
    let params = new HttpParams()
      .set('pageIndex', req.pageIndex)
      .set('pageSize', req.pageSize);
    const keyword = req.keyword?.trim();
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<ProductListRes>(this.apiUrl('products'), { params });
  }

  detail(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(this.apiUrl('products', id));
  }

  create(req: ProductSaveReq): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl('products'), req);
  }

  update(id: string, req: ProductSaveReq): Observable<ProductDto> {
    return this.http.put<ProductDto>(this.apiUrl('products', id), req);
  }
}
```

ProductService không đặt providedIn root; đăng ký ở route feature theo [Routes](routes.md). Service import model từ product.model.ts; class và các type giữ tên nghiệp vụ để dễ nhận diện.

Service trả lỗi HTTP cho consumer/interceptor xử lý, không đổi lỗi thành mảng rỗng hoặc success giả. Với detail/update có ID, resolver hoặc cơ chế tương đương gọi service của entity để tải dữ liệu trước activation và chuyển lỗi theo [Routes](routes.md). Page nhận entity đã tải, không gọi lại cùng API khi khởi tạo. Loading điều hướng thuộc Portal/route; loading tác vụ, dirty state, notification và điều hướng sau lưu thuộc page/drawer theo UI patterns.

Đây là hợp đồng paging minh họa; adapter với sd-table phải đối chiếu type request/response của Core và API đích trong UI pattern tương ứng.

## Delete, approve và reject cho một hoặc nhiều bản ghi

Đây là mã giả bổ sung vào service entity, chưa nằm trong các block HTTP được kiểm chứng ở trên. Model đặt trong product.model.ts, các hàm service đặt trong product.service.ts. ID kiểu string, các field note/reason và response void chỉ là minh họa; contract của consumer quyết định kiểu ID, dữ liệu tác vụ và kết quả thực tế.

```ts
// product.model.ts
export interface ProductApproveReq {
  id: string;
  note?: string;
}

export interface ProductRejectReq {
  id: string;
  reason: string;
}

// Chữ ký các hàm trong ProductService ở product.service.ts.
delete(ids: string | string[]): Observable<void>;
approve(req: ProductApproveReq | ProductApproveReq[]): Observable<void>;
reject(req: ProductRejectReq | ProductRejectReq[]): Observable<void>;
```

```ts
productService.delete('product-1');
productService.delete(['product-1', 'product-2']);

productService.approve({ id: 'product-1', note: 'Đã kiểm tra' });
productService.approve([{ id: 'product-1' }, { id: 'product-2' }]);

productService.reject({ id: 'product-1', reason: 'Thiếu thông tin' });
productService.reject([
  { id: 'product-1', reason: 'Thiếu thông tin' },
  { id: 'product-2', reason: 'Cần điều chỉnh' },
]);
```

Các lời gọi trên chỉ minh họa tham số; caller phải subscribe hoặc chuyển Observable sang Promise theo cơ chế đang dùng để thực thi request.

- Service chuẩn hóa đầu vào đơn thành mảng nội bộ, chặn mảng rỗng trước khi gửi và giữ dữ liệu của từng phần tử; không sửa mảng/object của caller.
- Cách gửi bulk, HTTP method, endpoint và payload phụ thuộc API consumer. Chữ ký nhận mảng không tự bảo đảm backend có transaction cho cả lô. Nếu API chỉ hỗ trợ từng bản ghi, cần định nghĩa rõ cách xử lý và báo kết quả khi một phần thất bại.
- Response có payload dùng tên theo tác vụ như ProductDeleteRes, ProductApproveRes, ProductRejectRes. Giữ kiểu kết quả ổn định giữa lời gọi đơn và mảng theo contract đã chọn; không tự đổi kiểu theo số phần tử. Chỉ trả void khi API không có payload và không có kết quả từng bản ghi cần chuyển cho caller.
- Với kết quả thành công/thất bại từng phần, Res phải giữ đủ kết quả theo ID của API để caller xử lý. Không báo thành công toàn bộ khi còn bản ghi thất bại.
- Với consumer dùng Core, UI dùng chuỗi quyền riêng cho từng tác vụ, ví dụ 'MDM_PRODUCT_C_DELETE', 'MDM_PRODUCT_C_APPROVE', 'MDM_PRODUCT_C_REJECT'. Backend kiểm tra quyền và trạng thái nghiệp vụ của từng bản ghi; service không tự gộp approve/reject thành update chung.

## Nghiệm thu

- Hai module instance với cấu hình khác nhau không dùng nhầm API/asset URL.
- Root injector không được vô tình chứa feature service.
- ID chứa ký tự đặc biệt được encode đúng một segment.
- Query được truyền qua HttpParams; body mutation giữ đúng SaveReq.
- Lỗi HTTP được giữ để consumer xử lý.
