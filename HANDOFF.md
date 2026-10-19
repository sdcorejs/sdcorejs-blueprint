# Handoff — Angular Blueprint

Cập nhật: 20/10/2026, Asia/Ho_Chi_Minh. Tài liệu bàn giao để tiếp tục trên máy khác.

## Repo và branch

- Repository: https://github.com/sdcorejs/sdcorejs-blueprint
- Branch đang làm: `docs/angular-foundation-20261019`
- PR hiện tại: https://github.com/sdcorejs/sdcorejs-blueprint/pull/1 — đang mở, chưa merge tại thời điểm bàn giao.
- Commit nội dung gần nhất trước handoff: `ca9faa711f564c68b1b35cebb93650d2eb0290e5`.
- Tiếp tục trên branch này và cập nhật cùng PR; không cần tạo lại phần nền tảng.

Máy chưa có checkout:

```sh
git clone --branch docs/angular-foundation-20261019 https://github.com/sdcorejs/sdcorejs-blueprint.git
cd sdcorejs-blueprint
```

Máy đã có repo, sau khi xử lý các thay đổi local đang có:

```sh
git fetch origin
git switch docs/angular-foundation-20261019
git pull --ff-only origin docs/angular-foundation-20261019
```

## Mục tiêu và phạm vi đã chốt

Repo Blueprint độc lập chứa các quy tắc và mẫu triển khai cho SDCoreJS. Angular nằm ở thư mục root `angular/`; sau này có nhóm NestJS/React riêng. Mỗi chủ đề là một file Markdown, có [angular/README.md](angular/README.md) làm mục lục.

Markdown phục vụ AI/developer; HTML diễn giải trực quan sẽ được làm sau. Chưa chốt cách phân phối/kích hoạt Blueprint trong project, `sdcorejs-agent` hay package `sdcorejs-angular`. Không tự coi Blueprint là một skill đã cài hoặc một tính năng tự động của package.

Người dùng yêu cầu tham khảo thêm `portal-template`. Khi triển khai UI patterns, cần xác định đúng repo/branch `portal-template` và đọc code cùng API Core UI đúng version; chưa có source `portal-template` được đóng gói trong repo này.

## Các quyết định kiến trúc cần giữ

1. **Portal → module → feature.** `src/app` sở hữu shell/navigation/cấu hình triển khai; `src/modules/<module>` tự chứa nghiệp vụ, tài nguyên và test, hướng đến microfrontend. MDM/Product chỉ là tên ví dụ.
2. **Module tích hợp qua public contract.** Công bố routes, `provide<Module>Configuration` và kiểu configuration cần cho consumer. Không import `environment`, `app/shared` hay private source của host/module khác. Phần dùng xuyên module thuộc package/library độc lập.
3. **Configuration và DI có scope.** Token/type nằm trong `configurations/mdm.configuration.ts`; hàm provider nằm ở `provide-mdm-configuration.ts` để tránh vòng import. Mẫu đăng ký configuration/service chung ở route module, service riêng ở route feature. Không mặc định dùng `providedIn: 'root'` hoặc tạo NgModule chỉ để đăng ký provider.
4. **Path không lặp feature.** Dùng `features/product/pages/list`, `detail`, `create`, `update`; tách page theo tác vụ. Drawer nằm ở `components/detail-side-drawer`, `create-side-drawer`, `update-side-drawer`. Không bắt buộc có cả page lẫn drawer cho mỗi tác vụ.
5. **Component nhỏ theo trách nhiệm.** Màn lớn tách phần nhỏ với input/output thực sự cần. Nhập/sửa dùng hậu tố `-form`, chỉ đọc dùng `-view`, ví dụ `general-information-form`/`general-information-view`. Không dùng tên `facts`.
6. **Services theo owner.** Base service ở module; feature có `services/api.service.ts` và `api.model.ts`. Không tạo facade/store hoặc abstraction khi chưa có nhu cầu.
7. **Assets ở module và feature.** Các nhóm được phép: `images`, `icons`, `fonts`, `styles`, `templates`, `documents`; chỉ tạo khi có nội dung. Style riêng đặt cạnh component. Tài nguyên được namespace và nhận base URL qua configuration; SCSS dùng chung không tự rò CSS global.
8. **Test tự chứa theo owner.** Unit/component/service `*.spec.ts` cạnh source; integration phối hợp nhiều phần ở `testing/integration`; `testing/{fixtures,mocks,helpers}` cho support. E2E nghiệp vụ ở module/feature, E2E root dành cho Portal và flow xuyên module. Browser suite dùng `*.e2e-spec.ts`, discovery tách khỏi Angular specs. Không đưa fixture/mock vào production assets hoặc runtime public entry.

Chi tiết chính thức nằm ở [Project structure](angular/project-structure.md) và các tài liệu được link từ mục lục Angular.

## Đã hoàn thành

| Tài liệu | Nội dung hiện có |
| --- | --- |
| [Project structure](angular/project-structure.md) | Cây thư mục, ownership, naming, public API, assets, spec/integration/E2E |
| [Configuration](angular/configuration.md) | Interface/token, `provideMdmConfiguration`, public entry, scope DI |
| [Routing](angular/routing.md) | Module/feature routes, host lazy integration, bootstrap mẫu |
| [Services](angular/services.md) | Resource URL, base API, asset service, feature API/DTO |
| [Assets](angular/assets.md) | Namespace, static resource/build-copy và SCSS mẫu |
| [Testing](angular/testing.md) | Naming, colocated spec, test support, E2E ownership, discovery/tsconfig và output |
| [UI patterns](angular/ui-patterns.md) | Mới có phạm vi, contract route và ranh giới; chưa có implementation Core UI |

Các mẫu code nền tảng nằm trực tiếp trong block Markdown có marker `<!-- example: src/... -->`. Bộ kiểm chứng trích từ đây; không duy trì một bản source mẫu thứ hai.

## Kiểm chứng đã chạy

[validation/angular-foundation](validation/angular-foundation/README.md) kiểm chứng code mẫu, không phải suite test của ứng dụng mà Blueprint mô tả.

Lần chạy gần nhất trước handoff, trên Node `24.19.0`:

- 10 tài liệu Markdown, 21 liên kết nội bộ: PASS.
- 13 mẫu TypeScript với Angular `22.1.6`/TypeScript `6.0.3`, strict type-check: PASS.
- 3 mẫu SCSS compile bằng Sass: PASS.
- Angular DI với hai module configuration độc lập, scope feature service: PASS.
- HttpClient URL/query/body/error propagation và asset URL: PASS, dùng backend giả lập.
- Lazy-route/public entry/provider boundary: PASS.
- Hai fragment JSON của hướng dẫn testing parse thành công; `git diff --check`: PASS.

Chạy lại trên máy khác:

```sh
cd validation/angular-foundation
npm ci
npm run check
```

Chọn Node phù hợp `engines` trong package.json; dependencies được pin và có lockfile. `generated/` và `dist/` là output được ignore; sửa block Markdown nguồn nếu kiểm tra lỗi.

**Giới hạn:** năm component tối giản (AppComponent và bốn route target) chỉ được sinh làm fixture kiểm chứng. Chưa có Angular AOT template, DOM/Core UI rendering, browser/E2E thực tế, backend thật hoặc runtime microfrontend. Không copy fixture thành UI production hay báo cáo chúng là UI pattern đã hoàn thành. Tài liệu Testing mới mô tả cấu trúc/quy tắc, chưa triển khai runner/suite ứng dụng.

## Phần tiếp theo

- Tiếp tục review cấu trúc theo phản hồi của người dùng; phần test vừa được bổ sung trong commit `ca9faa7`.
- Xây dựng code mẫu UI trong `angular/ui-patterns.md`, theo pattern đang được làm: list/detail/create/update, drawer và các nhóm form/view. Đối chiếu `portal-template` cùng API `@sdcorejs/angular` đúng version trước khi viết.
- Mỗi pattern cần nêu khi dùng, data/input/output, loading/empty/error, validation/save/dirty, permission, responsive và keyboard/focus khi có liên quan. Viết case kiểm chứng có giá trị cùng pattern.
- Khi thêm component mẫu thật, cập nhật boundary của validator: hiện `check.mjs` cố ý báo lỗi nếu component thật trùng route target fixture. Không xóa assertion hoặc giảm kiểm tra chỉ để PASS.
- HTML diễn giải, cơ chế phân phối/kích hoạt Blueprint, tích hợp microfrontend runtime và Blueprint NestJS/React vẫn là phần chưa triển khai.

## Lưu ý cho phiên tiếp theo

Đọc handoff, mục lục Angular và tài liệu liên quan trước khi sửa. Kiểm tra HEAD/PR mới nhất vì trạng thái có thể đã thay đổi sau ngày bàn giao. Báo đúng những kiểm tra thực sự chạy; giữ nguyên ranh giới giữa code nền tảng đã kiểm chứng và UI/browser chưa triển khai.
