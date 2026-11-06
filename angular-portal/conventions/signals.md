# Signals và Component APIs

Trạng thái: bản nháp, chờ review. Áp dụng cho component standalone dùng signal APIs của Angular.

## Quy tắc

- Dữ liệu đi xuống bằng `input()`, sự kiện đi lên bằng `output()`.
- `model()` dùng khi cần two-way binding giữa parent và child.
- Giá trị dẫn xuất dùng `computed()`; không dùng `effect()` để đồng bộ một giá trị tính được.
- `output()` là emitter, không phải Signal.
- `viewChild()`/`viewChildren()` là signal query; vẫn có thể chưa có phần tử, phải kiểm tra trước khi dùng.
- Không sửa object của input tại chỗ rồi kỳ vọng signal nhận thay đổi.

## Mẫu

<!-- example: src/modules/mdm/features/order/components/order-line/order-line.component.ts -->
```ts
import { Component, ElementRef, computed, input, model, output, viewChild } from '@angular/core';

@Component({
  selector: 'order-line',
  templateUrl: './order-line.component.html',
})
export class OrderLineComponent {
  readonly unitPrice = input.required<number>();
  readonly quantity = model(1);
  readonly total = computed(() => this.unitPrice() * this.quantity());
  readonly added = output<number>();
  readonly #quantityInput = viewChild<ElementRef<HTMLInputElement>>('quantityInput');

  onAdd(): void {
    this.added.emit(this.total());
  }

  focusQuantity(): void {
    this.#quantityInput()?.nativeElement.focus();
  }
}
```

Parent truyền đơn giá, giữ số lượng qua two-way binding và nhận sự kiện:

```html
<order-line [unitPrice]="price()" [(quantity)]="quantity" (added)="onAdded($event)" />
```

## Đúng / Sai

| Đúng | Tránh |
| --- | --- |
| `total = computed(() => price() * quantity())` | `effect(() => total.set(price() * quantity()))` |
| `this.#quantityInput()?.nativeElement.focus()` | Gọi `nativeElement` khi query có thể chưa có phần tử |

## Kiểm tra tự động

`@angular-eslint/prefer-signals`, `@angular-eslint/prefer-output-readonly` và custom rule `local/no-set-in-effect` (warn). Xem [ESLint](eslint.md).

## Demo

Demo chạy thật nằm ở portal-template: `/instruction/modern-angular/signals`.

## Nghiệm thu

- [ ] Giá trị dẫn xuất dùng computed.
- [ ] Sự kiện nghiệp vụ dùng output.
- [ ] Query có guard khi truy cập.
