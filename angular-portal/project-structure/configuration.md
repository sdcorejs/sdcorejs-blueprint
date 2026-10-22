# Configuration và public provider

## Contract

Mỗi module công bố provide<Module>Configuration và kiểu configuration. Không yêu cầu host biết token/service nội bộ.

Mẫu dưới đây dùng environment injector ở biên route module. Không đăng ký cùng bộ provider một lần ở root rồi lại một lần ở route con.

### src/modules/mdm/configurations/mdm.configuration.ts

<!-- example: src/modules/mdm/configurations/mdm.configuration.ts -->
```ts
import { InjectionToken } from '@angular/core';

/** Các giá trị triển khai được Portal cấp cho MDM. */
export interface MdmConfiguration {
  /** API base URL, ví dụ /api/mdm hoặc https://api.example.com/mdm. */
  readonly apiHost: string;
  /** Static asset base URL của MDM, có thể thuộc origin khác với Portal. */
  readonly assetBaseUrl: string;
}

/** Nội bộ module; host dùng provideMdmConfiguration thay vì provide token trực tiếp. */
export const MDM_CONFIGURATION =
  new InjectionToken<Readonly<MdmConfiguration>>('MDM_CONFIGURATION');
```

apiHost và assetBaseUrl là base URL, không có query/hash. Chỉ nhận root-relative hoặc HTTP(S) tuyệt đối. Không đặt access token/secret vào configuration frontend.

### src/modules/mdm/configurations/provide-mdm-configuration.ts

<!-- example: src/modules/mdm/configurations/provide-mdm-configuration.ts -->
```ts
import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { MDM_CONFIGURATION, type MdmConfiguration } from './mdm.configuration';
import { AssetService } from '../services/asset.service';

/** Đăng ký cấu hình và các service dùng chung tại biên module. */
export function provideMdmConfiguration(
  configuration: MdmConfiguration,
): EnvironmentProviders {
  const value: Readonly<MdmConfiguration> = Object.freeze({
    apiHost: normalizeBaseUrl(configuration.apiHost, 'apiHost'),
    assetBaseUrl: normalizeBaseUrl(configuration.assetBaseUrl, 'assetBaseUrl'),
  });

  return makeEnvironmentProviders([
    { provide: MDM_CONFIGURATION, useValue: value },
    AssetService,
  ]);
}

function normalizeBaseUrl(value: string, field: keyof MdmConfiguration): string {
  const trimmed = value.trim();
  const rootRelative = trimmed.startsWith('/') && !trimmed.startsWith('//');
  if (!rootRelative && !/^https?:\/\//iu.test(trimmed)) {
    throw new Error('MDM configuration: ' + field + ' must be a root-relative or HTTP(S) base URL.');
  }

  const parsed = new URL(trimmed, 'https://blueprint.invalid');
  if (!parsed.hostname || trimmed.includes('?') || trimmed.includes('#')) {
    throw new Error('MDM configuration: ' + field + ' must not contain a query or fragment.');
  }
  return trimmed.replace(/\/+$/u, '') || '/';
}
```

Hàm nhận cấu hình tường minh, không tự đọc localStorage/environment/global object. Object được copy để host sửa object gốc không làm thay đổi cấu hình đã đăng ký.

makeEnvironmentProviders dùng cho application/environment route injector; không đưa kết quả vào providers của một component.

### src/modules/mdm/index.ts

<!-- example: src/modules/mdm/index.ts -->
```ts
export { mdmRoutes } from './routes';
export type { MdmConfiguration } from './configurations/mdm.configuration';
export { provideMdmConfiguration } from './configurations/provide-mdm-configuration';
```

Không export token, feature service, page hoặc component nội bộ nếu chưa có external consumer.

## Provider scope

| Thành phần | Mẫu mặc định |
| --- | --- |
| HttpClient/auth interceptor của Portal | Host bootstrap theo cấu hình project |
| MDM_CONFIGURATION, AssetService | Biên route module qua provideMdmConfiguration |
| API service của Product | Biên route feature |
| Draft/interaction state một page hoặc drawer | Scope phù hợp với owner UI |

Root service không phụ thuộc token chỉ tồn tại trong child route. Nếu một integration Core thực sự yêu cầu root-visible config, phải thiết kế đăng ký root tương ứng; không copy provider mẫu route một cách máy móc.

Cấu trúc này không mặc định cần mdm.module.ts chỉ để cung cấp config. Với project hiện hữu đã có Module.useClass/useValue, giữ compatibility nếu chưa được yêu cầu migration.

## Tích hợp

Xem [mẫu host route](routes.md). Portal cấp apiHost/assetBaseUrl; module nhận qua token và không import ngược environment.

## Nguồn API

- [makeEnvironmentProviders](https://angular.dev/api/core/makeEnvironmentProviders).
- [Route.providers](https://angular.dev/api/router/Route).
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection).
