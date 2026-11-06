# Accessibility

Trạng thái: bản nháp, chờ review. Áp dụng cho template của page, drawer và component trong module.

## Quy tắc

- `button` cho hành động, `a` cho điều hướng; không dùng `div (click)` làm nút.
- `button` luôn có `type`.
- Ảnh thông tin có `alt` mô tả nội dung; ảnh trang trí dùng `alt=""`. Quyết định theo ý nghĩa của ảnh, không theo nơi dữ liệu ảnh được trả về.
- `iframe` có `title`.
- Table có `caption` và `th scope`.
- Kết quả thao tác async được thông báo qua vùng `role="status"`.
- Không dùng màu làm dấu hiệu trạng thái duy nhất.
- Code block dài cuộn trong khối của nó, không đẩy layout ngang.

## Mẫu

```html
<button type="button" (click)="onSave()">Lưu</button>
<a routerLink="/mdm/product">Danh sách sản phẩm</a>
<iframe title="Ví dụ component" src="/example"></iframe>

<table>
  <caption>Sản phẩm phụ trách</caption>
  <thead><tr><th scope="col">Mã</th><th scope="col">Tên</th></tr></thead>
</table>

<p role="status" aria-live="polite">{{ message() }}</p>
```

## Kiểm tra tự động

`angular.configs.templateAccessibility` đã bật trong consumer: `template/alt-text`, `click-events-have-key-events`, `interactive-supports-focus`, `table-scope`… Bổ sung `template/button-has-type` và custom rule `local/iframe-has-title`. Caption, aria-live và thứ tự Tab kiểm bằng review. Xem [ESLint](eslint.md).

## Demo

Demo markup trước/sau nằm ở portal-template: `/instruction/coding-convention/quality`.

## Nghiệm thu

- [ ] Thao tác được bằng bàn phím; focus thấy rõ.
- [ ] Ảnh và iframe có tên phù hợp.
- [ ] Table có caption và headers.
- [ ] Loading/error được thông báo.
