# Routes

## Quy tắc

- Portal → module public entry → feature routes → page.
- List ở path rỗng; create không có ID; detail/update có :id.
- ID là định danh dữ liệu, khác mã hiển thị.
- Route detail/update có ID phải resolve entity thành công trước khi kích hoạt page. Page nhận entity đã tải qua route data hoặc contract tương đương của consumer.
- Kiểm tra quyền vào từng route bằng guard/cơ chế consumer đang dùng. Nếu dùng data.permission, phải có guard thực sự đọc và thực thi metadata đó.
- Lỗi tải entity phải chuyển tới trang lỗi hoặc flow xác thực tương ứng của consumer; không kích hoạt page với entity rỗng.
- Component đích lazy load, không eager import page từ Portal.
- Drawer thuộc components; không tự tạo page/route drawer nếu đặc tả chưa yêu cầu URL riêng.
- Guard/permission/unsaved changes phải theo contract project. Các block nền tảng bên dưới minh họa path/lazy loading/DI; phần ghép guard và resolver vào consumer là bắt buộc theo contract dưới đây, chưa được các block đó triển khai.

## Contract vào route có ID

Trình tự bắt buộc cho cả truy cập URL trực tiếp, reload, điều hướng từ danh sách và đổi ID khi route được reuse:

```text
URL + ID
  → xác thực và kiểm tra quyền vào route
  → tải entity theo ID
  → xác nhận entity hợp lệ và quyền theo bản ghi nếu có
  → kích hoạt page với entity đã tải

Bị từ chối hoặc tải lỗi → flow/trang lỗi tương ứng, không kích hoạt page đích
```

Với Angular Router, dùng resolver cho dữ liệu bắt buộc trước activation, ví dụ resolve: { entity: entityResolver }. Guard quyền route chạy trước resolver; nếu guard từ chối thì không gọi API tải entity. Một resolver hoặc navigation error handler của consumer trả RedirectCommand khi cần đổi đích điều hướng. Không resolve thành null/undefined hoặc nuốt lỗi thành success giả.

Resolver phải inject đúng service sở hữu entity, ví dụ ProductService cho product hoặc CustomerService cho customer, và gọi phương thức tải theo ID của service đó. Dùng service hiện hữu của consumer; không inject generic ApiService/SdApiService/HttpClient để tự dựng endpoint trong resolver, không tạo thêm service bọc chỉ để khớp tên ví dụ. Chi tiết HTTP, endpoint, mapping và cache thuộc service entity.

Entity có thể được lấy từ API hoặc cache hợp lệ thông qua service entity theo chính sách consumer. Kết quả phải đúng ID đang điều hướng và còn phù hợp với quyền/trạng thái hiện tại. Không hiển thị entity của ID trước trong lúc chuyển ID.

### Permission theo consumer

- Consumer dùng data.permission: khai báo quyền riêng của từng tác vụ trên route và gắn guard đọc metadata đó, trực tiếp bằng canActivate hoặc thông qua canActivateChild đã được cấu hình ở route cha.
- Consumer dùng Core: gán trực tiếp chuỗi mã quyền vào data.permission, ví dụ 'MDM_PRODUCT_C_DETAIL' và 'MDM_PRODUCT_C_UPDATE'; không cần tạo object productPermissions, enum hay wrapper chỉ cho cấu hình routes. Mã phải khớp danh mục quyền của consumer và convention MODULE_ENTITY_TYPE_ACTION; C là quyền frontend trong ví dụ này.
- Với Core đang dùng trong portal-template (@sdcorejs/angular 22.3.1), SdPermissionGuard.canActivate tải quyền; canActivateChild mới kiểm tra data.permission. Tái sử dụng canActivateChild: [SdPermissionGuard] ở route cha đã cấu hình; không coi canActivate: [SdPermissionGuard] trên route đích là đủ để kiểm tra quyền.
- Consumer dùng cơ chế khác: giữ guard, policy hoặc middleware điều hướng hiện hữu; không dựng thêm hệ thống permission song song chỉ để theo ví dụ Blueprint.
- Quyền detail và update phải được đánh giá riêng. Có quyền xem không tự suy ra có quyền cập nhật. Kiểm tra cả khi nhập URL trực tiếp, không chỉ khi hiển thị menu/nút.
- Guard route không đọc entity do resolver của cùng lần điều hướng chưa trả về. Quyền phụ thuộc bản ghi phải được API tải entity hoặc bước kiểm tra sau tải xử lý trước khi resolver cho phép activation. Backend tiếp tục kiểm tra quyền đọc/cập nhật thực tế.

Hình dạng tích hợp dưới đây là mã giả cho consumer dùng Core và đã có canActivateChild: [SdPermissionGuard] ở route cha. entityResolver là resolver của feature; mã quyền minh họa phải thay bằng chuỗi quyền thật của consumer:

```ts
{
  path: ':id/detail',
  data: { permission: 'MDM_PRODUCT_C_DETAIL' },
  resolve: { entity: entityResolver },
  runGuardsAndResolvers: 'paramsChange',
  loadComponent: () => import('./pages/detail/detail.component')
    .then(module => module.DetailComponent),
}
```

Route :id/update áp dụng cùng contract, dùng data: { permission: 'MDM_PRODUCT_C_UPDATE' } và page UpdateComponent. Nếu guard đã được đăng ký ở route cha, giữ cơ chế đó thay vì thêm guard trùng. Thuộc tính data.permission trong hình minh họa được thay bằng contract tương đương khi consumer không dùng cách này.

Trong resolver, phần lấy dữ liệu dùng service entity và gọi detail(id) theo convention của Blueprint. ProductService là tên entity ví dụ; phần xử lý ID, lỗi và quyền theo bản ghi vẫn phải tuân thủ toàn bộ contract bên dưới:

```ts
const productService = inject(ProductService);
// Bên trong luồng resolver đã kiểm tra ID và có xử lý lỗi.
const entity = await firstValueFrom(productService.detail(id));
```

Provider của service entity phải có trong injector của route/module sở hữu trước khi resolver chạy. Tái sử dụng scope hiện hữu, không đăng ký thêm instance nếu consumer đã cung cấp đúng service trong scope đó.

### Lỗi trước activation

| Tình huống | Đích xử lý |
| --- | --- |
| ID không hợp lệ, entity không tồn tại hoặc API trả 404 | Trang không tìm thấy theo contract consumer |
| Chưa xác thực/hết phiên, API trả 401 | Flow xác thực hoặc trang tương ứng của consumer |
| Thiếu quyền vào route hoặc quyền theo bản ghi, API trả 403 | Trang không có quyền theo contract consumer |
| Lỗi mạng, timeout hoặc lỗi máy chủ | Trang lỗi kết nối/hệ thống tương ứng, có cách thử lại hoặc quay về phù hợp |

Giữ mã lỗi và mapping của consumer nếu API dùng contract khác HTTP status. Không đổi mọi lỗi thành 404; không hiển thị thông tin lỗi nhạy cảm trên URL. Các đích lỗi/đăng nhập phải là route có thật và truy cập được trong trạng thái gây lỗi, tránh vòng lặp guard/resolver. Không hardcode các URL lỗi của một Portal vào module tái sử dụng.

### Bàn giao entity cho page

- Chỉ hoàn tất navigation khi entity bắt buộc đã có. Loading chờ resolver thuộc Portal/route navigation; page detail/update không bắt đầu bằng entity chưa tải rồi mới gọi API chính trong lifecycle.
- Page lấy entity từ ActivatedRoute.data hoặc cơ chế input/state đã chốt của consumer, rồi khởi tạo view/form. Không gọi lại cùng API chỉ để lấy entity đã resolve.
- Khi đổi ID, resolver phải chạy lại và page nhận dữ liệu mới reactively. paramsChange đáp ứng ID trong path; dependency query params hoặc nhu cầu refresh cùng URL cần chính sách chạy lại phù hợp của consumer.
- Nếu navigation bị hủy hoặc một navigation mới thay thế, kết quả cũ không được mở page hay ghi đè entity mới. Resolver phải có kết quả kết thúc/timeout theo chính sách tải dữ liệu của consumer.
- Dữ liệu phụ không bắt buộc có thể tải sau activation; dữ liệu bổ sung bắt buộc để khởi tạo update form phải hoàn tất cùng bước chuẩn bị entity.

## Module routes

### src/modules/mdm/routes.ts

<!-- example: src/modules/mdm/routes.ts -->
```ts
import type { Routes } from '@angular/router';

export const mdmRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'product',
  },
  {
    path: 'product',
    loadChildren: () => import('./features/product/routes').then(module => module.routes),
  },
];
```

Không đặt prefix mdm lặp lại trong module routes. Default product là ví dụ; thay bằng entry nghiệp vụ đã chọn.

## Feature routes

### src/modules/mdm/features/product/routes.ts

<!-- example: src/modules/mdm/features/product/routes.ts -->
```ts
import type { Routes } from '@angular/router';
import { ProductService } from './services/product.service';

export const routes: Routes = [
  {
    path: '',
    providers: [ProductService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Danh sách sản phẩm',
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
      },
      {
        path: 'create',
        title: 'Tạo sản phẩm',
        loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
      },
      {
        path: ':id/detail',
        title: 'Chi tiết sản phẩm',
        loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
      },
      {
        path: ':id/update',
        title: 'Cập nhật sản phẩm',
        loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
      },
    ],
  },
];
```

Các ListComponent/CreateComponent/DetailComponent/UpdateComponent là contract đích cho [UI patterns](../ui-patterns.md), chưa có implementation trong bộ mẫu nền tảng. Bộ kiểm chứng dùng fixture thay thế; không coi đó là page nghiệp vụ đã hoàn thành.

Đăng ký service ở parent của các route để page và descendants dùng chung provider feature. Service không dùng providedIn root.

## Host cấp configuration trong lazy module boundary

### src/environments/environment.ts

<!-- example: src/environments/environment.ts -->
```ts
export const environment = {
  mdm: {
    apiHost: '/api/mdm',
    assetBaseUrl: '/assets/mdm',
  },
};
```

### src/app/app.routes.ts

<!-- example: src/app/app.routes.ts -->
```ts
import type { Routes } from '@angular/router';
import { environment } from '../environments/environment';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'mdm/product' },
  {
    path: 'mdm',
    loadChildren: async () => {
      const module = await import('../modules/mdm');
      return [
        {
          path: '',
          providers: [module.provideMdmConfiguration(environment.mdm)],
          children: module.mdmRoutes,
        },
      ];
    },
  },
];
```

Host chỉ import public entry. Factory được gọi trong callback lazy loading, tránh static import module implementation vào host chỉ để đăng ký config.

Đây là mẫu local/lazy integration. Khi có remote loader, thay cơ chế lấy public entry bằng loader đã chốt, giữ public configuration contract. Không suy ra rằng một Angular injector tự truyền xuyên các application runtime độc lập.

Mẫu bỏ qua shell/auth/not-found của host để tập trung vào boundary. Khi tích hợp thực phải ghép vào routes hiện hữu, không thay toàn bộ host routes bằng đoạn này.

### src/main.ts

<!-- example: src/main.ts -->
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(appRoutes),
  ],
}).catch((error: unknown) => console.error(error));
```

AppComponent/router outlet và HTTP interceptors dùng implementation host. Không gọi provideHttpClient lại trong mọi feature nếu không có lý do về scope.

## URL và hành vi

| URL | Page |
| --- | --- |
| /mdm/product | List |
| /mdm/product/create | Create |
| /mdm/product/:id/detail | Detail |
| /mdm/product/:id/update | Update |

Routes sở hữu kiểm tra quyền vào route, tải entity bắt buộc và chuyển lỗi trước activation. UI patterns nhận entity đã resolve, phản ứng khi route data đổi, bảo vệ draft, lưu thành công về detail và Back giữ list query.

## Nguồn API

- [Route](https://angular.dev/api/router/Route).
- [Data resolvers](https://angular.dev/guide/routing/data-resolvers).
- [Control route access with guards](https://angular.dev/guide/routing/route-guards).
- [ResolveFn — thứ tự guards và resolvers](https://angular.dev/api/router/ResolveFn).
- [RunGuardsAndResolvers](https://angular.dev/api/router/RunGuardsAndResolvers).
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection).
