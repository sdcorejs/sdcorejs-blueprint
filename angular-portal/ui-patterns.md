# UI patterns

Trạng thái: Phạm vi và ranh giới đã xác định; implementation Core UI sẽ được xây dựng ở bước riêng.

## Sở hữu nội dung

UI patterns là nơi đặt mẫu page/drawer có sử dụng component Core UI:

- List với sd-page, sd-table, search/filter, selection và actions.
- Detail với identity, thông tin chỉ đọc và related records.
- Create/update với nhóm trường, validation, dirty và save flow.
- Detail/create/update side drawer.
- Component con theo nhóm nghiệp vụ, có hậu tố -form hoặc -view.
- Loading/empty/error, responsive, keyboard/focus và permission UI.

Các mẫu này không nằm trong project-structure hoặc tài liệu nền tảng để tránh trộn kiến trúc với implementation giao diện.

## Ranh giới với các tài liệu hiện tại

| Nội dung | Owner |
| --- | --- |
| File được đặt ở đâu, ownership và public API | project-structure |
| Token/provider và scope DI | configuration |
| URL và lazy route tới page | routing |
| DTO, API service, base service và asset URL | services |
| Tài nguyên, SCSS, build copy | assets |
| Vị trí spec/E2E, test support và runner discovery | testing |
| Template/Core components và tương tác màn hình | UI patterns |

## Contract đích của các route mẫu

| File đích | Export dự kiến | Tác vụ |
| --- | --- | --- |
| features/product/pages/list/list.component.ts | ListComponent | Danh sách |
| features/product/pages/detail/detail.component.ts | DetailComponent | Xem chi tiết |
| features/product/pages/create/create.component.ts | CreateComponent | Tạo mới |
| features/product/pages/update/update.component.ts | UpdateComponent | Cập nhật |

Drawer nằm tại components/detail-side-drawer, components/create-side-drawer, components/update-side-drawer; không dùng một drawer tổng quát chứa cả ba mode.

Chỉ tạo page/drawer mà đặc tả thực sự cần. Không mặc định tạo mọi biến thể cho mỗi feature.

## Điều kiện khi bổ sung mẫu

Đối chiếu đúng version @sdcorejs/angular của project. Mỗi pattern phải nêu khi dùng, API dữ liệu, input/output, state, permission, URL nếu có, responsive và cách kiểm chứng.

Spec của component đặt cạnh source; E2E của pattern nằm trong scope feature/module theo [Testing](testing.md). Mỗi pattern nêu các case có giá trị như validation, save failure, dirty guard, direct URL, keyboard/focus; không sinh spec rỗng hoặc lặp lại cùng một case ở mọi tầng.

Component route trong validation hiện là fixture không có Core UI. Không copy fixture đó thành page production hoặc coi đó là UI pattern đã có.

Nguồn tham khảo sẽ tiếp tục là portal-template cùng public docs đúng version Core, sau khi chọn pattern cụ thể.
