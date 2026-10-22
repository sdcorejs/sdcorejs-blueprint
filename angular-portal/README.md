# Angular Portal Blueprint

## Phạm vi

Dành cho ứng dụng Portal/backoffice xây bằng Angular, có module nghiệp vụ tự chứa, hướng đến microfrontend. Module tích hợp với Portal qua public entry, routes và configuration, không phụ thuộc source riêng của host.

MDM/Product chỉ là ví dụ. Quy ước này không tự động tạo cơ chế remote loading, federation hoặc deploy độc lập; phần tích hợp runtime sẽ được đặc tả riêng.

## Đọc theo công việc

| Tài liệu | Khi nào đọc |
| --- | --- |
| [Project structure](project-structure/README.md) | Cấu trúc project/module/feature và các chủ đề configuration, routes, services, assets, testing |
| [UI patterns](ui-patterns.md) | Page/drawer và component nghiệp vụ có sử dụng Core UI |

Trước khi viết code: đọc [Project structure](project-structure/README.md), sau đó chọn tài liệu liên quan từ mục lục của nhóm này. Không suy API Core UI từ tên component hoặc từ ví dụ Angular thuần.

## Quy tắc chung

- Module sở hữu toàn bộ code nghiệp vụ, tài nguyên và test nghiệp vụ của mình.
- Không import environment, app/shared của Portal hoặc private file của module khác.
- Tái sử dụng Core UI và dependency đã khai báo; phần dùng xuyên module nằm trong package/library có public contract.
- Mỗi page/drawer phục vụ một tác vụ cụ thể. Màn lớn chia component theo trách nhiệm, có input/output cần thiết.
- Tạo thư mục/file khi có nội dung và consumer thực tế.
- Ưu tiên mặc định và utility của Core; chỉ khai báo cấu hình hoặc custom style khi có nhu cầu cụ thể. Màn list đơn giản chỉ cần TS/HTML, không mặc định tạo SCSS.
- Nhóm thông tin/form dùng `sd-section`; detail có thể dùng `sd-view` hoặc `sd-section-item` bên trong. Button thường dùng `sm`, giữ default khi Core đã cung cấp. Header detail có trạng thái cạnh title và tối đa hai dòng.
- Page dùng back ở `headerLeft`, drawer dùng X của Core; không thêm nút Hủy/Đóng lặp lại. Drawer có action nghiệp vụ ở footer và bảo vệ draft qua close guard. Các bố cục, save flow và điểm còn cần chốt nằm trong UI patterns.
- Private field/method dùng cú pháp `#`. Component chỉ dùng làm route page có thể dùng selector ngắn như `list`.
- Permission trong template dùng `*sdPermission` với chuỗi quyền; không gọi `permission.hasPermission(...)` trong biểu thức render. Event handler vẫn gọi qua `(click)` hoặc event tương ứng.
- MUST là yêu cầu của Blueprint trong phạm vi đã áp dụng; SHOULD là mặc định có thể thay đổi với lý do rõ.

## Code mẫu và kiểm chứng

Mẫu nền tảng dùng Angular 22.1.6/TypeScript 6.0.3 làm baseline kiểm tra; đây không phải yêu cầu mọi project phải nâng cấp lên đúng phiên bản đó.

Code được đặt trong các block có nhãn đường dẫn. [Bộ kiểm chứng](../validation/angular-foundation/README.md) trích các block trực tiếp, type-check cùng Angular thật và kiểm tra DI/HTTP. Component đích của route được thay bằng fixture tối giản **chỉ trong kiểm chứng**; chưa có implementation UI nghiệp vụ.

Không có mẫu Core UI list/detail/form/drawer được tuyên bố hoàn thành ở phần nền tảng này.
