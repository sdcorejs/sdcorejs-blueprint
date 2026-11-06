# Naming và TypeScript

Trạng thái: bản nháp, chờ review. Bổ sung cho [Service và model](../project-structure/README.md#service-và-model) và [Services](../project-structure/services.md); khi hai nơi khác nhau, file trong project-structure được ưu tiên.

## Quy tắc

- Tên thể hiện vai trò: dữ liệu, sự kiện, hành động hay trạng thái.
- Không dùng tên chung chung `data`, `info`, `item`, `obj`, kể cả biến lặp.
- Type, Interface, Enum dùng PascalCase; không thêm tiền tố `I` hoặc `T`.
- Private field/method dùng cú pháp `#`.
- Kiểu khai báo ở API boundary; không dùng `any`.

## Hàm và method

Hàm đại diện cho một hành động, nên bắt đầu bằng động từ.

| Loại | Bắt đầu bằng | Ví dụ |
| --- | --- | --- |
| Đọc dữ liệu | get, fetch, read | getUserProfile(), fetchProducts() |
| Ghi/sửa dữ liệu | create, update, delete, remove, set, save | updateCart(), deletePost(), setTheme() |
| Xử lý sự kiện | on + hành động | onSave(), onExport(), onPrint() |
| Biến đổi dữ liệu | to, format, convert | formatCurrency(), convertToString() |
| Service entity | list, detail, create, update, delete, approve, reject | list(req), detail(id), delete(idOrIds) |

Output của component là sự kiện đã xảy ra: `saved`, `selected`. Không đặt tiền tố `on` cho output và không trùng tên sự kiện native như `click`, `change`.

## Boolean

| Tiền tố | Ngữ cảnh | Ví dụ |
| --- | --- | --- |
| is + tính từ / V-ing | Trạng thái hiện tại | isSaving, isValid, isEmpty |
| has + danh từ / V3 | Đã có hoặc đã hoàn thành | hasError, hasToken, hasSaved |
| should + động từ | Điều kiện có nên làm | shouldRedirect, shouldRender |
| can + động từ | Khả năng hoặc quyền | canEdit, canDelete |
| Từ đơn | Chỉ cho trạng thái toàn cục, phổ biến | loading, disabled, readonly |

Áp dụng cả cho `signal(false)`, `computed(() => …)` và `input<boolean>()`.

## Number và string

| Kiểu | Cách đặt | Ví dụ |
| --- | --- | --- |
| Số lượng tổng | tiền tố total hoặc hậu tố Count | totalPrice, userCount |
| Chỉ số vị trí | hậu tố Index | activeTabIndex |
| Giới hạn | tiền tố min / max | minAge, maxFileSize |
| Chuỗi ngày tháng | hậu tố At / Date | createdAt, birthDate |
| Định danh, đường dẫn | hậu tố Id / Url / Path | userId, avatarUrl, filePath |

## Array và object

- Array dùng số nhiều: `users`, `products`. Dùng `List` khi số nhiều bất quy tắc hoặc dễ hiểu lầm: `childList`. Mảng kiểu nguyên thủy dùng `Ids`, `Names`: `userIds`.
- Object là danh từ số ít thể hiện bản thể: `user`, không phải `data`.
- Object cấu hình có hậu tố `Config` hoặc `Options`: `chartConfig`, `requestOptions`.
- Biến lặp đặt theo phần tử: `for (const product of products)`.

## Type, model và enum

<!-- excerpt: src/modules/mdm/features/product/services/product.model.ts -->
```ts
export type ProductStatus = 'active' | 'inactive';

export const PRODUCT_STATUS_OPTIONS = [
  { id: 'active', name: 'Đang hoạt động' },
  { id: 'inactive', name: 'Ngừng hoạt động' },
] satisfies Array<{ id: ProductStatus; name: string }>;

export interface ProductDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
}
```

- Model đặt trong `<entity>.model.ts`; entity giữ hậu tố `Dto`, request `Req`, response `Res`.
- Ưu tiên union type + const options cho trạng thái. Khi vẫn cần enum: tên PascalCase số ít, member PascalCase.

```ts
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
}
```

## Kiểm tra tự động

Các quy tắc máy kiểm được nằm ở [ESLint](eslint.md): `@typescript-eslint/naming-convention`, `id-denylist`, `no-restricted-syntax` (private → `#`), `@angular-eslint/no-output-on-prefix`, `@typescript-eslint/no-explicit-any` và custom rule `local/signal-boolean-prefix`. Ý nghĩa của tên (Count, Index, At, Url…) kiểm bằng review.

## Nghiệm thu

- [ ] Hàm bắt đầu bằng động từ; service entity dùng list/detail/create/update/delete.
- [ ] Boolean có tiền tố is/has/should/can, trừ từ đơn toàn cục.
- [ ] Array dùng số nhiều, List hoặc Ids.
- [ ] Không dùng data, info, item, obj, kể cả biến lặp.
- [ ] Type/Interface/Enum PascalCase, không tiền tố I/T.
