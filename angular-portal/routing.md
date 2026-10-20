# Routing

## Quy tắc

- Portal → module public entry → feature routes → page.
- List ở path rỗng; create không có ID; detail/update có :id.
- ID là định danh dữ liệu, khác mã hiển thị.
- Component đích lazy load, không eager import page từ Portal.
- Drawer thuộc components; không tự tạo page/route drawer nếu đặc tả chưa yêu cầu URL riêng.
- Guard/permission/unsaved changes phải theo contract project; ví dụ nền tảng dưới đây chưa tích hợp auth.

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
import { ApiService } from './services/api.service';

export const routes: Routes = [
  {
    path: '',
    providers: [ApiService],
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

Các ListComponent/CreateComponent/DetailComponent/UpdateComponent là contract đích cho [UI patterns](ui-patterns.md), chưa có implementation trong bộ mẫu nền tảng. Bộ kiểm chứng dùng fixture thay thế; không coi đó là page nghiệp vụ đã hoàn thành.

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

UI patterns chịu trách nhiệm load ID reactively khi route instance được reuse, not-found, guard draft, save success về detail và Back giữ list query.

## Nguồn API

- [Route](https://angular.dev/api/router/Route).
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection).
