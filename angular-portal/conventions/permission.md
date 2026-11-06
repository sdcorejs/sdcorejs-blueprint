# Phân quyền: G/C/A và phạm vi dữ liệu

Trạng thái: bản nháp, chờ review. Bổ sung cho [Permission theo consumer](../project-structure/routes.md#permission-theo-consumer) và quy tắc `*sdPermission` trong [UI patterns](../ui-patterns.md#quy-tắc-ui-dùng-chung).

## Mã quyền

Mẫu `<MODULE>_<ENTITY>_<TYPE>_<ACTION>`, viết UPPER_SNAKE_CASE.

| TYPE | Vai trò | Nơi kiểm tra |
| --- | --- | --- |
| C | Quyền frontend | Menu, route, action trên UI |
| A | Quyền backend | API |
| G | Nhóm nghiệp vụ | Lựa chọn gán vào Role trên UI của end user |

```text
Role: Nhân viên kinh doanh
└── Tạo sản phẩm           MDM_PRODUCT_G_CREATE
    ├── Quyền FE           MDM_PRODUCT_C_CREATE
    └── Quyền BE           MDM_PRODUCT_A_CREATE
```

## Quy tắc

- Role editor của end user chỉ hiển thị nhóm G bằng nhãn nghiệp vụ, không hiển thị riêng FE/BE.
- Tập quyền hiệu lực là hợp các quyền của mọi nhóm còn gán. Bỏ một nhóm không xóa quyền mà nhóm khác còn cấp.
- Không suy mã C/A bằng cách thay ký tự trong mã G; một nhóm có thể chứa nhiều quyền.
- UI dùng `*sdPermission` với chuỗi quyền C; không gọi `permission.hasPermission(...)` trong biểu thức render.
- Route khai báo `data.permission`; kiểm tra bằng `canActivateChild: [SdPermissionGuard]` ở route cha. Detail và update đánh giá riêng.
- Backend kiểm A với principal đã xác thực, không tin danh sách quyền do browser gửi.

## Phạm vi dữ liệu

Có quyền action không đồng nghĩa xem được mọi bản ghi. Server kiểm cả quyền action và quan hệ giữa user với bản ghi cho list lẫn detail.

```text
allowed = hasPermission(user, 'MDM_PRODUCT_A_VIEW')
  && (record.ownerId === user.id || hasActiveAssignment(user.id, record.id))
```

- Assignment gắn với user, bản ghi cụ thể và trạng thái còn hiệu lực.
- Không lưu quyền toàn cục từ một task riêng; assignment hết hạn phải được thu hồi theo dữ liệu server.
- Chỉ lọc list ở frontend vẫn lộ dữ liệu qua API/detail.

Quy tắc phạm vi cụ thể do domain quyết định; đoạn trên là mã giả minh họa.

## Kiểm tra tự động

`no-restricted-syntax` kiểm chuỗi trong `permission:` khớp `MODULE_ENTITY_[C|A|G]_ACTION`; custom rule `local/no-permission-call-in-template` chặn `hasPermission()` trong template. Kiểm tra A thuộc backend. Xem [ESLint](eslint.md).

## Nghiệm thu

- [ ] Đúng thứ tự MODULE_ENTITY_TYPE_ACTION.
- [ ] UI gán Role chỉ có nhóm G.
- [ ] Route có data.permission; route cha có canActivateChild.
- [ ] Backend kiểm A và phạm vi bản ghi.
