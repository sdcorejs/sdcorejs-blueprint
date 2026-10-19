# Angular Blueprint

## Phạm vi

Dành cho project Angular có module nghiệp vụ tự chứa, hướng đến microfrontend. Module tích hợp với Portal qua public entry, routes và configuration, không phụ thuộc source riêng của host.

MDM/Product chỉ là ví dụ. Quy ước này không tự động tạo cơ chế remote loading, federation hoặc deploy độc lập; phần tích hợp runtime sẽ được đặc tả riêng.

## Đọc theo công việc

| Tài liệu | Khi nào đọc |
| --- | --- |
| [Project structure](project-structure.md) | Khởi tạo project/module/feature hoặc quyết định vị trí code |
| [Configuration](configuration.md) | Khai báo token, public provider và scope DI |
| [Routing](routing.md) | Tích hợp module và route list/create/detail/update |
| [Services](services.md) | Base API service, service/model của feature, asset URL |
| [Assets](assets.md) | Tài nguyên và CSS/SCSS ở module/feature |
| [UI patterns](ui-patterns.md) | Page/drawer và component nghiệp vụ có sử dụng Core UI |

Trước khi viết code: đọc project-structure, sau đó chỉ đọc các tài liệu liên quan. Không suy API Core UI từ tên component hoặc từ ví dụ Angular thuần.

## Quy tắc chung

- Module sở hữu toàn bộ code nghiệp vụ và tài nguyên của mình.
- Không import environment, app/shared của Portal hoặc private file của module khác.
- Tái sử dụng Core UI và dependency đã khai báo; phần dùng xuyên module nằm trong package/library có public contract.
- Mỗi page/drawer phục vụ một tác vụ cụ thể. Màn lớn chia component theo trách nhiệm, có input/output cần thiết.
- Tạo thư mục/file khi có nội dung và consumer thực tế.
- MUST là yêu cầu của Blueprint trong phạm vi đã áp dụng; SHOULD là mặc định có thể thay đổi với lý do rõ.

## Code mẫu và kiểm chứng

Mẫu nền tảng dùng Angular 22.1.6/TypeScript 6.0.3 làm baseline kiểm tra; đây không phải yêu cầu mọi project phải nâng cấp lên đúng phiên bản đó.

Code được đặt trong các block có nhãn đường dẫn. [Bộ kiểm chứng](../validation/angular-foundation/README.md) trích các block trực tiếp, type-check cùng Angular thật và kiểm tra DI/HTTP. Component đích của route được thay bằng fixture tối giản **chỉ trong kiểm chứng**; chưa có implementation UI nghiệp vụ.

Không có mẫu Core UI list/detail/form/drawer được tuyên bố hoàn thành ở phần nền tảng này.
