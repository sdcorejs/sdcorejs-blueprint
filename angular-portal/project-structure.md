# Project structure

Trạng thái: Quy ước được thống nhất trong phiên review ngày 19/10/2026.

## Mục tiêu

Tổ chức ứng dụng Angular Portal/backoffice theo **Portal → Module nghiệp vụ → Feature**. Mỗi module tự chứa code và tài nguyên, có thể được host tích hợp qua public configuration.

## Cấu trúc tổng thể

```text
project/
  public/                                  # Tài nguyên thuộc Portal
  playwright.config.ts                     # Điều phối E2E của Portal/module
  tsconfig.app.json                        # Source ứng dụng, loại test khỏi discovery
  tsconfig.spec.json                       # Unit/component/integration specs
  e2e/                                     # Chỉ các flow thuộc Portal hoặc xuyên module
    specs/
      navigation.e2e-spec.ts
      cross-module-flow.e2e-spec.ts
    fixtures/
    page-objects/
    support/
  src/
    main.ts
    styles.scss
    environments/
      environment.ts
      environment.dev.ts
      environment.prod.ts
    app/
      app.component.ts
      app.component.spec.ts
      app.routes.ts
      app.routes.spec.ts
      components/
        main/                              # Bố cục chính của Portal
      configurations/
        layout.configuration.ts
        auth.configuration.ts              # Khi project có auth
        permission.configuration.ts        # Khi project có phân quyền
    modules/
      mdm/                                 # Tên module ví dụ
        index.ts
        routes.ts
        routes.spec.ts
        configurations/
          mdm.configuration.ts             # Interface + InjectionToken
          provide-mdm-configuration.ts     # Public configuration/provider
          provide-mdm-configuration.spec.ts
          api.configuration.ts             # Chỉ khi integration API cần
        services/
          base-api.service.ts
          asset.service.ts
          asset.service.spec.ts
        components/
        directives/
        pipes/
        utils/
          resource-url.ts
          resource-url.spec.ts
        guards/
        testing/                           # Test support dùng chung trong MDM
          fixtures/
          mocks/
          helpers/
          integration/                     # Tình huống phối hợp ở scope module
            module-configuration.integration.spec.ts
        e2e/                               # E2E phối hợp các feature trong MDM
          playwright.config.ts             # Cho phép chạy suite module riêng
          specs/
            cross-feature-flow.e2e-spec.ts
          fixtures/
          page-objects/
          support/
        assets/
          images/
          icons/
          fonts/
          styles/
            _index.scss
            _variables.scss
            _mixins.scss
            _utilities.scss
          templates/
          documents/
        features/
          product/
            routes.ts
            routes.spec.ts
            pages/
              list/
                list.component.ts
                list.component.html
                list.component.scss
                list.component.spec.ts
              detail/
                detail.component.ts
              create/
                create.component.ts
              update/
                update.component.ts
            components/
              detail-side-drawer/
              create-side-drawer/
              update-side-drawer/
              general-information-form/
                general-information-form.component.ts
                general-information-form.component.spec.ts
              general-information-view/
            services/
              api.model.ts
              api.service.ts
              api.service.spec.ts
            testing/                       # Fixture/mock/helper riêng của Product
              fixtures/
              mocks/
              helpers/
              integration/
                record-flow.integration.spec.ts
            e2e/                           # Flow browser riêng của Product
              specs/
                create.e2e-spec.ts
                update.e2e-spec.ts
                detail.e2e-spec.ts
              fixtures/
              page-objects/
                record.page.ts
              support/
            assets/
              images/
              icons/
              fonts/
              styles/
              templates/
              documents/
```

Cây minh họa các vị trí được phép, không phải scaffold bắt buộc. Các component khác cũng có TS/HTML/SCSS và spec cùng thư mục khi cần. Chỉ thêm test có giá trị xác nhận hành vi; không tạo spec rỗng cho mọi file.

Project đang dùng src/libs giữ cấu trúc hiện hữu nếu chưa có yêu cầu migration. Baseline cho project mới là src/modules.

## Quyền sở hữu

| Vị trí | Trách nhiệm |
| --- | --- |
| app | Bố cục chính, navigation, auth integration, cấu hình triển khai |
| modules/<module> | Nghiệp vụ, tài nguyên, public entry, configuration và routes |
| features/<feature> | Một entity hoặc nhóm tác vụ nghiệp vụ; không bắt buộc tương ứng một bảng database |
| pages | Container có route; điều phối ID, tải/lưu, navigation |
| components trong feature | Thành phần thuộc feature, bao gồm drawer và các phần form/view |
| services/assets/... cấp module | Dùng chung cho các feature của module |
| services/assets/... cấp feature | Dùng riêng trong feature |
| *.spec.ts cạnh source | Unit/component/service spec của phần code tương ứng |
| testing | Fixture/mock/helper và integration spec trong phạm vi module/feature |
| e2e trong module/feature | Flow browser thuộc nghiệp vụ module/feature đó |
| e2e ở root | Navigation/shell và flow tích hợp xuyên module của Portal |

Phần dùng chung cho nhiều module phải là package/library có public contract. src/shared của Portal, nếu có, chỉ phục vụ Portal; module nghiệp vụ không phụ thuộc vào đó.

## Tên và trách nhiệm UI

Tên feature đã có trong đường dẫn, không lặp lại trong tên thư mục/file bên trong. Ví dụ product/pages/list/list.component.ts.

- Page tách list, detail, create, update để AI dễ xác định phạm vi.
- Drawer tách detail-side-drawer, create-side-drawer, update-side-drawer.
- Không bắt buộc tạo đủ page và drawer cho cùng tác vụ.
- Component nhập/sửa có hậu tố -form; component chỉ đọc có hậu tố -view.
- Không dùng tên facts trong Blueprint này.
- Màn lớn tách component theo nhóm thông tin/tác vụ, kể cả chỉ có một consumer.
- Create/update có thể dùng chung component -form; không copy toàn bộ form.
- Component con khai báo input/output mà phần cha thực sự cần. Page/drawer điều phối tải/lưu/điều hướng.

Implementation có Core UI của các page/drawer nằm ở [UI patterns](ui-patterns.md). Tài liệu cấu trúc không chứa mẫu giao diện đó.

## Service và model

- Base service đặt tại services cấp module và đặt tên theo trách nhiệm: base-api.service.ts, không tạo một BaseService chứa mọi thứ.
- Service riêng của feature đặt trong feature/services.
- Model/DTO cho service đặt cạnh service, ví dụ api.model.ts.
- Type chỉ dùng bởi một component đặt cạnh component đó; chỉ tách file khi đủ nội dung.
- Không mặc định tạo facade/store hoặc bắt mọi service kế thừa base.
- Không nhân bản helper/API client mà Core hoặc dependency hiện hữu đã cung cấp.

resource-url trong ví dụ có hai consumer thực: base API service và asset service. Nếu project đã có helper tương thích thì dùng helper đó.

## Public API và configuration

index.ts chỉ công bố routes, provide<Module>Configuration, kiểu configuration và các contract được external consumer sử dụng.

Token và kiểu cấu hình nằm trong mdm.configuration.ts. Hàm provideMdmConfiguration nằm cạnh đó trong file riêng để có thể đăng ký service chung mà không tạo vòng import token → service → token.

Module không đọc environment của Portal. Portal cấp giá trị qua configuration.

Mẫu mặc định đặt configuration/service chung tại environment injector của route biên module; feature service được cung cấp tại route biên feature. Service và configuration phải nằm trong chuỗi injector hợp lệ. Không tự đặt mọi service providedIn root.

Drawer tạo động phải nhận injector/environment injector thích hợp của module khi integration API yêu cầu. Cách mở drawer cụ thể thuộc UI patterns.

Xem [Configuration](configuration.md) và [Routing](routing.md).

## Assets và style

Cả module và feature được có assets với images, icons, fonts, styles, templates, documents. Chỉ tạo nhóm có tài nguyên thực.

- Style riêng của component ở *.component.scss.
- assets/styles chứa phần dùng chung trong scope.
- Biến/mixin không tự phát sinh CSS; utility có namespace/scope rõ.
- Tài nguyên được xuất bản với namespace module/feature.
- File tĩnh được copy theo build config; SCSS được compile/import, không copy mù assets/**.

Xem [Assets](assets.md).

## Test và test support

- Unit/component/service spec nằm cạnh source: list.component.spec.ts, api.service.spec.ts, provide-mdm-configuration.spec.ts.
- Integration test một phần code đặt cạnh phần đó với hậu tố .integration.spec.ts; kịch bản phối hợp nhiều phần đặt trong testing/integration của owner gần nhất.
- E2E dùng hậu tố .e2e-spec.ts và nằm trong e2e/specs của feature/module/Portal sở hữu flow.
- Module tự chứa test nghiệp vụ và test support; không import fixture/page object riêng của Portal hoặc module khác.
- Feature test support nằm trong feature/testing hoặc feature/e2e. Khi nhiều feature thật sự dùng chung, chuyển lên scope module.
- testing/fixtures là dữ liệu/builder test; e2e/fixtures có thể chứa Playwright fixture và dữ liệu cho suite.
- Không đưa test fixture/mock vào assets hay public entry runtime.
- Runner discovery và tsconfig phải tách Angular spec với Playwright E2E. Không gom mọi .spec.ts vào Playwright.
- coverage, test-results, playwright-report, blob-report và auth state sinh ra là output, không phải source.
- validation/angular-foundation trong repo Blueprint chỉ kiểm chứng code mẫu; không thay thế bộ test của ứng dụng được Blueprint mô tả.

Chi tiết naming, vị trí config, discovery và output: [Testing](testing.md).

## Kiểm tra trước bàn giao

- [ ] Module không import source riêng của host/module khác.
- [ ] Public entry không export page/component/service private.
- [ ] Route và service resolve được configuration tại đúng scope.
- [ ] Page/drawer/component đúng vị trí và không lặp tên feature trong path.
- [ ] Model và code dùng chung thuộc đúng owner.
- [ ] Assets có namespace, styles không rò scope.
- [ ] Không có thư mục rỗng hoặc abstraction chưa có consumer.
- [ ] Spec/E2E và test support đúng owner; module không phụ thuộc test nội bộ của host.
- [ ] Angular spec và Playwright E2E được discover riêng; output không vào source/bundle.
