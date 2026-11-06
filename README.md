# SDCoreJS Blueprint

Bộ quy ước, kiến trúc và mẫu triển khai cho các project trong hệ sinh thái SDCoreJS.

- [Angular Portal](angular-portal/README.md): kiến trúc Portal/backoffice với module/feature tự chứa, public configuration, routes, services, assets và tổ chức test.
- NestJS và React sẽ có nhóm Blueprint riêng khi được xây dựng.

Markdown là tài liệu tham khảo cho AI và developer và là nguồn quy tắc. [Site trực quan](https://sdcorejs.github.io/sdcorejs-blueprint/) trình bày lại cùng các quy tắc bằng hình, từng bước và code explorer; mã nguồn site ở [site/](site/README.md). Quy tắc đồng bộ Markdown ↔ UI nằm trong [AGENTS.md](AGENTS.md).

## Phạm vi hiện tại

Đã có [cấu trúc project Angular Portal/backoffice](angular-portal/project-structure/README.md) và các mẫu code nền tảng. Giao diện nghiệp vụ dùng Core UI thuộc [UI patterns](angular-portal/ui-patterns.md), được phát triển riêng.

Các ví dụ MDM/Product là tên minh họa, không phải module bắt buộc hoặc API backend đã tồn tại.

## Kiểm tra

- [Foundation](validation/angular-foundation/README.md): trích block Markdown, TypeScript/Sass, DI và HTTP.
- [Angular consumer](validation/angular-consumer/README.md): Core UI thật, production AOT, router integration và Playwright desktop/mobile; có CI chạy lại.
- [Site](site/README.md): `npm run check:sync` kiểm site khớp Markdown; build tĩnh và Playwright cho deep link, bàn phím, 390px, contrast.
