# Handoff — Angular Portal Blueprint

Cập nhật: 22/10/2026, Asia/Saigon. Tài liệu bàn giao để tiếp tục Blueprint.

## Điểm tiếp tục — màn detail, 22/10/2026

- Giữ nhánh `docs/angular-foundation-20261019`. Người dùng đã chốt phần list và yêu cầu commit/push các thay đổi hiện tại; bước thảo luận tiếp theo là màn detail.
- Project structure đã chuyển thành thư mục `angular-portal/project-structure/`; tài liệu routing đổi tên thành `routes.md`. Các liên kết và validator đã theo cấu trúc mới.
- Giữ các quy ước routes/services bên dưới: permission theo consumer, resolve entity bằng service của đúng entity trước detail/update; `detail`, `Req`/`Res`, `<entity>.model.ts`, tác vụ delete/approve/reject nhận một hoặc nhiều phần tử.
- List đơn giản chỉ có TS/HTML, selector `list`, private field/method dùng `#`, utility Core và wrapper `h-full p-8` theo CRM. Không mặc định tạo SCSS, `host.class`, `list-body`, `overflow-hidden`, hoặc khai báo `paginate`/`rowKey` khi chưa cần.
- UI permission dùng `*sdPermission`. Header có một wrapper `headerRight`, utility `d-flex align-items-center gap-8 flex-wrap`, action chính bên phải. Menu có permission riêng; từng action có permission nghiệp vụ, không suy quyền menu bằng OR quyền con.
- [UI patterns](angular-portal/ui-patterns.md) chứa mã giả TS/HTML và contract bố cục list. Mã giả Core paging là biến thể contract, chưa thay thế mẫu HTTP nền tảng chỉ hỗ trợ pageIndex/pageSize/keyword. Chưa có AOT/browser verification cho UI.
- Tham khảo đã đọc: portal-template với @sdcorejs/angular 22.3.1; portal-crm, màn masterdata/product với @sd-angular/core 19.0.0-beta.69. Giữ API/convention của consumer hiện tại, không sao chép import/permission cũ từ CRM.

### Kiểm chứng lại ngày 22/10/2026

- `npm run check` tại `validation/angular-foundation`: PASS, gồm 10 tài liệu Markdown/39 liên kết nội bộ, 13 mẫu TypeScript, 3 mẫu SCSS và 5 component fixture chỉ phục vụ kiểm chứng.
- Strict type-check, Sass, DI scope, HTTP contract và lazy-route boundary: PASS trên trạng thái tài liệu hiện tại.
- Core UI rendering/AOT/browser chưa chạy; sample list là mã giả để chốt convention, không nằm trong 13 mẫu TypeScript được type-check.

## Checkpoint WIP trên Annie — 20/10/2026 UTC

- Giữ nhánh `docs/angular-foundation-20261019`, tiếp tục PR #1. HEAD trước checkpoint: `e27b87a42b190bdb495a8c72b8aeecaddd482e5d`.
- Điểm dừng: đã đổi nhóm tài liệu `angular/` thành `angular-portal/`, làm rõ phạm vi Portal/backoffice và cập nhật liên kết cùng đường dẫn validator. Giữ nguyên các mẫu code nền tảng; đây là bản lưu công việc đang dở để chuyển máy.
- Chưa hoàn tất: implementation Core UI trong UI patterns, HTML diễn giải, phân phối/kích hoạt Blueprint và microfrontend runtime; xem phần tiếp theo bên dưới.
- Kiểm tra checkpoint: 11 tài liệu Markdown, 32 liên kết nội bộ và fence hợp lệ; `node --check validation/angular-foundation/check.mjs` và `git diff --check` PASS. Chưa chạy lại `npm ci` / `npm run check` vì checkout Annie chưa cài dependencies; các kết quả Angular/SCSS/runtime bên dưới thuộc handoff trước.
- Tiếp tục: clone hoặc cập nhật nhánh theo hướng dẫn bên dưới; đọc `angular-portal/README.md`, chạy `npm ci` rồi `npm run check` tại `validation/angular-foundation`, sau đó tiếp tục phần UI patterns theo phản hồi người dùng và API đúng version.

## Repo và branch

- Repository: https://github.com/sdcorejs/sdcorejs-blueprint
- Branch đang làm: `docs/angular-foundation-20261019`
- PR hiện tại: https://github.com/sdcorejs/sdcorejs-blueprint/pull/1 — đang mở, chưa merge tại thời điểm bàn giao.
- Commit trước checkpoint WIP trên Annie: `e27b87a42b190bdb495a8c72b8aeecaddd482e5d`.
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

Repo Blueprint độc lập chứa các quy tắc và mẫu triển khai cho SDCoreJS. Blueprint Angular dành cho Portal/backoffice nằm ở thư mục root `angular-portal/`; sau này có nhóm NestJS/React riêng. [angular-portal/README.md](angular-portal/README.md) là mục lục chung; nhóm [Project structure](angular-portal/project-structure/README.md) chứa cấu trúc và các tài liệu nền tảng liên quan, mỗi chủ đề là một file Markdown. UI patterns nằm riêng ở `angular-portal/ui-patterns.md`.

Markdown phục vụ AI/developer; HTML diễn giải trực quan sẽ được làm sau. Chưa chốt cách phân phối/kích hoạt Blueprint trong project, `sdcorejs-agent` hay package `sdcorejs-angular`. Không tự coi Blueprint là một skill đã cài hoặc một tính năng tự động của package.

Người dùng yêu cầu tham khảo thêm `portal-template`. Khi triển khai UI patterns, cần xác định đúng repo/branch `portal-template` và đọc code cùng API Core UI đúng version; chưa có source `portal-template` được đóng gói trong repo này.

## Các quyết định kiến trúc cần giữ

1. **Portal → module → feature.** `src/app` sở hữu shell/navigation/cấu hình triển khai; `src/modules/<module>` tự chứa nghiệp vụ, tài nguyên và test, hướng đến microfrontend. MDM/Product chỉ là tên ví dụ.
2. **Module tích hợp qua public contract.** Công bố routes, `provide<Module>Configuration` và kiểu configuration cần cho consumer. Không import `environment`, `app/shared` hay private source của host/module khác. Phần dùng xuyên module thuộc package/library độc lập.
3. **Configuration và DI có scope.** Token/type nằm trong `configurations/mdm.configuration.ts`; hàm provider nằm ở `provide-mdm-configuration.ts` để tránh vòng import. Mẫu đăng ký configuration/service chung ở route module, service riêng ở route feature. Không mặc định dùng `providedIn: 'root'` hoặc tạo NgModule chỉ để đăng ký provider.
4. **Path không lặp feature.** Dùng `features/product/pages/list`, `detail`, `create`, `update`; tách page theo tác vụ. Drawer nằm ở `components/detail-side-drawer`, `create-side-drawer`, `update-side-drawer`. Không bắt buộc có cả page lẫn drawer cho mỗi tác vụ.
5. **Component nhỏ theo trách nhiệm.** Màn lớn tách phần nhỏ với input/output thực sự cần. Nhập/sửa dùng hậu tố `-form`, chỉ đọc dùng `-view`, ví dụ `general-information-form`/`general-information-view`. Không dùng tên `facts`.
6. **Services theo owner.** Base service ở module; feature có `services/api.service.ts` và `<entity>.model.ts` (ví dụ `product.model.ts`), class theo entity như `ProductService`. Mặc định gom const, enum, type/interface, DTO và Req/Res liên quan vào file model; chỉ tách theo nhóm khi nội dung lớn hoặc trách nhiệm/phạm vi sử dụng riêng rõ ràng, tránh nhiều file nhỏ cho feature ít model. Đọc một bản ghi dùng `detail(id)`; model request/response dùng hậu tố `Req`/`Res`. `delete` nhận một ID hoặc mảng ID; `approve`/`reject` nhận một Req hoặc mảng Req chứa ID và dữ liệu tác vụ của từng bản ghi. Endpoint và response bulk theo consumer; phần bulk mới là mã giả, chưa có HTTP implementation trong mẫu kiểm chứng. Không tạo facade/store hoặc abstraction khi chưa có nhu cầu.
7. **Assets ở module và feature.** Các nhóm được phép: `images`, `icons`, `fonts`, `styles`, `templates`, `documents`; chỉ tạo khi có nội dung. Style riêng đặt cạnh component. Tài nguyên được namespace và nhận base URL qua configuration; SCSS dùng chung không tự rò CSS global.
8. **Test tự chứa theo owner.** Unit/component/service `*.spec.ts` cạnh source; integration phối hợp nhiều phần ở `testing/integration`; `testing/{fixtures,mocks,helpers}` cho support. E2E nghiệp vụ ở module/feature, E2E root dành cho Portal và flow xuyên module. Browser suite dùng `*.e2e-spec.ts`, discovery tách khỏi Angular specs. Không đưa fixture/mock vào production assets hoặc runtime public entry.
9. **Detail/update chuẩn bị entity trước activation.** Kiểm tra quyền vào route theo cơ chế consumer; resolver inject service của đúng entity (ví dụ ProductService), tải theo ID, kiểm tra quyền theo bản ghi nếu có rồi mới kích hoạt page. Không dùng generic API service trực tiếp trong resolver. Lỗi phải chuyển tới flow/trang lỗi tương ứng của consumer. Nếu dùng Core, gán chuỗi quyền trực tiếp vào `data.permission`, dùng guard đã cấu hình ở route cha; với Core 22.3.1, `SdPermissionGuard.canActivateChild` thực thi quyền, còn `canActivate` tải quyền. Contract nằm trong Routes; các block nền tảng chưa triển khai guard/resolver này.
10. **List tối giản theo Core/CRM.** Ưu tiên mặc định, utility và hai file TS/HTML. Không thêm CSS để che overflow. Header actions và menu dùng permission theo quy tắc ở checkpoint 22/10/2026; menu có mã quyền riêng. Chiều cao/scroll là contract cần kiểm chứng ở layout chung, chưa phải UI đã chạy.

Chi tiết chính thức nằm ở [Project structure](angular-portal/project-structure/README.md) và các tài liệu được link từ mục lục của nhóm này.

## Đã hoàn thành

| Tài liệu | Nội dung hiện có |
| --- | --- |
| [Project structure](angular-portal/project-structure/README.md) | Cây thư mục, ownership, naming, public API, assets, spec/integration/E2E |
| [Configuration](angular-portal/project-structure/configuration.md) | Interface/token, `provideMdmConfiguration`, public entry, scope DI |
| [Routes](angular-portal/project-structure/routes.md) | Module/feature routes, host lazy integration, contract quyền/tải entity/chuyển lỗi trước activation; guard/resolver consumer chưa triển khai |
| [Services](angular-portal/project-structure/services.md) | Resource URL, base API, asset service, feature API/DTO |
| [Assets](angular-portal/project-structure/assets.md) | Namespace, static resource/build-copy và SCSS mẫu |
| [Testing](angular-portal/project-structure/testing.md) | Naming, colocated spec, test support, E2E ownership, discovery/tsconfig và output |
| [UI patterns](angular-portal/ui-patterns.md) | Contract và mã giả list TS/HTML theo Core/CRM; header actions/menu có permission riêng, ưu tiên defaults/utility, quick search + inline filter; tabs/score card/external filter optional. Chưa có implementation/browser verification |

Các mẫu code nền tảng nằm trực tiếp trong block Markdown có marker `<!-- example: src/... -->`. Bộ kiểm chứng trích từ đây; không duy trì một bản source mẫu thứ hai.

## Kiểm chứng nền tảng từ handoff trước

[validation/angular-foundation](validation/angular-foundation/README.md) kiểm chứng code mẫu, không phải suite test của ứng dụng mà Blueprint mô tả.

Theo handoff trước, chạy trên Node `24.19.0` (chưa chạy lại trong checkpoint WIP này):

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

- Tiếp tục thảo luận màn detail với người dùng; kế thừa quy ước route resolver/entity preload và permission đã chốt. Không tự coi list là UI đã triển khai.
- Cụ thể hóa các mẫu detail/create/update, drawer và nhóm form/view trong `angular-portal/ui-patterns.md` theo phản hồi tiếp theo. Đối chiếu `portal-template` cùng API `@sdcorejs/angular` đúng version trước khi viết.
- Mỗi pattern cần nêu khi dùng, data/input/output, loading/empty/error, validation/save/dirty, permission, responsive và keyboard/focus khi có liên quan. Viết case kiểm chứng có giá trị cùng pattern.
- Khi thêm component mẫu thật, cập nhật boundary của validator: hiện `check.mjs` cố ý báo lỗi nếu component thật trùng route target fixture. Không xóa assertion hoặc giảm kiểm tra chỉ để PASS.
- HTML diễn giải, cơ chế phân phối/kích hoạt Blueprint, tích hợp microfrontend runtime và Blueprint NestJS/React vẫn là phần chưa triển khai.

## Lưu ý cho phiên tiếp theo

Đọc handoff, mục lục Angular Portal và tài liệu liên quan trước khi sửa. Kiểm tra HEAD/PR mới nhất vì trạng thái có thể đã thay đổi sau ngày bàn giao. Báo đúng những kiểm tra thực sự chạy; giữ nguyên ranh giới giữa code nền tảng đã kiểm chứng và UI/browser chưa triển khai.
