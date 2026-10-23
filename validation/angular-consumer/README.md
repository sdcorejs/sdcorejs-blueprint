# Angular consumer — AOT và browser verification

Consumer tối giản cho [Angular Portal Blueprint](../../angular-portal/README.md), bổ sung bằng chứng runtime cho PR #1. Giữ Portal → public module → feature → lazy page, configuration ở route module và ProductService ở route feature. Đây là host kiểm chứng, không phải portal nghiệp vụ hoặc backend mẫu.

## Chạy lại

Dùng Node **24.19.0** (xem `.node-version`), Angular **22.1.6**, CLI/build **22.1.7**, Core **22.3.1**, TypeScript **6.0.3**, Playwright **1.63.0**, Vitest **4.1.12**. Dependencies được khóa trong `package-lock.json`; không cần checkout `portal-template` hoặc `sdcorejs-angular` bên cạnh.

```sh
cd validation/angular-consumer
npm ci
npx playwright install chromium
npm run check
```

Linux CI dùng `npx playwright install --with-deps chromium`. `npm run check` chạy type-check E2E, Angular unit/component/router integration trong Chromium, build production AOT với strict templates, kiểm tra graph bundle, rồi Playwright trên chính output production. Browser server bind `127.0.0.1:4317`, tự dừng khi suite kết thúc và không tái sử dụng server cũ.

Các lệnh riêng:

```sh
npm run test
npm run build
npm run test:e2e
```

Luôn build lại sau khi sửa source/Markdown trước khi chạy riêng `test:e2e`. `npm run serve` chỉ phục vụ output đã build; request `/api/*` trả 501 khi không có fixture. HTTP mock chỉ sống trong Playwright/Angular tests, không có dữ liệu fallback trong bundle. Không cần backend, tài khoản hay secret để chạy suite.

Suite module độc lập: terminal thứ nhất chạy `npm run serve`, terminal thứ hai chạy `npm run test:e2e:module`. Có thể đặt `BASE_URL` để dùng host kiểm chứng tương thích khác. Root config không discover lại module tests trong project Portal.

## Nguồn và ownership

| Vị trí | Vai trò |
| --- | --- |
| [scripts/prepare.mjs](scripts/prepare.mjs) | Trích 13 TypeScript + 3 SCSS từ marker `example` của Blueprint vào `generated/`, sau đó ghép source consumer |
| [src/app/app.routes.ts](src/app/app.routes.ts) | Chỉ import động public entry; mount cùng MDM tại `/alpha` và `/beta` với API/assets khác nhau |
| [src/app/navigation-error.ts](src/app/navigation-error.ts) | Host sở hữu mapping 401/403/404/network/5xx/timeout và URL lỗi; module không import host |
| [src/modules/mdm/features/product/routes.ts](src/modules/mdm/features/product/routes.ts) | Cấp ProductService, Core `canActivateChild`, resolver và lazy pages |
| [src/modules/mdm/features/product/entity.resolver.ts](src/modules/mdm/features/product/entity.resolver.ts) | Gọi đúng ProductService; Observable theo cancellation của Router, timeout 10 giây; từ chối entity rỗng/sai ID |
| `src/**/testing/integration`, `*.spec.ts` | DI hai scope, HTTP, Router thật và component Core; colocated theo owner |
| `src/modules/mdm/**/e2e` | Flow nghiệp vụ; fixtures có state riêng cho mỗi test |
| [src/modules/mdm/e2e/index.ts](src/modules/mdm/e2e/index.ts) | Test-only entry cho Portal suite, không export qua runtime module |
| [e2e/specs/navigation.e2e-spec.ts](e2e/specs/navigation.e2e-spec.ts) | Host chuyển giữa hai mount, API/asset isolation |

Chỉ ba entry được ghi đè có chủ đích: `src/main.ts`, `src/app/app.routes.ts`, `src/modules/mdm/features/product/routes.ts`. Configuration, public entry, module routes, resource URL, AssetService, BaseApiService, ProductService và model được lấy nguyên từ Markdown mỗi lần chạy. Script từ chối override khác và kiểm tra số block để báo khi boundary thay đổi. Không sửa hoặc commit `generated/`.

`tsconfig.app.json` loại specs/E2E/support; kiểm tra graph production xác nhận không có test support, không có Angular JIT compiler, không kéo source MDM vào initial graph và có bốn lazy page entry. Assets chỉ copy thư mục documents thật của module, dưới namespace riêng từng mount. Không có test mock trong assets.

## Phạm vi đã kiểm chứng

Kết quả local ngày **23/10/2026, Asia/Saigon**, Windows, Chromium headless:

| Kiểm tra | Bằng chứng |
| --- | --- |
| Angular specs | 9 tests: configuration copy/freeze, root/feature boundary, hai service/asset instance; HTTP; router pending/cancellation/ID reuse/deny-before-fetch; Core input/view |
| AOT | Production build + strict template/injection compilation; graph lazy/no-JIT/test exclusion PASS |
| Playwright | 26 cases gồm Portal + MDM desktop và 2 responsive cases trên Pixel 7 emulation |
| Preload | Pending chưa activate; đúng một GET mỗi navigation; reload; list/history; hủy navigation cũ; timeout; ID sai; 401/403/404/network/503 |
| Permission | Core guard thật và `*sdPermission`; quyền detail không cấp update, list-only vẫn thấy mã dạng text một lần nhưng không có hyperlink/create |
| UI | Table search/paging/empty/error; mã ở cột đầu là hyperlink mở detail bằng keyboard/click, không có action Edit/Detail trên list; section/view, create/update validation/save failure/retry, code khóa khi update, enum select dùng keyboard, dirty cancel/discard/revert |
| Layout | Desktop/mobile không overflow document; paginator trong viewport, table giữ vùng cuộn; screenshot list/form trong test-results |

Playwright bắt mọi `pageerror`; lỗi HTTP được chủ động giả lập là tình huống test. Không gọi test thất bại là pass nhờ retry: `retries: 0`. Report HTML, screenshot và trace khi lỗi đều là output ignored. [CI](../../.github/workflows/angular-consumer.yml) chạy cả foundation lẫn consumer và lưu artifacts.

## Các điểm được xác minh và sửa

- **`headerLeft` thay thế title mặc định của `sd-page`.** Khi chỉ project nút Back, detail mất identity dù đã truyền `[title]`. Consumer ghép Back + identity trong cùng slot; Blueprint đã bổ sung lưu ý, có component/E2E regression.
- **Paging của Core 22.3.1 là zero-based.** `SdTableFilterRequest.pageNumber` map trực tiếp sang `pageIndex` của service nền tảng. Consumer tắt sort/inline filter vì API mẫu chưa hỗ trợ chúng; không bỏ điều kiện một cách im lặng. Search và chuyển trang được kiểm tra bằng HTTP request thật qua fixture.
- **Form Core sở hữu đăng ký control qua `[form]` + `name`.** Consumer dùng FormGroup ban đầu rỗng với type cho các control tùy chọn, không khai lại control cùng tên. Wrapper chỉ chuyển tiếp form/model; page tạo SaveReq tường minh và giữ business code khi update.
- **Dirty theo giá trị.** `registerSdUnsavedChangesForm` dùng `form.dirty` nên còn prompt sau khi gõ rồi hoàn tác. Consumer đăng ký `SdUnsavedChangesService.register` với computed so sánh ba field với baseline. Không sửa semantics của Core; giữ convention Blueprint và regression browser cho revert.
- **Click lặp của Core có throttle 300 ms.** Các test retry/cancel điều khiển đồng hồ Playwright để vượt cửa sổ đó; không sửa button hoặc thêm sleep tùy ý.
- **Mobile table cần độ rộng đọc được.** Screenshot cho thấy cột tên bị ép thành vài ký tự mỗi dòng. Consumer dùng `minWidth` của Core trên cột tên, giữ cuộn ngang trong table; không thêm CSS che overflow.
- **Điều hướng detail trên list qua mã.** Giá trị `product.code` ở cột dữ liệu đầu tiên là link có `href` của route, thay cho nhãn “Chi tiết” riêng. `*sdPermission` bảo vệ link; snapshot quyền sau guard chỉ phục vụ text fallback vì Core 22.3.1 chưa có `sdPermissionElse`. E2E kiểm tra keyboard, mobile click, search/history và list-only không mất/lặp mã.

Các lựa chọn riêng của host này: sau lưu đi detail; lỗi API lưu dùng thông báo chung và giữ draft; lookup timeout 10 giây; native confirmation của Core cho dirty. Chúng không đặt mặc định nghiệp vụ mới cho Blueprint.

## Core UI được dùng

| API | Mục đích trong consumer |
| --- | --- |
| `SdPageComponent` | Header và vùng body cho list/detail/form/error |
| `SdButton` | Điều hướng, tạo mới và lưu; mặc định size của Core |
| `SdTable`, `SdTableCellDefDirective` | Danh sách server, search/paging và hyperlink trên mã theo quyền |
| `SdSection`, `SdSectionItem`, `SdView` | Nhóm thông tin và giá trị chỉ đọc |
| `SdInput` | Nhập code/name, validation và business identifier khóa khi update |
| `SdSelect` | Enum status bên trong `ProductStatusSelectComponent`; options thuộc model |
| `SdPermissionGuard`, `SdPermissionDirective`, `SdPermissionService` | Thực thi quyền route/action; chọn text fallback cho mã khi thiếu quyền detail |
| `SdUnsavedChangesService`, `sdUnsavedChangesGuard` | Bảo vệ draft với dirty theo giá trị do page sở hữu |

## Giới hạn

Chưa xác minh remote/micro-frontend nhiều Angular runtime, backend/auth thật, Firefox/WebKit, drawer, relation pipe/cache, select động/inactive lookup, tabs/steps, bulk/workflow hay mọi fragment UI trong Markdown. Browser API được mock ở HTTP boundary; kiểm tra quyền backend nằm ngoài bằng chứng này.

Quy tắc tối đa ba mục tác vụ và gom từ tác vụ thứ ba khi có hơn ba đã được ghi trong [UI patterns](../../angular-portal/ui-patterns.md). Consumer hiện có ít tác vụ, chưa chạy browser coverage cho `command.children`, `selector.actions.children` hoặc popover detail; các fragment minh họa nhóm không phải bằng chứng AOT/E2E. Bộ quyền được nạp trước activation và giữ ổn định; đổi quyền ngay khi page đang mở chưa nằm trong coverage.

Đã gặp lỗi resolve import Prism của Core khi chạy component specs trong Node/jsdom. Suite dùng browser mode chính thức của Angular/Vitest để chạy Core thật, không mock component hoặc patch `node_modules`. Build còn cảnh báo Sass `if()` deprecated và CommonJS từ dependencies Core; các cảnh báo này không bị tắt. Consumer kiểm chứng correctness và scope, chưa đặt ngân sách performance cho bundle Core.
