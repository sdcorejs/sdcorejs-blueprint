import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { ProductService } from '../../services/product.service';
import type { ProductSaveReq, ProductStatus } from '../../services/product.model';
import { GeneralInformationFormComponent } from '../../components/general-information-form/general-information-form.component';

@Component({
  selector: 'create', changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, RouterLink, GeneralInformationFormComponent],
  template: `<sd-page title="Tạo sản phẩm">
    <div headerLeft class="d-flex align-items-center gap-8"><sd-button title="Quay lại" [routerLink]="['..']" /><span class="T20M">Tạo sản phẩm</span></div>
    <sd-button headerRight title="Lưu" type="fill" color="primary" [loading]="saving()" [disabled]="saving()" (click)="save()" />
    <div class="p-16"><general-information-form [form]="form" [seed]="seed" />
      @if (error()) { <p role="alert">{{ error() }}</p> }
    </div></sd-page>`,
})
export class CreateComponent {
  readonly #service = inject(ProductService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  protected readonly seed: ProductSaveReq = { code: '', name: '', status: 'active' };
  // Core controls register themselves via [form] + name. Do not pre-register duplicate controls.
  protected readonly form = new FormGroup<{ code?: FormControl<string>; name?: FormControl<string>; status?: FormControl<ProductStatus> }>({});
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  readonly #value = toSignal(this.form.events.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });
  readonly #dirty = computed(() => {
    const value = this.#value();
    return this.form.dirty && ((value.code ?? '') !== this.seed.code || (value.name ?? '') !== this.seed.name || value.status !== this.seed.status);
  });
  constructor() {
    const registration = inject(SdUnsavedChangesService).register({
      id: 'product-create', isDirty: this.#dirty,
      discard: () => { this.form.markAsPristine(); return true; },
    });
    inject(DestroyRef).onDestroy(() => registration.destroy());
  }
  protected async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) { this.error.set('Kiểm tra các trường bắt buộc.'); return; }
    this.saving.set(true); this.error.set('');
    try {
      const value = this.form.getRawValue();
      if (!value.code || !value.name || !value.status) return;
      const entity = await firstValueFrom(this.#service.create({ code: value.code, name: value.name, status: value.status }));
      this.form.markAsPristine();
      await this.#router.navigate(['..', entity.id, 'detail'], { relativeTo: this.#route });
    } catch { this.error.set('Không thể lưu. Dữ liệu đã nhập được giữ lại.'); }
    finally { this.saving.set(false); }
  }
}
