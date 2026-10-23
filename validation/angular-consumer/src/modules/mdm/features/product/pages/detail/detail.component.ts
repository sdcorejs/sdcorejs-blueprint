import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import type { ProductDto } from '../../services/product.model';

@Component({
  selector: 'detail', changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageComponent, SdButton, SdSection, SdSectionItem, SdView, SdPermissionDirective],
  template: `
    <sd-page [title]="title()">
      <div headerLeft class="d-flex align-items-center gap-8">
        <sd-button title="Quay lại" [routerLink]="['../..']" queryParamsHandling="preserve" />
        <span class="T20M">{{ title() }}</span>
      </div>
      <div headerRight><sd-button *sdPermission="'MDM_PRODUCT_C_UPDATE'" title="Cập nhật" [routerLink]="['../update']" type="fill" color="primary" /></div>
      <div class="p-16">
        <sd-section title="Thông tin chung"><div class="d-flex flex-column gap-16 p-16">
          <sd-view label="Tên sản phẩm" [display]="entity().name" />
          <sd-section-item label="Trạng thái"><sd-view [display]="entity().status" /></sd-section-item>
        </div></sd-section>
      </div>
    </sd-page>
  `,
})
export class DetailComponent {
  readonly entity = input.required<ProductDto>();
  protected readonly title = computed(() => 'Chi tiết sản phẩm #' + this.entity().code);
}
