import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSection } from '@sdcorejs/angular/components/section';
import type { ProductSaveReq } from '../../services/product.model';
import { ProductStatusSelectComponent } from '../product-status-select/product-status-select.component';

@Component({
  selector: 'general-information-form', imports: [SdInput, SdSection, ProductStatusSelectComponent], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-section title="Thông tin chung"><div class="d-flex flex-column gap-16 p-16">
    <sd-input label="Mã sản phẩm" name="code" [form]="form()" [model]="seed().code" [disabled]="editing()" required />
    <sd-input label="Tên sản phẩm" name="name" [form]="form()" [model]="seed().name" required />
    <product-status-select [form]="form()" [status]="seed().status" />
  </div></sd-section>`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<FormGroup>();
  readonly seed = input.required<ProductSaveReq>();
  readonly editing = input(false);
}
