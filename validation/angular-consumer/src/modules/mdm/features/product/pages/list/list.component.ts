import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';
import { AssetService } from '../../../../services/asset.service';

@Component({
  selector: 'list', templateUrl: './list.component.html', changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageComponent, SdButton, SdTable, SdTableCellDefDirective, SdPermissionDirective],
})
export class ListComponent {
  readonly #service = inject(ProductService);
  // The route guard has loaded permissions; Core 22.3.1's directive has no else template.
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('MDM_PRODUCT_C_DETAIL');
  protected readonly assetUrl = inject(AssetService).url('documents', 'consumer.txt');
  protected readonly tableOption: SdTableOption<ProductDto> = {
    type: 'server',
    // The foundation API supports only paging + keyword: unsupported controls stay disabled.
    items: request => firstValueFrom(this.#service.list({ pageIndex: request.pageNumber, pageSize: request.pageSize, keyword: request.quickSearch?.term })),
    sort: { enable: false },
    filter: { hideInlineFilter: true, quickSearch: { containFields: ['code', 'name'], placeholder: 'Tìm theo mã hoặc tên sản phẩm' } },
    columns: [
      { field: 'code', title: 'Mã sản phẩm', type: 'string', width: '180px' },
      { field: 'name', title: 'Tên sản phẩm', type: 'string', minWidth: '240px' },
      { field: 'status', title: 'Trạng thái', type: 'string', width: '180px' },
    ],
  };
}
