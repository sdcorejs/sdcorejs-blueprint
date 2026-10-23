# Testing — cấu trúc và quyền sở hữu

## Phạm vi

Tài liệu này quy định vị trí unit/component/integration spec, E2E và test support của **ứng dụng Angular được Blueprint mô tả**.

validation/angular-foundation trong repo Blueprint là bộ kiểm chứng các block code mẫu. Nó không phải suite unit/E2E của ứng dụng thật và không thay thế kiểm tra Core UI/browser.

[validation/angular-consumer](../../validation/angular-consumer/README.md) là host kiểm chứng bổ sung: Angular specs trong Chromium, AOT production và Playwright theo owner. Source consumer ghép với các block Markdown; xem README để biết coverage cụ thể và phần chưa kiểm chứng.

Các đường dẫn dưới đây là mẫu cấu trúc. Không tạo file spec rỗng hoặc test chỉ để lặp lại implementation.

## Naming

| Loại | Hậu tố | Ví dụ |
| --- | --- | --- |
| Unit/service/component spec | .spec.ts | product.service.spec.ts, list.component.spec.ts |
| Integration spec | .integration.spec.ts | configuration.integration.spec.ts |
| Browser E2E | .e2e-spec.ts | create.e2e-spec.ts, navigation.e2e-spec.ts |
| Page object nếu cần | .page.ts | record.page.ts |
| Dữ liệu/builder test | .fixture.ts | api.fixture.ts |
| Test double dùng lại | .mock.ts | api.mock.ts |

Không lặp tên feature trong file khi context đã nằm ở đường dẫn. Hậu tố .e2e-spec.ts là convention SDCoreJS để phân biệt browser suite với Angular specs; Playwright phải được cấu hình testMatch tương ứng.

## Unit/component/service spec

Đặt cạnh code được kiểm tra:

```text
features/product/
  pages/list/
    list.component.ts
    list.component.html
    list.component.scss
    list.component.spec.ts
  components/general-information-form/
    general-information-form.component.ts
    general-information-form.component.spec.ts
  services/
    product.model.ts
    product.service.ts
    product.service.spec.ts
  routes.ts
  routes.spec.ts
```

Tương tự, module/configurations/provide-mdm-configuration.spec.ts và module/utils/resource-url.spec.ts nằm cạnh source.

Không gom unit spec vào một thư mục tests/specs chung xa owner. Model/type thuần không bắt buộc có spec riêng nếu không có hành vi runtime cần kiểm tra.

Component spec tập trung vào input/output, validation, state và tương tác mà component sở hữu. Không kiểm tra lại toàn bộ implementation nội bộ của Core UI.

## Integration spec

- Khi chỉ phối hợp một phần code: đặt .integration.spec.ts cạnh owner đó.
- Khi phối hợp nhiều service/component/routes: đặt tại testing/integration trong feature/module sở hữu tình huống.
- Không đặt cùng một tình huống ở cả hai nơi.
- Integration spec dùng DI/router/HTTP test double có thể vẫn chạy bằng runner spec của project; không tự động đồng nghĩa browser E2E.

```text
mdm/
  testing/
    integration/
      module-configuration.integration.spec.ts
  features/product/
    testing/
      integration/
        record-flow.integration.spec.ts
```

Ví dụ có giá trị: token/config resolve đúng qua boundary module/feature; nhiều component phối hợp mà không mất draft; lỗi service được phản ánh đúng. Chỉ viết khi phạm vi cần kiểm chứng tương ứng.

### Route detail/update có ID

Kiểm chứng contract trong [Routes](routes.md) bằng router integration ở feature và những flow browser cần thiết trong E2E của owner. Các case cần chứng minh:

| Case | Kết quả cần xác nhận |
| --- | --- |
| API tải entity đang pending | Page đích chưa được kích hoạt; sau khi tải thành công, page nhận đúng entity |
| Guard route từ chối quyền | Không gọi API tải entity, không kích hoạt page; chuyển đúng flow/trang lỗi |
| Có quyền detail nhưng thiếu quyền update | Detail được phép; URL update trực tiếp bị từ chối |
| Entity không tồn tại/404, hết phiên/401, thiếu quyền bản ghi/403, lỗi mạng/5xx | Chuyển đúng đích theo mapping consumer; không chuyển mọi lỗi về not-found |
| Đổi ID khi route được reuse | Kiểm tra quyền/tải lại theo ID mới; view/form không giữ entity trước |
| Navigation cũ chậm hoặc bị hủy | Kết quả cũ không kích hoạt page hoặc ghi đè entity của navigation mới |
| Page nhận entity đã resolve | Form/view khởi tạo từ entity đó; không phát sinh request tải entity trùng |
| URL trực tiếp, reload và điều hướng từ list | Cùng thực thi contract quyền, tải entity và xử lý lỗi |

Dùng guard/resolver thật của consumer với API điều khiển được trong router integration; kiểm tra trạng thái activation và số request, không chỉ gọi resolver như một hàm riêng. Khi có backend thật, kiểm chứng API từ chối quyền độc lập với guard giao diện. Bảng này quy định case cần có, chưa phải suite đã được triển khai/chạy trong repo Blueprint.

## Test support

Có thể có testing ở cả module và feature:

| Vị trí | Chứa |
| --- | --- |
| testing/fixtures | Dữ liệu hư cấu, builder/factory tạo dữ liệu test |
| testing/mocks | Service/API test double dùng lại |
| testing/helpers | Helper setup/assertion phục vụ nhiều test |
| testing/integration | Integration spec phối hợp nhiều phần cùng owner |

Support chỉ dùng một spec có thể nằm ngay cạnh spec đó; không bắt buộc tạo cả cây testing.

Feature dùng test support của chính nó hoặc module. Nếu nhiều feature thật sự dùng chung thì nâng lên module/testing. Module không import test helper/source riêng của Portal hoặc module khác.

Không export test support qua index.ts runtime. Nếu một external test consumer thực sự cần helper module, công bố test-only entry riêng và giữ dependency một chiều; không mở toàn bộ private fixture/page object.

## E2E theo owner

| Vị trí | Phạm vi |
| --- | --- |
| features/product/e2e | Flow browser chỉ thuộc Product |
| mdm/e2e | Flow phối hợp nhiều feature trong MDM |
| project/e2e | Shell/navigation, tích hợp module và flow xuyên module |

```text
project/
  playwright.config.ts
  e2e/
    specs/
      navigation.e2e-spec.ts
      cross-module-flow.e2e-spec.ts
    fixtures/
    page-objects/
    support/
  src/modules/mdm/
    e2e/
      playwright.config.ts
      specs/
        cross-feature-flow.e2e-spec.ts
      fixtures/
      page-objects/
      support/
    features/product/
      e2e/
        specs/
          create.e2e-spec.ts
          update.e2e-spec.ts
          detail.e2e-spec.ts
        fixtures/
        page-objects/
          record.page.ts
        support/
```

Chỉ tạo những thư mục có consumer thực. Một flow thuộc Product không được chép thêm vào root/e2e chỉ vì suite Portal cũng cần chạy nó.

E2E của module nhận baseURL/auth/test data setup qua cấu hình test hoặc fixture của module. Có thể chạy với một host kiểm thử phù hợp; không import private component, environment hay fixture của Portal để làm module chạy được.

## Fixture và page object của E2E

- e2e/fixtures: Playwright fixture quản lý lifecycle test/worker và dữ liệu cho suite.
- e2e/page-objects: hành vi thao tác màn hình được dùng lại; không tạo một class cho mọi element.
- e2e/support: setup/teardown/helper chung khi có nhu cầu.
- Fixture dữ liệu và fixture lifecycle là hai vai trò khác nhau; tách data/ bên trong fixtures khi nội dung đủ lớn.
- Dữ liệu hư cấu có scope/cleanup rõ để các test không phụ thuộc thứ tự.
- Không đặt mock/fixture trong assets hoặc dùng chúng làm dữ liệu fallback của production.

Consumer hiện có dirty guard, save failure, direct URL và keyboard select cùng subset [UI patterns](../ui-patterns.md). Selection, drawer/focus restoration và các flow chưa có trong coverage README vẫn cần suite riêng.

## Config và runner discovery

| File | Trách nhiệm |
| --- | --- |
| project/tsconfig.app.json | Source ứng dụng, tránh tự gom spec/E2E/test support |
| project/tsconfig.spec.json | Unit/component/integration spec và type của runner hiện hữu |
| project/playwright.config.ts | Điều phối projects/suite Portal và các module được đăng ký |
| module/e2e/playwright.config.ts | Cho phép chạy suite module độc lập với root config |

Mặc định:

- Angular spec discovery dùng `**/*.spec.ts`; cần loại E2E và các output khỏi target này.
- Playwright dùng `**/e2e/specs/**/*.e2e-spec.ts`, không dùng một testMatch bao trùm mọi `.spec.ts`.
- Root config có thể dùng project Portal trỏ tới root/e2e/specs và project MDM trỏ tới src/modules/mdm; project MDM thu cả E2E module lẫn feature bên trong.
- Module config tại mdm/e2e có thể đặt testDir tới thư mục module và cùng testMatch E2E. Mọi đường dẫn phải tính từ config thực tế đang chạy.
- Không chạy một suite hai lần ngoài chủ đích, ví dụ vừa có project all-modules vừa có project MDM thu đúng cùng test trên cùng browser.
- Giữ runner unit hiện có của project; không cài runner khác chỉ để giống tên thư mục trong Blueprint.

Fragment gợi ý cho tsconfig.app.json:

```json
{
  "exclude": [
    "src/**/*.spec.ts",
    "src/**/testing/**",
    "src/**/e2e/**",
    "e2e/**"
  ]
}
```

Fragment gợi ý cho tsconfig.spec.json:

```json
{
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"],
  "exclude": ["src/**/e2e/**", "e2e/**"]
}
```

Ghép vào config hiện hữu và kiểm tra cùng include/files/extends của project. Exclude điều khiển discovery, không phải hàng rào ngăn import; runtime code vẫn không được import test support. Fixture/helper được spec import sẽ đi vào compilation của spec.

Các fragment này mô tả boundary. Consumer có cấu hình runner và Playwright thực thi chúng; foundation chỉ kiểm tra các fragment và block nền tảng.

## Output sinh ra

coverage/, test-results/, playwright-report/, blob-report/ và e2e/.auth/ (nếu có) là output. Đưa chúng vào ignore ở mọi scope tương ứng; không coi là thư mục source bắt buộc.

Ảnh expected baseline của visual regression, nếu được dùng và review, là test source và có thể được version hóa gần suite. Ảnh actual/diff, trace, video và auth state sinh ra thuộc output; không đưa vào assets production.

## Nghiệm thu

- [ ] Spec nằm cạnh source hoặc integration owner rõ ràng.
- [ ] Test nghiệp vụ và support nằm trong module/feature, không phụ thuộc host private.
- [ ] E2E root chỉ giữ flow Portal/xuyên module.
- [ ] Runner không discover nhầm spec/E2E hoặc chạy trùng ngoài chủ đích.
- [ ] Fixture/mock không đi vào public entry hoặc production assets.
- [ ] Report/coverage/auth output được ignore.
- [ ] Ghi rõ suite thực sự đã chạy; code fixture/typecheck không thay bằng chứng E2E.

## Nguồn

- [Angular style guide: colocate tests](https://angular.dev/style-guide).
- [Playwright projects](https://playwright.dev/docs/test-projects).
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures).
