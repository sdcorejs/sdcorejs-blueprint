# UI patterns

Trạng thái: Đã chốt quy ước và mã giả TS/HTML cho màn list, gồm header actions và permission riêng cho menu. Chưa triển khai page chạy thực tế hoặc kiểm chứng browser. Phần tiếp theo là màn detail.

## Sở hữu nội dung

UI patterns là nơi đặt mẫu page/drawer có sử dụng component Core UI:

- List với sd-page, sd-table, search/filter, selection và actions.
- Detail với identity, thông tin chỉ đọc và related records.
- Create/update với nhóm trường, validation, dirty và save flow.
- Detail/create/update side drawer.
- Component con theo nhóm nghiệp vụ, có hậu tố -form hoặc -view.
- Loading/empty/error, responsive, keyboard/focus và permission UI.

Các mẫu này không nằm trong project-structure hoặc tài liệu nền tảng để tránh trộn kiến trúc với implementation giao diện.

## Ranh giới với các tài liệu hiện tại

| Nội dung | Owner |
| --- | --- |
| File được đặt ở đâu, ownership và public API | [Project structure](project-structure/README.md) |
| Token/provider và scope DI | [Configuration](project-structure/configuration.md) |
| URL, quyền vào route, tải entity và chuyển lỗi trước activation | [Routes](project-structure/routes.md) |
| DTO, API service, base service và asset URL | [Services](project-structure/services.md) |
| Tài nguyên, SCSS, build copy | [Assets](project-structure/assets.md) |
| Vị trí spec/E2E, test support và runner discovery | [Testing](project-structure/testing.md) |
| Template/Core components và tương tác màn hình | UI patterns |

## Contract đích của các route mẫu

| File đích | Export dự kiến | Tác vụ |
| --- | --- | --- |
| features/product/pages/list/list.component.ts | ListComponent | Danh sách |
| features/product/pages/detail/detail.component.ts | DetailComponent | Xem chi tiết |
| features/product/pages/create/create.component.ts | CreateComponent | Tạo mới |
| features/product/pages/update/update.component.ts | UpdateComponent | Cập nhật |

Drawer nằm tại components/detail-side-drawer, components/create-side-drawer, components/update-side-drawer; không dùng một drawer tổng quát chứa cả ba mode.

Chỉ tạo page/drawer mà đặc tả thực sự cần. Không mặc định tạo mọi biến thể cho mỗi feature.

## List — bố cục chuẩn

Thứ tự các vùng: page header → tabs nếu có → score card nếu có → external filter khi cần → quick search → table với inline filter theo column. Ưu tiên quick search kết hợp inline filter; external filter dành cho điều kiện cần hiển thị riêng theo nghiệp vụ.

| Vùng | Quy ước |
| --- | --- |
| Page header | Dùng header của sd-page cho tiêu đề, mô tả và actions; action theo permission của consumer |
| Tabs, nếu có | Nằm sát dưới header, nền trắng đồng nhất với header; không thêm padding/margin/gap bao quanh thanh tab. Chỉ padding phần body trong tab; giữ kích thước vùng bấm của nhãn tab theo Core |
| Score card, optional | Nằm đầu body; dùng sd-card của Core UI, kết hợp sd-card-group khi các card là lựa chọn lọc. Không tạo vùng trống khi không có score card |
| External filter | Nằm sau score card và trước quick search; chỉ thêm các điều kiện cần thiết ngoài inline filter, có thể thu gọn khi nhiều điều kiện |
| Quick search | Ưu tiên thanh tìm kiếm gọn của sd-table, kết hợp bộ lọc tại column; không mặc định dựng thêm form tìm kiếm song song |
| Table | Nhận toàn bộ chiều cao còn lại của body. Header/inline filter và pagination vẫn hiển thị; dữ liệu dài cuộn trong viewport nội bộ của table |

Bố cục logic dưới đây không đòi hỏi mỗi vùng là một component/file riêng. External filter, quick search, inline filter và pagination ưu tiên dùng ngay trong sd-table:

```text
Page — chiều cao vùng nội dung Portal cấp
├─ Page header                           chiều cao theo nội dung
├─ Thanh tabs (optional)                 nền trắng, không padding ngoài
└─ Body / active tab body                chiếm phần chiều cao còn lại, có padding
   ├─ Score cards (optional)             chiều cao theo nội dung
   └─ sd-table                          chiếm phần chiều cao còn lại
      ├─ External filter (khi cần)
      ├─ Quick search
      ├─ Column header + inline filter
      ├─ Data viewport                  vùng cuộn dọc/ngang của bảng
      └─ Pagination                     giữ trong khung table
```

### Chiều cao và quyền sở hữu scroll

Các yêu cầu dưới đây thuộc layout chung của Portal/Core và là tiêu chí kiểm chứng khi tích hợp. Không biến chúng thành một bộ CSS phải sao chép vào từng feature. List đơn giản dùng cấu trúc `sd-page` → `div.h-full.p-8` → `sd-table` như CRM; không thêm `overflow-hidden`, `host.class`, `flex-1` hay SCSS riêng theo mặc định.

- Portal phải cấp chiều cao khả dụng xác định cho vùng route. Page chiếm 100% vùng đó; không đặt thêm 100vh cho page bên dưới shell/header của Portal.
- Layout theo cột: header/thanh tab/score card/filter chiếm chiều cao nội dung; body, active tab body và table dùng phần còn lại bằng flex hoặc grid tương đương. Không đặt body cao 100% rồi cộng thêm header/thanh tab bên ngoài.
- Truyền ràng buộc qua toàn bộ chuỗi wrapper: route host → sd-page content → tab group/active panel nếu có → list body → sd-table. Vùng co giãn cần min-height: 0, min-width: 0; padding nằm trong box-sizing: border-box.
- Các vùng co giãn dùng flex: 1 1 0 hoặc grid minmax(0, 1fr); header, toolbar, score card và pagination không bị ép co để nhường chỗ cho toàn bộ các dòng dữ liệu.
- Trong pattern list, document/Portal content/page body/tab body không phát sinh scrollbar do danh sách. Các wrapper giữ overflow phù hợp; chỉ viewport dữ liệu của table cuộn. Scroll ngang do nhiều cột cũng thuộc table, không kéo rộng toàn page.
- Không bọc sd-table trong một div overflow: auto tạo thêm scrollbar. Không ấn định chiều cao table bằng số pixel hoặc phép trừ chiều cao header/filter giả định.
- Không dùng overflow-hidden ở feature để che lỗi tràn nội dung. Khi có scrollbar ngoài table, xác định wrapper gây ra và xử lý đúng owner layout; không cắt mất control hoặc pagination.
- Loading, empty, error và khi ít dòng vẫn giữ table lấp đầy vùng còn lại; thay đổi số dòng/page size không đẩy pagination ra ngoài màn hình.
- Khi viewport thấp/hẹp, thu gọn các vùng optional hoặc external filter theo responsive của pattern để table còn vùng sử dụng được. Không chỉ cắt overflow làm mất control hoặc pagination; kiểm tra lại khi filter/card/header xuống dòng.

### Search và filter

- Dùng quick search để tìm theo các trường đã chọn, ví dụ mã/tên; dùng inline filter để lọc chính xác theo từng column.
- Khi thêm external filter, tránh tạo hai state độc lập cho cùng một điều kiện. Nếu score card cũng lọc trạng thái, card, filter và request phải phản ánh cùng giá trị đã áp dụng.
- Tabs, score card, quick search và các filter phối hợp theo contract truy vấn của consumer; không để thao tác ở một vùng vô tình xóa điều kiện còn hiệu lực của vùng khác.
- Nếu Core chuyển inline filter sang giao diện lọc cho mobile, vẫn phải giữ cách truy cập các điều kiện đó và contract cuộn của màn list.

Fragment option dưới đây minh họa ưu tiên quick search + inline filter, chưa phải implementation page hoàn chỉnh:

```ts
filter: {
  quickSearch: {
    containFields: ['code', 'name'],
    placeholder: 'Tìm theo mã hoặc tên',
  },
  // Thêm externalFilters theo nhu cầu nghiệp vụ.
}
```

Giữ mặc định inline filter của Core/consumer. Chỉ thêm `hideInlineFilter: false` khi cần ghi đè cấu hình hiện hữu đang ẩn inline filter. Tương tự, không khai báo sẵn `paginate`, `rowKey` hoặc `config` nếu màn hình chưa cần thay đổi mặc định. Khi cần giữ selection/identity qua lần fetch mới, khai báo `rowKey` theo contract của Core; không suy luận rằng mặc định luôn là trường `id`.

### List đơn giản — TS và HTML

- Chỉ tạo `list.component.ts` và `list.component.html`; không mặc định tạo SCSS hoặc `styleUrl`.
- Selector có thể là `list` vì component chỉ dùng làm route page.
- Dependency private dùng `readonly #productService = inject(ProductService)`.
- Dùng utility Core cho layout/spacing; không tạo class `list-body` khi utility đã đáp ứng.
- Dùng `*sdPermission` cho UI action; không gọi service permission trong biểu thức render. Route vẫn kiểm tra quyền và resolve entity theo [Routes](project-structure/routes.md).
- Option tĩnh khai báo trực tiếp; không cần thêm state, lifecycle init, signal/computed hoặc wrapper service khi chưa có nhu cầu.

Các block dưới đây là mã giả để áp dụng quy ước, không có marker `example` và không nằm trong bộ kiểm chứng nền tảng. Giả định biến thể service `ProductService.list(req)` nhận `ProductListReq` tương thích `PagingReq<ProductDto>` và trả `Observable<ProductListRes>` có `items`/`total`. Contract `pageIndex/pageSize/keyword` trong mẫu HTTP nền tảng chưa hỗ trợ toàn bộ filter/sort của Core: consumer phải mở rộng hoặc chuyển đổi request đầy đủ, không chỉ lấy keyword.

Model/constant giữ trong `services/product.model.ts`; với biến thể Core paging:

```ts
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

// ProductDto và ProductStatus dùng các khai báo entity trong Services.
export type ProductListReq = PagingReq<ProductDto>;
export type ProductListRes = PagingRes<ProductDto>;

export const PRODUCT_STATUS_OPTIONS = [
  { id: 'active', name: 'Đang hoạt động' },
  { id: 'inactive', name: 'Ngừng hoạt động' },
] satisfies Array<{ id: ProductStatus; name: string }>;
```

`pages/list/list.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdTable,
  SdTableCellDefDirective,
  type SdTableOption,
} from '@sdcorejs/angular/components/table';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { ProductService } from '../../services/api.service';
import { PRODUCT_STATUS_OPTIONS, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'list',
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, SdPageComponent, SdButton, SdTable,
    SdTableCellDefDirective, SdPermissionDirective,
  ],
})
export class ListComponent {
  readonly #productService = inject(ProductService);

  protected readonly tableOption: SdTableOption<ProductDto> = {
    type: 'server',
    items: (_, req) => firstValueFrom(this.#productService.list(req)),
    filter: {
      quickSearch: {
        containFields: ['code', 'name'],
        placeholder: 'Tìm theo mã hoặc tên sản phẩm',
      },
    },
    columns: [
      { field: 'code', title: 'Mã sản phẩm', type: 'string', width: '180px' },
      { field: 'name', title: 'Tên sản phẩm', type: 'string' },
      {
        field: 'status', title: 'Trạng thái', type: 'values', width: '180px',
        option: {
          items: PRODUCT_STATUS_OPTIONS,
          valueField: 'id',
          displayField: 'name',
        },
      },
    ],
  };
}
```

`pages/list/list.component.html`:

```html
<sd-page title="Danh sách sản phẩm">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <sd-button
      *sdPermission="'MDM_PRODUCT_C_CREATE'"
      title="Tạo mới"
      prefixIcon="add"
      type="fill"
      color="primary"
      [routerLink]="['create']"
    />
  </div>

  <div class="h-full p-8">
    <sd-table autoId="product-list" [option]="tableOption">
      <ng-template sdTableCellDef="code" let-product="item">
        <div class="d-flex align-items-center gap-8">
          <span>{{ product.code }}</span>
          <a
            *sdPermission="'MDM_PRODUCT_C_DETAIL'"
            [routerLink]="[product.id, 'detail']"
          >Chi tiết</a>
        </div>
      </ng-template>
    </sd-table>
  </div>
</sd-page>
```

Mã sản phẩm vẫn hiển thị khi thiếu quyền detail; directive kiểm soát link thao tác. Table quản lý luồng loading, empty, error và phân trang theo Core. Không bắt lỗi API rồi trả danh sách rỗng giả thành công. Với option khởi tạo đồng bộ như trên, không cần `@if (tableOption)`; chỉ thêm khi option thực sự được chuẩn bị bất đồng bộ.

### Header có nhiều action và menu

- Dùng một wrapper `headerRight`, bên trong là các button; utility `d-flex align-items-center gap-8 flex-wrap` quản lý khoảng cách/xuống dòng.
- Một action chính dùng `type="fill"`, đặt ngoài cùng bên phải; action phụ dùng kiểu nhẹ hơn và giữ thứ tự nhất quán.
- Ba button ngắn như Nhập dữ liệu, Xuất dữ liệu, Tạo mới có thể hiển thị trực tiếp. Khi nhiều action hoặc thiếu không gian, gom các action ít dùng vào menu bằng `SdButtonItem`; không bắt buộc chuyển sang menu ngay khi vượt hai button.
- Menu có permission riêng do consumer quy định. Không suy quyền hiển thị menu bằng OR các quyền con. Mỗi action bên trong vẫn áp dụng permission nghiệp vụ tương ứng.
- Dùng `*sdPermission` cho cả menu và action. Các mã quyền dưới đây là ví dụ theo convention, không phải quyền có sẵn của Core.

Fragment thay cho vùng `headerRight`; thêm `SdButtonItem` từ `@sdcorejs/angular/components/button` vào imports. `onImport`/`onExport` là event handler nghiệp vụ của consumer:

```html
<div headerRight class="d-flex align-items-center gap-8 flex-wrap">
  <sd-button
    *sdPermission="'MDM_PRODUCT_C_MENU'"
    title="Thao tác khác"
    prefixIcon="more_horiz"
  >
    <sd-button-item
      *sdPermission="'MDM_PRODUCT_C_IMPORT'"
      prefixIcon="upload"
      (click)="onImport()"
    >Nhập dữ liệu</sd-button-item>
    <sd-button-item
      *sdPermission="'MDM_PRODUCT_C_EXPORT'"
      prefixIcon="download"
      (click)="onExport()"
    >Xuất dữ liệu</sd-button-item>
  </sd-button>

  <sd-button
    *sdPermission="'MDM_PRODUCT_C_CREATE'"
    title="Tạo mới"
    prefixIcon="add"
    type="fill"
    color="primary"
    [routerLink]="['create']"
  />
</div>
```

### Đối chiếu Core và mẫu tham khảo

Đã đối chiếu @sdcorejs/angular 22.3.1 đang cài trong portal-template: sd-page có headerLeft/headerRight; sd-card/sd-card-group dùng cho card; sd-tab-group có headerClass/headerStyle/bodyClass/bodyStyle; sd-table có filter.quickSearch, filter.externalFilters và filter.hideInlineFilter. Khi triển khai với version khác, đối chiếu public API thực tế.

sd-page hiện có wrapper overflow-y: auto; sd-tab-group bọc các lớp body của Material. Vì vậy chỉ nhìn utility trong HTML chưa chứng minh được chỉ table cuộn. Khi tích hợp cần đo hành vi trên browser và xử lý đúng owner layout nếu có lỗi; không thêm overflow-hidden hoặc sửa overflow toàn cục của mọi page để phục vụ một list.

Source tham khảo trong portal-template: src/modules/page/styles/list-layout.scss, features/list-score-filter và features/list-standard dưới src/modules/page. Mẫu score/filter dùng Core card và external filter; mẫu hiện tại đang đặt hideInlineFilter: true, nên không sao chép giá trị này làm mặc định của Blueprint vừa chốt.

Tham khảo trực tiếp CRM: repo portal-crm, src/libs/masterdata/modules/product/pages/list/list.component.ts và list.component.html. Màn này chỉ có hai file, selector list, private field #, *sdPermission và wrapper h-full p-8; không có host.class, SCSS riêng hoặc overflow-hidden ở feature. CRM đang dùng @sd-angular/core 19.0.0-beta.69; chỉ lấy cách tổ chức/layout làm tham khảo, giữ import/API và convention permission theo Core của consumer hiện tại.

### Kiểm chứng khi triển khai list

- Có/không tabs, score card, external filter: thứ tự, padding và chiều cao vẫn đúng; vùng optional không để khoảng trống.
- Header và thanh tab liền nhau, cùng nền trắng; padding bắt đầu trong body của tab.
- Nhiều dòng/nhiều cột: chỉ viewport table cuộn; header, filter và pagination giữ trong khung.
- Loading/empty/error/ít dòng, đổi tab, đổi page size và đóng/mở external filter: không sinh scrollbar ngoài table.
- Resize/viewport thấp, label dài và vùng điều khiển xuống dòng: control/pagination vẫn truy cập được. Kiểm tra kích thước scrollHeight/clientHeight và scrollWidth/clientWidth ở các wrapper để xác định đúng phần tử cuộn, không chỉ nhìn ảnh tĩnh.

Các mục trên là contract và case cần kiểm chứng; mã giả TS/HTML ở trên chưa phải implementation page đã chạy hoặc kết quả browser trong repo Blueprint.

## Điều kiện khi bổ sung mẫu

Đối chiếu đúng version @sdcorejs/angular của project. Mỗi pattern phải nêu khi dùng, API dữ liệu, input/output, state, permission, URL nếu có, responsive và cách kiểm chứng.

Spec của component đặt cạnh source; E2E của pattern nằm trong scope feature/module theo [Testing](project-structure/testing.md). Mỗi pattern nêu các case có giá trị như validation, save failure, dirty guard, direct URL, keyboard/focus; không sinh spec rỗng hoặc lặp lại cùng một case ở mọi tầng.

Detail/update có ID nhận entity đã tải sau khi qua kiểm tra quyền theo [Routes](project-structure/routes.md). Page khởi tạo view/form từ route data hoặc contract tương đương, nhận entity mới khi đổi ID và không tải lặp entity chính trong lifecycle. Thiếu quyền hoặc lỗi tải entity chuyển tới flow/trang lỗi của consumer trước khi page đích được kích hoạt. Page/drawer vẫn sở hữu lỗi validation/lưu và bảo vệ draft trong quá trình tương tác.

Component route trong validation hiện là fixture không có Core UI. Không copy fixture đó thành page production hoặc coi đó là UI pattern đã có.

Nguồn tham khảo là portal-template cùng public docs đúng version Core. Contract list đã được đối chiếu source như ghi ở trên; các pattern khác sẽ tiếp tục được cụ thể hóa theo phản hồi người dùng.
