# Project structure

Trạng thái: Quy ước được thống nhất và cập nhật qua các phiên review ngày 19–23/10/2026.

## Mục tiêu

Tổ chức ứng dụng Angular Portal/backoffice theo **Portal → Module nghiệp vụ → Feature**. Mỗi module tự chứa code và tài nguyên, có thể được host tích hợp qua public configuration.

## Tài liệu trong nhóm

README này mô tả cây thư mục, ownership, naming và các ranh giới chung. Các chủ đề liên quan được tách thành tài liệu riêng trong cùng thư mục:

| Tài liệu | Khi nào đọc |
| --- | --- |
| [Configuration](configuration.md) | Khai báo token, public provider và scope DI |
| [Routes](routes.md) | Tích hợp module, quyền vào route và tải entity trước khi mở detail/update |
| [Services](services.md) | Base API service, service/model của feature, asset URL |
| [Assets](assets.md) | Tài nguyên và CSS/SCSS ở module/feature |
| [Testing](testing.md) | Vị trí spec/integration/E2E, test support và runner discovery |

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
                list.component.spec.ts
              detail/
                detail.component.ts
              create/
                create.component.ts
              update/
                update.component.ts
            components/
              product-select/             # Khi Product được chọn ở các màn khác
                product-select.component.ts
                product-select.component.html
              product-status-select/      # Dropdown enum/const Product thực sự sử dụng
                product-status-select.component.ts
                product-status-select.component.html
              detail-side-drawer/
              create-side-drawer/
              update-side-drawer/
              general-information-form/
                general-information-form.component.ts
                general-information-form.component.spec.ts
              general-information-view/
            services/
              product.model.ts
              product.service.ts
              product.service.spec.ts
            pipes/
              product-detail.pipe.ts       # ProductDetailPipe, tên productDetail
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

Tên feature đã có trong đường dẫn, không lặp lại trong tên thư mục/file UI chỉ dùng nội bộ. Ví dụ product/pages/list/list.component.ts. Component được công bố để consumer khác sử dụng mang tên rõ entity, ví dụ `customer-select`; model/service/pipe dùng tên entity theo quy ước bên dưới.

- Page tách list, detail, create, update để AI dễ xác định phạm vi.
- Drawer tách detail-side-drawer, create-side-drawer, update-side-drawer.
- Không bắt buộc tạo đủ page và drawer cho cùng tác vụ.
- Component nhập/sửa có hậu tố -form; component chỉ đọc có hậu tố -view.
- Không dùng tên facts trong Blueprint này.
- Màn lớn tách component theo nhóm thông tin/tác vụ, kể cả chỉ có một consumer.
- Create/update có thể dùng chung component -form; không copy toàn bộ form.
- Component con khai báo input/output mà phần cha thực sự cần. Page/drawer điều phối tải/lưu/điều hướng.
- Các nhóm thông tin dùng `sd-section`; detail dùng `sd-view` hoặc các hàng `sd-section-item` bên trong. Đây là bố cục UI, không yêu cầu tạo một component/file cho mỗi section.
- Button thông thường `sm`, title detail có chữ “Chi tiết” và badge trạng thái cạnh title; identity tối đa hai dòng. Page back ở `headerLeft`, drawer đóng bằng X; không lặp action Hủy/Đóng.
- Drawer detail/update mở bằng method phải kiểm tra quyền và chuẩn bị entity tương đương route trước khi mở; không tự được bảo vệ bởi guard/resolver của route. Close guard, output kết quả và việc refresh caller theo UI patterns.

Implementation có Core UI của các page/drawer nằm ở [UI patterns](../ui-patterns.md). Tài liệu cấu trúc không chứa mẫu giao diện đó.

## Service và model

- Base service đặt tại services cấp module và đặt tên theo trách nhiệm: base-api.service.ts, không tạo một BaseService chứa mọi thứ.
- Service riêng của feature đặt trong feature/services; file `<entity>.service.ts` export class theo entity, ví dụ `product.service.ts` / `ProductService`, `customer.service.ts` / `CustomerService`.
- Model/DTO cho service đặt cạnh service và mang tên `<entity>.model.ts`, ví dụ product.model.ts; request/response dùng hậu tố Req/Res, entity giữ tên ProductDto.
- Const, enum và các type/interface liên quan của feature mặc định đặt chung trong file model. Chỉ tách theo nhóm khi nội dung lớn hoặc trách nhiệm/phạm vi sử dụng khác biệt rõ; tránh chia nhiều file nhỏ cho một feature có ít model.
- Hàm dùng list/detail/create/update/delete và tên tác vụ approve/reject khi có. delete nhận một ID hoặc mảng ID; approve/reject nhận một Req hoặc mảng Req. Chi tiết ở [Services](services.md).
- Type chỉ dùng bởi một component đặt cạnh component đó; chỉ tách file khi đủ nội dung.
- Không mặc định tạo facade/store hoặc bắt mọi service kế thừa base.
- Không nhân bản helper/API client mà Core hoặc dependency hiện hữu đã cung cấp.

resource-url trong ví dụ có hai consumer thực: base API service và asset service. Nếu project đã có helper tương thích thì dùng helper đó.

## Pipe detail của entity

- Mỗi entity của feature có pipe detail để các view dùng thống nhất: `<entity>Detail` trong template, `<Entity>DetailPipe` cho class và `pipes/<entity>-detail.pipe.ts` cho file. Ví dụ `customerDetail`, `CustomerDetailPipe`, `features/customer/pipes/customer-detail.pipe.ts`.
- Pipe nhận ID, trả object detail có kiểu của entity qua `Promise` hoặc `Observable` theo contract service của consumer, dùng cùng `async`; không bắt buộc chuyển đổi giữa hai kiểu. Implementation khai báo kiểu cụ thể phù hợp, không bắt buộc union cả hai. Không giới hạn kết quả thành tên; view chọn field cần hiển thị. ID rỗng không gọi API và cho kết quả `null`.
- Pipe gọi service của đúng entity; service sở hữu API/cache và chia sẻ request. Pipe thuộc feature sở hữu entity, được tái sử dụng qua public entry khi có consumer bên ngoài; không nhân bản ở các feature tham chiếu.
- Consumer phải cấp service/configuration trong chuỗi injector nơi pipe chạy. Nếu dùng qua nhiều route, chọn scope chung/public provider phù hợp; không dựa vào provider của route sibling hoặc tự dùng `providedIn: 'root'`.
- Quy tắc render relation, giá trị rỗng và mã giả HTML nằm ở [UI patterns](../ui-patterns.md).

## Select của entity và enum/const

- Khi entity được chọn ở các feature khác, feature sở hữu entity cung cấp component `<entity>-select`. Ví dụ selector `customer-select`, class `CustomerSelectComponent`, file `features/customer/components/customer-select/customer-select.component.ts` và `.html`. Chỉ thêm SCSS khi utility Core chưa đáp ứng.
- Component bọc select của Core, sở hữu việc gọi service entity, search/load option, filter mặc định và cách render item/giá trị đã chọn. Consumer như Order chỉ truyền model/form và điều kiện bổ sung; không tự tải danh sách customer hoặc copy option template.
- Option nên có thêm thông tin nhận diện khi phù hợp, tối đa hai dòng text; ví dụ `user-select` có avatar bên cạnh, tên ở dòng đầu và role ở dòng phụ. Avatar/badge không tạo dòng thứ ba; text dài rút gọn kèm tooltip. Entity sở hữu template này, consumer không phải cấu hình lại.
- Select trong table nhập liệu giữ giá trị đã chọn gọn trong control, không render thêm mô tả bên dưới; metadata có thể nằm trong option khi mở dropdown.
- Public binding gồm `[(model)]`, `[form]` và `[filters]` khi cần; các input như `name`, `disabled`, `required`, `viewed`, `multiple` theo nhu cầu và contract Core của consumer. Model mặc định mang ID (hoặc mảng ID khi hỗ trợ multiple), không bắt consumer quản lý object option.
- Filter chọn mới và việc tải giá trị đã chọn có mục đích khác nhau. Khi edit, phải hiển thị được entity inactive đã chọn; không tự xóa model chỉ vì entity không còn trong kết quả tìm kiếm hoặc không khớp filter lựa chọn mới. Chi tiết ở [UI patterns](../ui-patterns.md).
- Export component qua public entry phù hợp; dùng service/configuration đúng scope như pipe detail, không phụ thuộc việc route Customer đã được mở trước đó.
- `components/` cũng chứa wrapper cho dropdown enum/const thuộc feature, ví dụ `product-status-select`, `customer-type-select`, `order-status-select`. Tên selector/file/class thể hiện entity và trường/nghĩa nghiệp vụ, ví dụ `ProductStatusSelectComponent` tại `components/product-status-select/`. Tạo khi dropdown thực sự được dùng, không sinh wrapper rỗng cho mọi enum.
- Enum/const và option metadata vẫn đặt trong `<entity>.model.ts` theo convention model. Wrapper import nguồn này, sở hữu label, option template và binding Core; không nhân bản options trong page hoặc chuyển định nghĩa enum sang component.
- Create/update ưu tiên dùng wrapper đã chuẩn bị, hạn chế `sd-select` trực tiếp và API lấy option/lookup trong page. Page sở hữu form, validation nghiệp vụ và tác vụ create/update; wrapper sở hữu nguồn dữ liệu dropdown. Enum/const tĩnh dùng options sẵn có, không gọi API; dropdown động tải qua service đúng entity.

## Public API và configuration

index.ts chỉ công bố routes, provide<Module>Configuration, kiểu configuration và các contract được external consumer sử dụng.

Token và kiểu cấu hình nằm trong mdm.configuration.ts. Hàm provideMdmConfiguration nằm cạnh đó trong file riêng để có thể đăng ký service chung mà không tạo vòng import token → service → token.

Module không đọc environment của Portal. Portal cấp giá trị qua configuration.

Mẫu mặc định đặt configuration/service chung tại environment injector của route biên module; feature service được cung cấp tại route biên feature. Service và configuration phải nằm trong chuỗi injector hợp lệ. Không tự đặt mọi service providedIn root.

Drawer tạo động phải nhận injector/environment injector thích hợp của module khi integration API yêu cầu. Cách mở drawer cụ thể thuộc UI patterns.

Route detail/update có ID phải kiểm tra quyền và tải entity trước khi kích hoạt page. Lỗi tải hoặc thiếu quyền chuyển tới flow/trang lỗi tương ứng của consumer. Page nhận entity đã tải để khởi tạo view/form; xem contract trong Routes.

Xem [Configuration](configuration.md) và [Routes](routes.md).

## Assets và style

Cả module và feature được có assets với images, icons, fonts, styles, templates, documents. Chỉ tạo nhóm có tài nguyên thực.

- Ưu tiên utility Core. Chỉ tạo *.component.scss khi cần style riêng mà utility chưa đáp ứng; list đơn giản mặc định chỉ có TS/HTML. Detail, create/update, drawer và wrapper cũng không mặc định có SCSS hoặc `styleUrl`.
- assets/styles chứa phần dùng chung trong scope.
- Biến/mixin không tự phát sinh CSS; utility có namespace/scope rõ.
- Tài nguyên được xuất bản với namespace module/feature.
- File tĩnh được copy theo build config; SCSS được compile/import, không copy mù assets/**.

Xem [Assets](assets.md).

## Test và test support

- Unit/component/service spec nằm cạnh source: list.component.spec.ts, product.service.spec.ts, provide-mdm-configuration.spec.ts.
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
- [ ] Detail/update chỉ được kích hoạt sau khi kiểm tra quyền và tải entity thành công; lỗi chuyển đúng trang/flow của consumer.
- [ ] Page/drawer/component đúng vị trí và không lặp tên feature trong path.
- [ ] Model và code dùng chung thuộc đúng owner.
- [ ] Assets có namespace, styles không rò scope.
- [ ] Không có thư mục rỗng hoặc abstraction chưa có consumer.
- [ ] Spec/E2E và test support đúng owner; module không phụ thuộc test nội bộ của host.
- [ ] Angular spec và Playwright E2E được discover riêng; output không vào source/bundle.
