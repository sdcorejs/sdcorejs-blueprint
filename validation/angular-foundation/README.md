# Kiểm chứng mẫu Angular Portal nền tảng

## Chạy

```sh
cd validation/angular-foundation
npm ci
npm run check
```

Dùng Node theo engines trong package.json. Dependency được pin và có package-lock.json.

## Kiểm tra gì

1. Liên kết Markdown nội bộ và fence.
2. Đọc các tài liệu [Angular Portal](../../angular-portal/README.md), bao gồm thư mục con [Project structure](../../angular-portal/project-structure/README.md), và trích trực tiếp các block <!-- example: src/... -->.
3. Type-check TypeScript với Angular/RxJS thật ở chế độ strict.
4. Compile SCSS qua Sass.
5. Kiểm tra hai scope module có cấu hình độc lập, feature service không rò ra root.
6. Kiểm tra HTTP URL/query/body, giữ lỗi HTTP và asset URL theo configuration.
7. Resolve callback lazy route/public entry với provider boundary thực.

generated và dist chỉ là dữ liệu sinh ra, được ignore. Không sửa bản sinh để làm kiểm tra xanh; sửa block code nguồn trong Markdown.

## Giới hạn

- Component đích của route và AppComponent là fixture tối giản được sinh riêng cho verification.
- Không render DOM, không AOT template, không chạy browser hoặc kiểm tra Core UI.
- Mã giả list TS/HTML trong UI patterns không có marker example, không thuộc các mẫu TypeScript được type-check; contract Core paging ở đó cần được consumer tích hợp riêng.
- Fixture không phải code page nghiệp vụ và không được copy vào UI patterns.
- Đây không phải một Angular app hoàn chỉnh hay cơ chế microfrontend runtime.
- Không thực hiện request tới backend thật; HttpClient thật đi qua backend giả lập có thể điều khiển.
- Các chữ ký/cách gọi delete, approve, reject nhận đơn hoặc mảng trong [Services](../../angular-portal/project-structure/services.md) là mã giả, chưa có HTTP implementation hay kiểm chứng bulk. Bộ hiện tại kiểm tra list/detail/create/update của ProductService.
- Kiểm tra callback lazy route/DI không xác nhận thứ tự activation của router, quyền truy cập hoặc chuyển trang lỗi. Contract [route có ID](../../angular-portal/project-structure/routes.md) và các [case router integration](../../angular-portal/project-structure/testing.md) cần được triển khai/kiểm chứng với guard, resolver và error mapping của consumer.
