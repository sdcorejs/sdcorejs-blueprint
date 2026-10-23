import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { ProductService } from '../../services/product.service';
import type { ProductDto, ProductStatus } from '../../services/product.model';
import { GeneralInformationFormComponent } from '../../components/general-information-form/general-information-form.component';

@Component({
  selector: 'update', changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, RouterLink, GeneralInformationFormComponent],
  template: `<sd-page [title]="title()">
    <div headerLeft class="d-flex align-items-center gap-8"><sd-button title="Quay lại" [routerLink]="['../detail']" /><span class="T20M">{{ title() }}</span></div>
    <sd-button headerRight title="Lưu" type="fill" color="primary" [loading]="saving()" [disabled]="saving()" (click)="save()" />
    <div class="p-16"><general-information-form [form]="form" [seed]="entity()" [editing]="true" />
      @if (error()) { <p role="alert">{{ error() }}</p> }
    </div></sd-page>`,
})
export class UpdateComponent {
  readonly entity = input.required<ProductDto>();
  readonly #service = inject(ProductService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  protected readonly title = computed(() => 'Cập nhật sản phẩm #' + this.entity().code);
  protected readonly form = new FormGroup<{ code?: FormControl<string>; name?: FormControl<string>; status?: FormControl<ProductStatus> }>({});
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  readonly #value = toSignal(this.form.events.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });
  readonly #dirty = computed(() => {
    const value = this.#value();
    const seed = this.entity();
    return this.form.dirty && (value.code !== seed.code || value.name !== seed.name || value.status !== seed.status);
  });
  constructor() {
    effect(() => {
      const entity = this.entity();
      this.form.reset({ code: entity.code, name: entity.name, status: entity.status });
      this.form.controls.code?.disable();
      this.error.set('');
    });
    const registration = inject(SdUnsavedChangesService).register({
      id: 'product-update', isDirty: this.#dirty,
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
      if (!value.name || !value.status) return;
      await firstValueFrom(this.#service.update(this.entity().id, { code: this.entity().code, name: value.name, status: value.status }));
      this.form.markAsPristine();
      await this.#router.navigate(['../detail'], { relativeTo: this.#route });
    } catch { this.error.set('Không thể lưu. Dữ liệu đã nhập được giữ lại.'); }
    finally { this.saving.set(false); }
  }
}
