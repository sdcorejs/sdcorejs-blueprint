import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { PRODUCT_STATUS_OPTIONS, type ProductStatus } from '../../services/product.model';

@Component({
  selector: 'product-status-select', imports: [SdSelect], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-select label="Trạng thái" name="status" [form]="form()" [model]="status()" [items]="options" valueField="id" displayField="name" required />`,
})
export class ProductStatusSelectComponent {
  readonly form = input.required<FormGroup>();
  readonly status = input.required<ProductStatus>();
  protected readonly options = PRODUCT_STATUS_OPTIONS;
}
