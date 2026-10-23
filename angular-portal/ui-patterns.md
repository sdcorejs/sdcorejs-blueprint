# UI patterns

Trạng thái: Đã chốt convention list, các bố cục detail/create/update và side drawer qua review ngày 19–23/10/2026. Bao gồm section, header/actions, relation qua pipe, select wrapper và giới hạn custom SCSS. Tài liệu giữ contract và mã giả; [Angular consumer](../validation/angular-consumer/README.md) đã bổ sung kiểm chứng AOT/Core/browser cho một tập con: list, detail, create/update, section/view, enum select, permission và dirty. Không suy rộng kết quả này sang drawer, relation/select động, tabs/steps hoặc mọi fragment dưới đây. Các bố cục tương tác ban đầu dùng để review vẫn là mockup.

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

## Quy tắc UI dùng chung

- Ưu tiên component, mặc định và utility Core; chỉ tạo `*.component.scss`/`styleUrl` khi có nhu cầu mà Core chưa đáp ứng. Quy tắc áp dụng cho list, detail, create/update, drawer và wrapper, không chỉ list. Không tạo class riêng chỉ để bọc layout/spacing có utility tương đương; không dùng `overflow-hidden` che lỗi bố cục.
- Button thông thường dùng size `sm`. `SdButton` ở Core 22.3.1 mặc định đã là `sm`, nên bỏ thuộc tính này khi giữ mặc định; chỉ gán khi cần ghi đè cấu hình/version consumer. Không khai báo hàng loạt default để làm đầy mẫu.
- Các vùng như **Thông tin chung**, **Liên hệ và ghi chú**, **Thông tin phê duyệt** dùng `sd-section`. Section sở hữu header/body của nhóm; bên trong chọn `sd-view`, `sd-section-item`, form hoặc table tùy nội dung. Không thay section bằng heading và đường kẻ tự dựng.
- Permission UI dùng `*sdPermission` với chuỗi quyền của consumer. Điều kiện trạng thái nghiệp vụ được chuẩn bị trong TS bằng state/computed; template không gọi `permission.hasPermission(...)` hoặc hàm lookup/format tùy ý. Signal và event handler vẫn dùng theo Angular.
- Một action chính nổi bật; action phụ dùng kiểu nhẹ hơn. List/detail có tối đa **ba mục tác vụ cấp ngoài** trong mỗi vùng cùng scope; khi có hơn ba tác vụ, giữ hai tác vụ ưu tiên và gom từ tác vụ thứ ba vào nhóm như quy tắc dưới đây.
- Dùng wording cập nhật thống nhất trong cùng ứng dụng: `Cập nhật <entity>` hoặc `Chỉnh sửa <entity>`. Mẫu Blueprint dùng `Cập nhật`. Không trộn hai cách gọi cho cùng tác vụ ở page, drawer và menu.

### Giới hạn command/action trên list và detail

Áp dụng cho command của từng dòng (`command.commands` hoặc `commands`), action trên selection (`selector.actions`) và vùng action của list/detail. Đếm riêng theo scope; không gom command một dòng với action của nhiều dòng. Back, search/filter và pagination là điều hướng/control, không thuộc số tác vụ này.

| Số tác vụ có thể hiển thị | Cách trình bày |
| --- | --- |
| 0 | Không tạo nhóm/nút tác vụ rỗng |
| 1–3 | Có thể hiển thị trực tiếp; vẫn có thể gom sớm hơn nếu màn hẹp |
| Từ 4 trở lên | Hai tác vụ đầu theo thứ tự ưu tiên hiển thị trực tiếp; mục cấp ngoài thứ ba là `Thao tác khác`, chứa tác vụ thứ ba đến hết |

- Với table, nhóm bằng `children` của command/action. Không để ba tác vụ trực tiếp rồi thêm một menu thứ tư; không chỉ chuyển tác vụ thứ tư vào menu.
- Với detail, dùng **Action Popover của `SdButton`**: đặt `sd-button-item` bên trong `sd-button`. Core tự mở popover; không tự dựng dropdown hoặc lồng các `sd-button` tương tác vào trigger.
- Thứ tự ưu tiên ổn định theo nghiệp vụ; một action chính nổi bật. Áp dụng quyền và điều kiện trạng thái trước khi xác định tập tác vụ hiển thị; không có nhóm rỗng khi tất cả tác vụ con bị ẩn. Tác vụ đang disabled vẫn chiếm một vị trí nếu còn hiển thị.
- Nhóm có permission riêng theo convention consumer; từng tác vụ con vẫn giữ permission/điều kiện/handler riêng. Không dùng quyền nhóm thay quyền con, không suy quyền nhóm bằng OR các quyền con.
- **List không có tác vụ Edit/Cập nhật hoặc Detail/Chi tiết**, kể cả command dòng, `selector.actions`, header hay `children`. Mở detail bằng hyperlink ngay trên giá trị **mã/tên ở cột dữ liệu đầu tiên** (không tính checkbox/STT). Không đặt chữ “Chi tiết” hoặc icon mở detail riêng cạnh mã/tên. Tác vụ cập nhật nằm ở detail và dẫn đến màn update.
- Khi thiếu quyền detail, mã/tên vẫn hiển thị dạng text; không tạo link giả hoặc click handler trên cả dòng để thay đường điều hướng có quyền.

Ví dụ cấu trúc cho bốn tác vụ đã được phép và xếp ưu tiên (mã giả; các biến command/action là definition nghiệp vụ do consumer chuẩn bị):

```ts
command: {
  commands: [
    sendCommand,
    exportCommand,
    { title: 'Thao tác khác', icon: 'more_horiz', children: [syncCommand, archiveCommand] },
  ],
},
selector: {
  actions: [
    sendSelectedAction,
    exportSelectedAction,
    { title: 'Thao tác khác', icon: 'more_horiz', children: [syncSelectedAction, archiveSelectedAction] },
  ],
},
```

Command handler nhận một dòng; selector action nhận các dòng đã chọn. Fragment chỉ minh họa cách gom, không mặc định thêm gửi/đồng bộ/lưu trữ vào mọi feature. Core 22.3.1 hỗ trợ `children` nhưng không tự áp dụng ngưỡng ba của Blueprint; consumer chuẩn bị cấu hình phù hợp và giữ từng tác vụ đúng một lần.

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
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ProductService } from '../../services/product.service';
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
  // Route guard đã nạp quyền trước khi tạo page; dùng cho text fallback.
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('MDM_PRODUCT_C_DETAIL');

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
        <a
          *sdPermission="'MDM_PRODUCT_C_DETAIL'"
          [routerLink]="[product.id, 'detail']"
        >{{ product.code }}</a>
        @if (!canOpenDetail) {
          <span>{{ product.code }}</span>
        }
      </ng-template>
    </sd-table>
  </div>
</sd-page>
```

Mã sản phẩm chính là hyperlink; khi thiếu quyền detail chỉ hiện mã dạng text một lần. Directive kiểm soát link; Core 22.3.1 chưa có `sdPermissionElse`, nên `canOpenDetail` được chuẩn bị trong TS sau khi guard nạp quyền để chọn text fallback. Mẫu giả định bộ quyền ổn định trong lần activation; consumer đổi bộ quyền giữa phiên phải cập nhật trạng thái hoặc tạo lại page theo luồng quyền của host. Table quản lý luồng loading, empty, error và phân trang theo Core. Không bắt lỗi API rồi trả danh sách rỗng giả thành công. Với option khởi tạo đồng bộ như trên, không cần `@if (tableOption)`; chỉ thêm khi option thực sự được chuẩn bị bất đồng bộ.

### Header có nhiều action và menu

- Dùng một wrapper `headerRight`, bên trong là các button; utility `d-flex align-items-center gap-8 flex-wrap` quản lý khoảng cách/xuống dòng.
- Một action chính dùng `type="fill"`, đặt ngoài cùng bên phải; action phụ dùng kiểu nhẹ hơn và giữ thứ tự nhất quán.
- Ba button ngắn như Nhập dữ liệu, Xuất dữ liệu, Tạo mới có thể hiển thị trực tiếp. Khi có hơn ba tác vụ, bắt buộc giữ hai tác vụ ưu tiên và gom từ tác vụ thứ ba bằng `SdButtonItem`; không dùng xuống dòng để giữ hơn ba mục cấp ngoài. Có thể gom sớm khi thiếu không gian.
- Menu có permission riêng do consumer quy định. Không suy quyền hiển thị menu bằng OR các quyền con. Mỗi action bên trong vẫn áp dụng permission nghiệp vụ tương ứng.
- Dùng `*sdPermission` cho cả menu và action. Các mã quyền dưới đây là ví dụ theo convention, không phải quyền có sẵn của Core.

Fragment thay cho vùng `headerRight`, minh họa gom sớm Nhập/Xuất khi màn hẹp; thêm `SdButtonItem` từ `@sdcorejs/angular/components/button` vào imports. `onImport`/`onExport` là event handler nghiệp vụ của consumer:

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

Consumer AOT/browser đã xác minh `SdTableFilterRequest.pageNumber` của Core 22.3.1 bắt đầu từ **0**. Khi ghép API nền tảng, map trực tiếp sang `pageIndex`; nếu chỉ hỗ trợ keyword/paging, tắt sort/inline filter chưa có backend tương ứng. Bản Core-paging đầy đủ ở trên vẫn là một biến thể contract khác. Trên mobile, có thể dùng `minWidth` của cột khi nội dung bị ép quá hẹp; giữ cuộn ngang bên trong table, không dùng CSS che overflow.

sd-page hiện có wrapper overflow-y: auto; sd-tab-group bọc các lớp body của Material. Vì vậy chỉ nhìn utility trong HTML chưa chứng minh được chỉ table cuộn. Khi tích hợp cần đo hành vi trên browser và xử lý đúng owner layout nếu có lỗi; không thêm overflow-hidden hoặc sửa overflow toàn cục của mọi page để phục vụ một list.

Source tham khảo trong portal-template: src/modules/page/styles/list-layout.scss, features/list-score-filter và features/list-standard dưới src/modules/page. Mẫu score/filter dùng Core card và external filter; mẫu hiện tại đang đặt hideInlineFilter: true, nên không sao chép giá trị này làm mặc định của Blueprint vừa chốt.

Tham khảo trực tiếp CRM: repo portal-crm, src/libs/masterdata/modules/product/pages/list/list.component.ts và list.component.html. Màn này chỉ có hai file, selector list, private field #, *sdPermission và wrapper h-full p-8; không có host.class, SCSS riêng hoặc overflow-hidden ở feature. CRM đang dùng @sd-angular/core 19.0.0-beta.69; chỉ lấy cách tổ chức/layout làm tham khảo, giữ import/API và convention permission theo Core của consumer hiện tại.

### Kiểm chứng khi triển khai list

- Có/không tabs, score card, external filter: thứ tự, padding và chiều cao vẫn đúng; vùng optional không để khoảng trống.
- Header và thanh tab liền nhau, cùng nền trắng; padding bắt đầu trong body của tab.
- Nhiều dòng/nhiều cột: chỉ viewport table cuộn; header, filter và pagination giữ trong khung.
- Loading/empty/error/ít dòng, đổi tab, đổi page size và đóng/mở external filter: không sinh scrollbar ngoài table.
- Resize/viewport thấp, label dài và vùng điều khiển xuống dòng: control/pagination vẫn truy cập được. Kiểm tra kích thước scrollHeight/clientHeight và scrollWidth/clientWidth ở các wrapper để xác định đúng phần tử cuộn, không chỉ nhìn ảnh tĩnh.
- Đúng ba tác vụ không bắt buộc có menu; bốn tác vụ thành hai trực tiếp và một nhóm chứa tác vụ 3–4. Kiểm tra command từng dòng và `selector.actions` riêng, kể cả sau khi lọc theo quyền/trạng thái; không mất hoặc lặp tác vụ, không có nhóm rỗng.
- Mã/tên ở cột dữ liệu đầu tiên là hyperlink có `href` đúng, dùng được bằng bàn phím và mở tab mới; thiếu quyền vẫn thấy text. Không có action Edit/Detail ở bất kỳ vùng nào của list, kể cả menu con.

Các mục trên là contract và case cần kiểm chứng; mã giả TS/HTML ở trên chưa phải implementation page đã chạy hoặc kết quả browser trong repo Blueprint.

## Detail — bố cục, header và action

Entity chính đã tải và kiểm tra quyền theo [Routes](project-structure/routes.md). View nhận entity đó, không lấy một dòng list thiếu field làm detail hoàn chỉnh hoặc tải trùng entity trong lifecycle.

### Header

- Tiêu đề có chữ **Chi tiết**, tên entity và mã khi có: `Chi tiết đơn hàng #DH-1024`.
- Badge trạng thái nằm cạnh title/mã, cùng dòng. Dòng thứ hai chỉ chứa mô tả/ngữ cảnh ngắn nếu cần, ví dụ khách hàng · khu vực. Khối identity tối đa hai dòng; không tách title, badge và mô tả thành ba dòng.
- Text dài hoặc màn hẹp phải rút gọn phù hợp và vẫn truy cập được nội dung đầy đủ qua tooltip/tên truy cập. Không đẩy badge thành dòng thứ ba hoặc để che nút đóng/back.
- Page dùng nút trở lại ở `headerLeft` của `sd-page`; action ở `headerRight`. Drawer dùng slot riêng của `sd-side-drawer`, mô tả bên dưới.
- Core 22.3.1 dùng `headerLeft` làm slot **thay thế** title/description mặc định. Khi project Back, phải ghép cả Back và identity vào slot; truyền `[title]` riêng không giữ title trên màn hình. Consumer có AOT/component/E2E regression cho điểm này.
- Ngoài `Cập nhật <entity>`, detail có thể có Gửi duyệt, Duyệt, Từ chối, Xóa hoặc tác vụ khác của entity. Không yêu cầu đủ mọi action; hiển thị theo permission và trạng thái nghiệp vụ.
- Tối đa ba mục tác vụ cấp ngoài theo quy tắc chung. Khi có hơn ba, giữ hai tác vụ ưu tiên; từ tác vụ thứ ba nằm trong Action Popover của `SdButton`. Kiểm tra mở bằng click/bàn phím, Escape trả focus về trigger và từng handler chỉ chạy một lần.

Ví dụ detail có bốn tác vụ đã được phép: Cập nhật, Xuất, In và Lưu trữ. Hai tác vụ ưu tiên ở ngoài; In/Lưu trữ nằm trong popover. Vị trí action chính ngoài cùng bên phải giữ convention header; “thứ ba” là thứ tự ưu tiên, không phải tọa độ trái/phải. Đây là fragment minh họa; chỉ triển khai tác vụ có trong đặc tả, với điều kiện trạng thái và handler của consumer:

```html
<div headerRight class="d-flex align-items-center gap-8 flex-wrap">
  <sd-button *sdPermission="'MDM_PRODUCT_C_MENU'" title="Thao tác khác" prefixIcon="more_horiz">
    <sd-button-item *sdPermission="'MDM_PRODUCT_C_PRINT'" (click)="onPrint()">In</sd-button-item>
    <sd-button-item *sdPermission="'MDM_PRODUCT_C_ARCHIVE'" (click)="onArchive()">Lưu trữ</sd-button-item>
  </sd-button>
  <sd-button *sdPermission="'MDM_PRODUCT_C_EXPORT'" title="Xuất dữ liệu" (click)="onExport()" />
  <sd-button *sdPermission="'MDM_PRODUCT_C_UPDATE'" title="Cập nhật" [routerLink]="['../update']" type="fill" color="primary" />
</div>
```

Import `SdButton` và `SdButtonItem` từ `@sdcorejs/angular/components/button`, cùng `RouterLink` và `SdPermissionDirective`. Không gắn handler tác vụ cho nút `Thao tác khác`; nó chỉ mở popover. Nếu tập quyền/trạng thái làm thay đổi số tác vụ, consumer chuẩn bị lại nhóm theo ngưỡng trên và không render trigger khi không còn item được phép.

### Các bố cục đã chốt

| Bố cục | Cách tổ chức | Khi dùng |
| --- | --- | --- |
| Detail dùng `sd-view` | Các `sd-section` xếp dọc, bên trong là nhóm `sd-view`; số cột theo không gian khả dụng | Hồ sơ có nhiều trường ngắn, cần đọc theo nhóm |
| Detail dùng `sd-section-item` | Mỗi `sd-section` chứa các hàng `sd-section-item`, nhãn bên trái và value bên phải | Dữ liệu dạng thuộc tính, nội dung dài hoặc value cần template riêng |
| Detail 360° | Header identity chung; tabs sát header, mỗi tab chứa section/view/table phù hợp | Khách hàng có thông tin chung, lịch sử mua hàng, công nợ, tài liệu và các quan hệ khác |
| Detail có workflow | Một trong các bố cục trên, thêm trạng thái, thông tin phê duyệt và action nghiệp vụ | Đơn hàng, hợp đồng hoặc yêu cầu có gửi duyệt/duyệt/từ chối |

`sd-view` và `sd-section-item` là cách trình bày value trong section, không phải hai loại page loại trừ nhau. Có thể phối hợp ở những nhóm khác nhau khi phù hợp, tránh render lặp cùng field chỉ để dùng đủ component. Tab 360° dùng component `-view`/related list theo trách nhiệm; không mặc định tải tất cả tab trước khi mở detail. Entity chính vẫn sẵn sàng, từng vùng liên quan có loading/empty/error riêng.

### Value thường gặp

| Dữ liệu | Quy tắc hiển thị |
| --- | --- |
| Text, mã | Text đọc được; mã/link chỉ tương tác khi có đích và permission phù hợp |
| Trạng thái | Badge theo metadata trong model; trạng thái chính cạnh title |
| ID relation | Hiển thị tên/mã qua `<entity>Detail`, tái sử dụng dữ liệu đã có; không hiển thị ID thô thay cho tên |
| Người dùng | Tên, có thể thêm avatar và role/ngữ cảnh hữu ích |
| Số, tiền, tỷ lệ | Format bằng pipe/formatter sẵn có theo locale, đơn vị và contract của consumer; giữ số 0 |
| Ngày, giờ | Format ngày/ngày giờ theo nghĩa dữ liệu và timezone của consumer |
| Boolean | Nhãn có nghĩa như Có/Không; giữ `false`, không coi là rỗng |
| Email, điện thoại, URL | Text/link phù hợp; giá trị thiếu vẫn áp dụng placeholder Core |
| Địa chỉ, ghi chú dài | Cho phép xuống dòng trong body, không ép thành một dòng mất thông tin |
| Mảng, bản ghi con, file/ảnh | Chips/list/table/file component phù hợp; vùng rỗng có empty state riêng |
| `null`/`undefined` | Placeholder Core `--` theo quy tắc bên dưới; không biến lỗi tải thành value rỗng |

Mã giả body detail, hai cách trình bày thay thế nhau. Các component `SdSection`/`SdSectionItem` được import từ `@sdcorejs/angular/components/section`; `customerDetail` thuộc feature Customer:

```html
@let customer = entity().customerId | customerDetail | async;

<!-- Biến thể sd-view bên trong section. -->
<sd-section title="Thông tin chung">
  <div class="p-16 d-grid gap-16">
    <sd-view label="Khách hàng" [display]="customer?.name" />
    <sd-view label="Ghi chú" [display]="entity().note" />
  </div>
</sd-section>

<!-- Biến thể các hàng sd-section-item bên trong section. -->
<sd-section title="Thông tin chung">
  <sd-section-item label="Khách hàng">
    {{ customer?.name | sdEmpty }}
  </sd-section-item>
  <sd-section-item label="Tổng giá trị (VND)">
    {{ entity().amount | number | sdEmpty }}
  </sd-section-item>
  <sd-section-item label="Ghi chú">
    {{ entity().note | sdEmpty }}
  </sd-section-item>
</sd-section>
```

## Detail — dữ liệu relation và giá trị rỗng

### Relation dùng pipe `<entity>Detail`

- Mỗi entity của feature có pipe detail chuẩn: tên template `<entity>Detail` ở dạng lowerCamelCase, class `<Entity>DetailPipe`, file `pipes/<entity>-detail.pipe.ts` trong feature sở hữu entity. Ví dụ `customerDetail` / `CustomerDetailPipe` / `pipes/customer-detail.pipe.ts`. Tái sử dụng cùng pipe khi entity được tham chiếu ở các màn khác; không tạo pipe lookup riêng cho từng page.
- Với trường tham chiếu như `customerId`, dùng `@let customer = entity().customerId | customerDetail | async;`. Pipe nhận ID và trả object detail có kiểu của entity, không chỉ trả tên hoặc chuỗi HTML; view chọn `customer?.name`, `customer?.code` hoặc field cần hiển thị. Không gọi hàm tải/tra tên từ HTML hoặc lặp logic lookup trong từng page.
- Pipe phụ thuộc service đúng entity, ví dụ `CustomerService.detail(id)`. Service sở hữu truy cập dữ liệu, cache và chia sẻ request; pipe chuyển dữ liệu cho view, không tự gọi HTTP/generic API service.
- Khi dùng pipe bên ngoài route của entity, consumer phải cấp service/configuration trong chuỗi injector nơi pipe chạy; provider ở route sibling không tự khả dụng. Đăng ký ở scope chung phù hợp hoặc qua public provider của entity/module, không tự chuyển service thành root singleton để xử lý lỗi DI.
- ID `null`/`undefined`: không gọi API, trả dữ liệu rỗng. Nếu consumer coi chuỗi rỗng là không có ID thì xử lý tương tự. ID đổi phải cập nhật đúng relation; kết quả cũ không được ghi đè bản ghi mới.
- Nếu response đã có tên/object relation hoặc cache có dữ liệu phù hợp, dùng lại và không gọi API bổ sung chỉ để khớp pattern. Không bắt buộc tải mọi relation trong resolver; entity chính vẫn được preload theo [Routes](project-structure/routes.md). Chỉ preload relation trước activation khi nó cần cho quyền/điều kiện vào route hoặc contract của consumer.
- Pipe lookup bất đồng bộ trả `Promise` hoặc `Observable` theo service của consumer và kết hợp `async`; không bắt buộc dùng `Observable` hay chuyển đổi giữa hai kiểu. Implementation khai báo kiểu cụ thể tương ứng service, không bắt buộc union cả hai. Giữ pipe pure khi phù hợp; không tạo subscription thủ công hoặc request mới trên mỗi lần change detection. Khi nhiều nơi cùng dùng ID, chia sẻ request/cache; danh sách nhiều ID ưu tiên batch/prefetch nếu service hỗ trợ, tránh N+1. Cache phải theo phạm vi dữ liệu/quyền của consumer và có cơ chế làm mới khi relation thay đổi.
- Loading, lỗi tải và thiếu quyền là trạng thái của lookup, không được bắt mọi lỗi rồi chuyển thành `null` như tải thành công. Xử lý theo flow của consumer; relation chỉ phục vụ hiển thị không mặc định làm hỏng toàn bộ trang detail.
- Với chứng từ cần giữ lịch sử, dùng tên/snapshot theo thời điểm phát sinh nếu contract cung cấp; không tự thay bằng tên hiện tại từ master data.

### Giá trị rỗng dùng placeholder của Core

- Giá trị `null`/`undefined` hiển thị `--` qua API/constant rỗng của Core; không hardcode `--` rải rác hoặc tự thay bằng “Chưa khai báo”/“Chưa chọn” cho field rỗng thông thường.
- Giữ nguyên ý nghĩa của `0` và `false`; không dùng `value || fallback`. Format theo kiểu dữ liệu trước khi áp dụng placeholder khi cần.
- Với `sd-section-item`, cell hoặc text tự render, dùng `sdEmpty` ở điểm hiển thị. Với `sd-view`, truyền giá trị vào `display`; template mặc định của Core đã dùng `sdView` để xử lý giá trị rỗng. Custom value template phải tự áp dụng quy tắc này.
- Đối chiếu `@sdcorejs/angular` 22.3.1 trong portal-template: `SdEmptyPipe`/`SdViewPipe` được export từ `@sdcorejs/angular/pipes`; cả hai dùng `EMPTY_STR = '--'` từ `@sdcorejs/utils/constants`. Tên `SD_STR_EMPTY` được nhắc trong trao đổi là ý định dùng constant Core; không đưa tên đó vào import khi version hiện tại không export. Bản legacy đã kiểm tra có tên `SD_EMPTY_STR`. Luôn dùng public API của version consumer đang cài.
- `sdEmpty` hiện xử lý thêm chuỗi rỗng; `sdView` xử lý thêm `NaN` và mảng rỗng. Empty state của một tab/table là pattern riêng, không bắt buộc thay cả thông báo danh sách rỗng bằng `--`.

Mã giả dưới đây minh họa cách dùng; `customerDetail` là pipe của entity trong consumer, không phải pipe có sẵn trong Core. Pipe trả `Promise<CustomerDto | null>` hoặc `Observable<CustomerDto | null>` theo service, và service đã xử lý chia sẻ request/cache. `async` nhận dữ liệu; loading/error riêng theo contract của consumer, không bị chuyển thành dữ liệu rỗng thành công:

```html
@let customer = entity().customerId | customerDetail | async;

<!-- Dạng sd-view: Core tự hiển thị placeholder cho display rỗng. -->
<sd-view label="Khách hàng" [display]="customer?.name" />

<!-- Dạng sd-section-item: áp dụng sdEmpty tại điểm render value. -->
<sd-section-item label="Khách hàng">
  {{ customer?.name | sdEmpty }}
</sd-section-item>
```

Hai fragment là hai cách trình bày thay thế nhau, không phải yêu cầu hiển thị lặp field. Import `AsyncPipe`, `CustomerDetailPipe`, và `SdEmptyPipe` khi template dùng `sdEmpty`. Sample này là mã giả chưa qua AOT/browser; không phải implementation lookup hoàn chỉnh.

Mã giả TS cho `pipes/customer-detail.pipe.ts`, minh họa trường hợp `CustomerService.detail(id)` trả `Promise<CustomerDto>`. Service được import từ `customer.service.ts` theo tên entity; cache/chia sẻ request thuộc service. Với service trả Observable, bỏ `async` ở `transform`, trả Observable tương ứng và dùng `of(null)` cho ID rỗng; không đổi service chỉ để dùng mẫu Promise này.

```ts
import { inject, Pipe, type PipeTransform } from '@angular/core';

import { CustomerService } from '../services/customer.service';
import type { CustomerDto } from '../services/customer.model';

@Pipe({
  name: 'customerDetail',
})
export class CustomerDetailPipe implements PipeTransform {
  readonly #customerService = inject(CustomerService);

  async transform(
    id: CustomerDto['id'] | null | undefined,
  ): Promise<CustomerDto | null> {
    if (id === null || id === undefined || id === '') {
      return null;
    }

    return this.#customerService.detail(id);
  }
}
```

## Select wrapper — entity và enum/const

### Contract của component

Khi entity được dùng làm lựa chọn ở màn khác, feature sở hữu entity cung cấp `<entity>-select`, ví dụ `customer-select`. Component bọc select Core hiện hữu và gọi `CustomerService` từ `customer.service.ts`; consumer như Order không tự gọi API, cung cấp `items`, khai báo lại `valueField`/`displayField` hay viết lại template option.

Component sở hữu label mặc định, cách hiển thị item (tên, mã, avatar/trạng thái khi phù hợp), cách render giá trị đã chọn, search/phân trang và loading/error. Custom item template thuộc entity; chỉ mở override cho consumer khi có nhu cầu thực tế. Model/form được chuyển tiếp theo contract Core, giữ validation/disabled/touched/change nhất quán, không tạo nguồn giá trị độc lập thứ hai trong wrapper.

### Option có thông tin nhận diện — tối đa hai dòng

- `<entity>-select` nên hiển thị thêm thông tin giúp nhận diện/phân biệt bản ghi khi phù hợp, không mặc định chỉ có tên. Entity sở hữu cách trình bày này; consumer không phải truyền template hay tự chuẩn bị metadata cho từng màn.
- Mỗi option có tối đa hai dòng text: dòng đầu là tên/nhãn chính; dòng thứ hai là thông tin phụ hữu ích như role, mã, đơn vị hoặc liên hệ. Không cố tạo dòng phụ khi entity không có thông tin phù hợp.
- Avatar/thumbnail/icon nằm cạnh khối text, không tạo thêm dòng. Badge trạng thái có thể nằm cùng một trong hai dòng; label dài hoặc nhiều role được rút gọn bằng ellipsis/tóm tắt và tooltip, không wrap thành dòng thứ ba. Giữ text đầy đủ cho tên truy cập và tooltip khi bị rút gọn.
- Dùng component avatar/badge và utility của Core; không mặc định tạo SCSS riêng. Field đã render nhưng `null`/`undefined` vẫn dùng placeholder của Core; không để các fallback mô tả dài làm option vượt giới hạn hai dòng.
- Quy tắc hai dòng áp dụng cho item trong dropdown. Phần giá trị đã chọn trong ô select có thể gọn hơn để giữ chiều cao control, nhưng vẫn nhận diện đúng entity. Metadata bổ sung do wrapper/service chuẩn bị và tái sử dụng; tránh phát sinh request riêng cho từng option chỉ để render.
- Trong table nhập liệu, phần đã chọn chỉ hiển thị gọn trong control; không thêm dòng mô tả mã/đơn vị/role bên dưới dropdown làm cao hàng. Metadata vẫn có thể xuất hiện trong danh sách option khi mở. Chỉ dùng cột riêng khi thông tin đó thực sự là dữ liệu của bảng.

Ví dụ lựa chọn nội dung (không bắt buộc entity nào cũng có đủ các field này):

| Component | Bên cạnh text | Dòng chính | Dòng phụ |
| --- | --- | --- | --- |
| `user-select` | Avatar | Tên người dùng | Role hoặc role · phòng ban |
| `customer-select` | Avatar/logo nếu có | Tên khách hàng | Mã khách hàng · thông tin liên hệ phù hợp |
| `product-select` | Ảnh sản phẩm nếu có | Tên sản phẩm | Mã sản phẩm · đơn vị tính |

Mã giả ở Order; `form` và cấu trúc `customerFilters` theo consumer, không phải khai báo API Core mới:

```html
<customer-select
  name="customerId"
  [(model)]="model.customerId"
  [form]="form"
  [filters]="customerFilters"
/>
```

`filters` là điều kiện bổ sung có kiểu phù hợp với service/consumer; có thể bỏ khi không cần. Component áp dụng filter đặc thù cho lựa chọn mới, ví dụ `isActivated`, kết hợp điều kiện consumer thay vì để mỗi màn lặp lại. Chỉ mở các input/output khác khi cần; không sao chép toàn bộ API của Core thành cấu hình bắt buộc ở mọi nơi.

### Dropdown enum/const và cách dùng trong create/update

- Feature cung cấp wrapper cho các dropdown enum/const mà nó sử dụng, đặt trong `components/` cùng nhóm entity select. Ví dụ `product-status-select`, `customer-type-select`, `order-status-select`; không giới hạn wrapper ở dữ liệu tải từ API hoặc chỉ tạo khi đã có nhiều consumer.
- Enum/const và danh sách option/metadata dùng chung vẫn thuộc `<entity>.model.ts`. Wrapper import dữ liệu này, quản lý label, value/display field và item template. Create/update không tự dựng lại options, mapping label hoặc template cho cùng một trường.
- Option tĩnh không cần API. Với option động, wrapper gọi service đúng entity và xử lý tải/search/filter/giá trị đã chọn như contract bên trên. Không đưa việc gọi API lấy dropdown về page thông qua callback mà consumer bắt buộc phải cung cấp.
- Màn create/update mặc định dùng wrapper nghiệp vụ đã chuẩn bị; hạn chế dùng `sd-select` trực tiếp. Consumer chủ yếu bind model/form cùng các điều kiện cần thiết; `sd-select` và cấu hình nguồn dữ liệu nằm bên trong wrapper.
- Phạm vi này là dữ liệu phục vụ dropdown/lookup. Page vẫn sở hữu form, validation nghiệp vụ, xử lý lưu create/update và các tác vụ của màn hình. Không chuyển API lưu cả entity vào select.
- Các wrapper giữ contract model/form của Core, chỉ mở input/output cần thiết; dùng utility Core và không mặc định thêm SCSS. Option enum có thể chỉ một dòng; thêm thông tin khi có ích và luôn giữ giới hạn tối đa hai dòng.

Mã giả create/update của Order, minh họa relation select và enum select cùng cách sử dụng:

```html
<customer-select
  name="customerId"
  [(model)]="model.customerId"
  [form]="form"
/>

<order-status-select
  name="status"
  [(model)]="model.status"
  [form]="form"
/>
```

`order-status-select` đọc options từ `order.model.ts`; đây là ví dụ naming/binding, không giả định mọi workflow đều cho phép đổi trạng thái trực tiếp. Những thao tác như duyệt/từ chối vẫn theo action và permission của nghiệp vụ.

### Giữ giá trị đã chọn khi edit

- Lựa chọn mới: lấy dữ liệu hợp lệ theo filter mặc định của entity và `[filters]` của consumer; ví dụ khách hàng đang active trong nhóm yêu cầu.
- Giá trị đã chọn: tải theo đúng ID trong model, kể cả inactive, không thuộc trang kết quả hiện tại hoặc không khớp search/filter cho lựa chọn mới. Không gọi API nếu không có ID; khi hỗ trợ multiple, tải đủ các ID đang chọn.
- Với tập dữ liệu đã tải đầy đủ và được phép đọc, điều kiện cơ bản là `e.id === value || e.isActivated`. Nếu có filter bổ sung, ý nghĩa là `selectedIds.has(e.id) || (e.isActivated && matchesFilters(e, filters))`; đây là mã giả mô tả logic, không phải biểu thức đặt trong HTML hay DSL filter bắt buộc.
- Với API search/phân trang, lọc mảng kết quả active ở client không thể tìm lại bản ghi inactive đã bị server loại. Phải tải ID đã chọn riêng bằng service detail/batch hoặc dùng query OR tương đương nếu API hỗ trợ; khi hợp nhất dữ liệu, loại trùng theo ID. Không cần tải toàn bộ customer để giải quyết trường hợp edit.
- Core `@sdcorejs/angular` 22.3.1 đã có `SdSearchReq.type` gồm `SEARCH`/`VALUE`: có thể dùng `SEARCH` cho lựa chọn mới và `VALUE` cho tải giá trị đã chọn. Phần adapter phải theo contract version đang cài; service entity vẫn linh động Promise/Observable.
- Ngoại lệ giữ bản ghi đã chọn chỉ áp dụng cho điều kiện lựa chọn mới như active/search/filter nghiệp vụ; việc đọc vẫn tuân theo phạm vi dữ liệu và quyền của consumer. Nếu bản ghi bị xóa/không được phép đọc hoặc tải lỗi, hiển thị trạng thái tương ứng; không ngụy tạo object, không tự phát `modelChange(null)` hay biến lỗi thành thành công rỗng.
- Có thể ghi rõ “Ngừng hoạt động” ở item/giá trị đã chọn. Việc giữ dữ liệu để hiển thị không tự quyết định bản ghi có được lưu tiếp hay phải chọn lại; validation nghiệp vụ do consumer quy định.
- Khi model hoặc filters thay đổi, cập nhật đúng dữ liệu và bỏ qua response cũ. Thay đổi kết quả search/filter không tự đổi model. Trong cùng phạm vi dữ liệu, giá trị đang chọn được giữ để hiển thị; nếu đổi phạm vi/ngữ cảnh bắt buộc, consumer quyết định reset hoặc báo lỗi. Cache phải xét query/filter và phạm vi dữ liệu, không dùng kết quả của request khác.

Các case cần kiểm chứng khi triển khai: mở create không có ID; edit với ID active/inactive; ID đã chọn ngoài trang tìm kiếm; đổi search/filters/model nhanh; multiple có ID inactive; request VALUE/SEARCH lỗi độc lập; model không bị clear hoặc phát change giả khi hydrate option. Quy tắc `--` áp dụng cho value rỗng, còn lỗi lookup và empty state danh sách có trạng thái riêng.

Đây là contract/mã giả, chưa triển khai `CustomerSelectComponent` hoặc kiểm chứng browser. Đã tham khảo Core 22.3.1 (`SdSelect`, `SdSearchReq`) và mô hình wrapper `EmployeeSelectComponent`/`BaseSelectComponent` ở CRM; không sao chép generic API, inline style, render helper hoặc cách nuốt lỗi của mẫu legacy.

## Create/update — bố cục và nhập liệu

### Các bố cục đã chốt

| Bố cục | Cách tổ chức |
| --- | --- |
| Form gọn | Một `sd-section`, các field xếp theo thứ tự nhập; phù hợp ít trường |
| Nhiều section | Các nhóm `sd-section` xếp dọc; form dùng lại các component `-form` khi có trách nhiệm đủ rõ |
| Section kết hợp `sd-anchor` | Nội dung có độ rộng vừa đủ để đọc/nhập; màn lớn có anchor bên cạnh, màn nhỏ ẩn anchor và cuộn body bình thường |
| Chứng từ có dòng chi tiết | Section thông tin chung, section chứa table nhập liệu, section tổng hợp/ghi chú khi cần |
| Form có tabs | Mỗi tab là một nhóm nghiệp vụ thực sự, giữ draft khi chuyển tab; header và thanh tabs liền nhau |
| Steps ngang | Dải bước phía trên phần nhập, ví dụ Thông tin chung → Sản phẩm → Xác nhận |
| Steps dọc | Danh sách bước bên cạnh phần nhập khi đủ không gian; trên màn hẹp dùng bố cục stepper phù hợp, tránh bó hẹp field |

Không dùng bố cục section chính/phụ ở hai cột làm mặc định: chiều cao phụ thuộc dữ liệu dễ tạo khoảng trống và trồi sụt. Field ngắn trong cùng section vẫn có thể chia cột khi phù hợp; không đồng nhất việc chia cột field với đặt các section lệch chiều cao cạnh nhau.

Body không bắt buộc chiếm hết chiều rộng màn lớn. Chọn độ rộng/max-width theo lượng dữ liệu, trên màn nhỏ co về khung khả dụng; không chốt một số px/breakpoint cho mọi feature. Dùng layout/utility Core và scope style có sẵn trước khi tạo SCSS. Form dài cuộn trong vùng body được Portal/Core cấp; không áp quy tắc chỉ-table-cuộn của list cho mọi form.

### Header, section và hướng dẫn

- Title theo tác vụ: `Tạo mới <entity>` hoặc `Cập nhật <entity>`. Page có back ở `headerLeft`; không thêm nút “Hủy thay đổi” cạnh action lưu vì đã có đường quay lại.
- Một nơi chứa action lưu chính, không lặp cùng action ở header và cuối body. Với page dùng vùng action của layout đã chọn; drawer dùng footer theo contract bên dưới.
- Nhóm Thông tin chung, Thông tin liên hệ, Liên hệ và ghi chú… dùng `sd-section`; page/form con không tự dựng lại chrome section bằng SCSS.
- Hướng dẫn toàn form/section dùng `sd-inform`; mẹo ngắn gần field/nhóm dùng `type="tip"`. Nội dung giải thích cách nhập hoặc điều kiện nghiệp vụ, không đưa tên API/implementation vào flow người dùng.
- Dropdown entity và enum/const dùng wrapper đã chuẩn bị, ví dụ `customer-select`, `order-status-select`. Không gọi API option/lookup ở create/update; page vẫn sở hữu form, validation và API lưu.
- Khi nhập liệu trong table, giữ giá trị dropdown trong control, không render thêm mô tả dưới control. Áp dụng quy tắc option tối đa hai dòng và hydrate giá trị inactive ở phần Select wrapper.

Fragment mã giả dùng cho create/update, `form`/`model` theo contract consumer; nếu input đã có default phù hợp thì không khai báo lại:

```html
<sd-section title="Thông tin chung">
  <div class="p-16 d-grid gap-16">
    <customer-select
      name="customerId"
      [(model)]="model.customerId"
      [form]="form"
      required
    />
    <sd-inform
      type="tip"
      description="Chọn khách hàng nhận chứng từ để điền thông tin liên hệ phù hợp."
    />
  </div>
</sd-section>

<sd-section title="Liên hệ và ghi chú">
  <div class="p-16 d-grid gap-16">
    <sd-input name="phone" label="Điện thoại" [(model)]="model.phone" [form]="form" />
    <sd-textarea name="note" label="Ghi chú" [(model)]="model.note" [form]="form" />
  </div>
</sd-section>
```

### Draft và steps

- Khi dùng Core `[form]` + `name`, component tự đăng ký control; không đồng thời tạo FormControl khác cùng tên trong FormGroup. Consumer để Core đăng ký và khai typed optional controls, còn page vẫn sở hữu validation policy, draft và SaveReq.
- Update khởi tạo draft từ entity đã preload; sửa draft không làm thay đổi view/detail đang được dùng ở nơi khác trước khi lưu thành công.
- Chuyển tab/bước hoặc quay lại bước trước vẫn giữ dữ liệu đã nhập. Khi qua bước kế tiếp, kiểm tra điều kiện của bước hiện tại; trước khi lưu kiểm tra toàn bộ dữ liệu cần thiết.
- Nút bước trước/bước tiếp là điều hướng trong form, khác với back rời page. Bước cuối có phần kiểm tra lại và action lưu; không giả lập tiến trình nhiều bước bằng các form độc lập làm mất draft.
- Lưu đang pending không tạo request trùng; lỗi lưu giữ draft để sửa/thử lại. Dirty chỉ được xóa sau lưu thành công hoặc người dùng thực sự đồng ý bỏ thay đổi.
- Khi đã sửa rồi hoàn tác về dữ liệu ban đầu, việc xác định dirty theo giá trị/contract form, không chỉ dựa vào “đã từng gõ”. Chi tiết thời điểm hiển thị validation và điều hướng sau lưu nằm trong các điểm cần chốt tiếp.
- Core 22.3.1 `registerSdUnsavedChangesForm` theo `form.dirty`, không tự so sánh giá trị với baseline. Để đáp ứng quy tắc hoàn tác trên, consumer dùng `SdUnsavedChangesService.register` với dirty computed theo các field của form; không sửa quy tắc chung thành interaction-only. Khi test click lặp, lưu ý `SdButton` có throttle 300 ms.

## Side drawer — detail/create/update

### Phạm vi và bố cục

Drawer phục vụ xem/sửa/tạo trong ngữ cảnh hiện tại của list hoặc page cha. Feature tách `detail-side-drawer`, `create-side-drawer`, `update-side-drawer` theo [Project structure](project-structure/README.md); tái sử dụng nhóm `-form`/`-view` khi cần. Preview có thể chuyển mode trong cùng khung để review, không biến cách dựng preview thành một component production chứa mọi mode.

| Vùng | Quy ước |
| --- | --- |
| Header trái | Dùng `sdHeaderLeft`; detail có `Chi tiết <entity> #code`, badge cạnh title và tối đa một dòng mô tả |
| Header phải | `sdHeaderRight` dành cho tác vụ phụ/menu khi cần; giữ nút X mặc định của Core |
| Body detail | Các `sd-section` xếp dọc, chứa `sd-view` hoặc `sd-section-item`; có thể có tabs/related records phù hợp độ rộng |
| Body create/update | Các `sd-section` chứa field/wrapper, có `sd-inform`/tip khi cần; tránh form hai cột section chính/phụ |
| Footer | Action chính và nghiệp vụ tại `sdFooterRight`, utility `d-flex align-items-center gap-8 flex-wrap`; `sdFooterLeft` chỉ khi có thông tin/tác vụ cần thiết |
| Đóng/quay lại | X là đường đóng drawer, không thêm nút Đóng/Hủy thường trực lặp lại; page mới dùng back ở `headerLeft` |

Header/footer giữ khả dụng khi body dài; Core quản lý cuộn body, backdrop và focus. Không bọc toàn bộ drawer bằng container cuộn riêng hoặc thêm `overflow-hidden` ở feature. Tab nếu có nằm sát header, cùng nền, padding chỉ ở body tab. Mobile drawer vừa khung; kiểm tra label dài, action xuống dòng và keyboard, không ép toàn bộ nội dung theo chiều rộng desktop.

Giữ width mặc định khi đủ dùng. Core 22.3.1 mặc định `480px`; mẫu đã review dùng `600px` để chứa nhãn/value và actions, các pattern nhiều section có thể rộng hơn. Những số này là lựa chọn theo nội dung, không phải cấu hình bắt buộc mọi drawer. Detail 360° nhiều tab/table lớn hoặc form nhiều bước phức tạp thường phù hợp page hơn; không mặc định chuyển toàn bộ page vào drawer.

### Chuẩn bị dữ liệu trước khi mở

1. Kiểm tra permission tác vụ theo cơ chế consumer.
2. Với detail/update, gọi `detail(id)` qua service của đúng entity hoặc dùng detail đầy đủ còn hợp lệ trong contract hiện tại; không mặc định dùng object row từ list.
3. Kiểm tra điều kiện/quyền theo bản ghi nếu có, khởi tạo entity hoặc draft rồi mới mở phần nội dung đích.
4. Lỗi tải/thiếu quyền đi theo error mapping của consumer; không mở form rỗng như tải thành công. Khi mở liên tiếp các ID, response cũ không được ghi đè entity mới.

Drawer mở bằng method không tự chạy guard/resolver của route. Nếu drawer được điều phối bởi route, dùng chính contract [Routes](project-structure/routes.md); nếu không, caller/drawer phải thực hiện luồng chuẩn bị tương đương và có loading trong lúc chờ. Service/configuration phải ở đúng injector/environment injector của module, kể cả drawer tạo động.

### Detail có Duyệt/Từ chối/Cập nhật

- Các action là tác vụ của entity và gọi service entity (`approve`/`reject`/`update`), không sửa status ở client thay cho API. Req và việc nhận đơn/mảng theo [Services](project-structure/services.md).
- Mỗi action có `*sdPermission` riêng; trạng thái nghiệp vụ là điều kiện bổ sung, không thay thế permission. Quy tắc “đã duyệt có còn được sửa không”, “ai được gửi lại” thuộc consumer.
- Tác vụ có bước xác nhận hoặc nhập lý do khi workflow yêu cầu. Mẫu review minh họa xác nhận duyệt và từ chối kèm lý do bắt buộc; đây chưa phải quyết định bắt buộc cho mọi entity.
- Đang thực hiện action: biểu thị pending, tránh request lặp hoặc tác vụ xung đột. Lỗi giữ detail/draft và nội dung lý do để xử lý tiếp; thành công cập nhật entity/badge/action và thông tin phê duyệt từ kết quả đáng tin cậy.
- Nhiều action vẫn tuân theo quy tắc header/menu chung. Trong drawer, bộ Từ chối/Duyệt/Cập nhật có thể đặt cùng footer; màn hẹp cho xuống dòng. Nếu đổi sang icon-only phải có tooltip/tên truy cập; không bắt người dùng đoán icon.

Fragment cho detail drawer; `canApprove`, `canReject`, `canUpdate` là computed/state nghiệp vụ, `pending` là trạng thái tác vụ. Mã quyền là ví dụ của consumer, không phải quyền được Core khai báo sẵn:

```html
<sd-section title="Thông tin phê duyệt">
  <sd-section-item label="Người gửi duyệt">
    {{ requestedBy?.name | sdEmpty }}
  </sd-section-item>
  <sd-section-item label="Lý do từ chối">
    {{ entity().rejectionReason | sdEmpty }}
  </sd-section-item>
</sd-section>

<!-- Chiếu vùng này vào sd-side-drawer của DetailSideDrawerComponent. -->
<div sdFooterRight class="d-flex align-items-center gap-8 flex-wrap">
  @if (canReject()) {
    <sd-button
      *sdPermission="'CRM_ORDER_C_REJECT'"
      title="Từ chối" prefixIcon="close" type="light" color="warning"
      [disabled]="pending()" (click)="onReject()"
    />
  }
  @if (canApprove()) {
    <sd-button
      *sdPermission="'CRM_ORDER_C_APPROVE'"
      title="Duyệt" prefixIcon="check" type="light" color="success"
      [disabled]="pending()" (click)="onApprove()"
    />
  }
  @if (canUpdate()) {
    <sd-button
      *sdPermission="'CRM_ORDER_C_UPDATE'"
      title="Cập nhật đơn hàng" prefixIcon="edit" type="fill" color="primary"
      [disabled]="pending()" (click)="onUpdate()"
    />
  }
</div>
```

`requestedBy` được lấy qua pipe detail của entity tương ứng; handler gọi service và error handling của consumer. Fragment chỉ minh họa vị trí/permission, chưa phải implementation hoàn chỉnh hay API cho một Order có sẵn trong repo.

### Đóng drawer, dirty và kết quả

- Dùng `beforeClose` để thống nhất bảo vệ dirty cho X, backdrop, Escape và lệnh đóng. Từ chối đóng giữ nguyên draft; đồng ý bỏ thay đổi mới đóng. Không thêm action Hủy thường trực chỉ để xử lý dirty.
- Khi đang lưu, xử lý đóng theo trạng thái tác vụ để không mất draft hoặc phát sinh thao tác trùng. Tránh bypass guard bằng `forceClose()` trong đường đóng thông thường.
- `requestClose()` đi qua `beforeClose`; `forceClose()` chỉ dành cho đường đã giải quyết draft, ví dụ lưu thành công và flow quyết định đóng. `sdClosed` chỉ báo drawer đã đóng, không đồng nghĩa đã lưu.
- Caller phân biệt kết quả lưu/thay đổi thành công với đóng không thay đổi qua output/result có kiểu phù hợp. Chỉ refresh dữ liệu cha khi có thay đổi thành công; giữ ngữ cảnh filter/search/page/selection còn hợp lệ của list. Không dựa riêng vào sự kiện đóng để reload mọi lần.
- Sau đóng, trả focus về control đã mở drawer khi control vẫn còn. Detail → update không mở chồng nhiều drawer của cùng entity; việc lưu xong quay lại detail hay đóng về caller là flow cần chốt, không bị cố định bởi mockup.
- Core 22.3.1: `beforeClose` nhận hàm trả boolean hoặc Promise<boolean>; `disableBackdropClose` đang chặn cả backdrop và Escape. Không dùng prop này với giả định Escape vẫn đóng được. Tôn trọng public API của version consumer.

### Nguồn tham khảo và giới hạn

Đã fetch/đối chiếu `portal-template` với `origin/main` tại commit `24903b5f8653b84030a3c4400559838248e65201` ngày 23/10/2026, dùng Core `@sdcorejs/angular` 22.3.1. Nguồn được đọc:

- [Pattern drawer và footer/close guard](https://github.com/sdcorejs/portal-template/blob/24903b5f8653b84030a3c4400559838248e65201/src/modules/pattern/features/drawer/drawer.component.html).
- [Pattern header: section-item và Duyệt/Từ chối trong drawer](https://github.com/sdcorejs/portal-template/blob/24903b5f8653b84030a3c4400559838248e65201/src/modules/pattern/features/header/header.component.html).
- [Form editor: section và inform](https://github.com/sdcorejs/portal-template/blob/24903b5f8653b84030a3c4400559838248e65201/src/modules/pattern/components/form-editor.component.html).
- [Drawer theo route và bảo vệ draft](https://github.com/sdcorejs/portal-template/blob/24903b5f8653b84030a3c4400559838248e65201/src/modules/page/features/drawer-pattern-base.ts).

Đây là nguồn tham khảo API/cách phối hợp. Blueprint giữ quyết định đã review: `#` cho private, `*sdPermission`, không nhân đôi nút Đóng/Hủy, không sao chép default/SCSS hoặc một component nhiều mode chỉ vì demo dùng như vậy. Kiểm tra tương tác trên mockup chỉ xác nhận bố cục đề xuất; không thay thế AOT/Core/browser integration của consumer.

## Những điểm cần chốt tiếp

Các mục dưới đây là lựa chọn flow chưa thống nhất thành mặc định chung, không phủ định bố cục đã duyệt và không chặn việc áp dụng convention hiện tại:

| Chủ đề | Quyết định còn mở |
| --- | --- |
| Sau khi lưu thành công | Create/update page đi tới detail, quay list hay ở lại; drawer đóng về caller hay trở lại detail; hành vi Lưu và tạo tiếp nếu thực sự cần |
| Validation và lỗi API | Khi nào hiện lỗi field; map lỗi server vào field/section; summary, focus/scroll tới lỗi đầu tiên và lỗi ở tab/bước đang ẩn |
| Xác nhận tác vụ nghiệp vụ | Khi nào Duyệt/Gửi duyệt/Xóa cần xác nhận; entity nào bắt buộc lý do từ chối; xử lý xung đột hoặc dữ liệu đã đổi trên server |
| Bulk action khi có sử dụng | Báo kết quả thành công/thất bại từng phần, giữ selection và retry phần lỗi; service nhận đơn/mảng đã có convention, UI kết quả bulk chưa chốt |

Đề xuất thứ tự trao đổi tiếp: validation/lỗi API và save flow trước, sau đó confirmation/bulk khi feature cần. Quyền nghiệp vụ, trạng thái cho phép và dữ liệu bắt buộc vẫn do từng consumer quyết định; không đặt quy tắc riêng của mẫu đơn hàng thành luật toàn Blueprint.

## Điều kiện khi bổ sung mẫu

Đối chiếu đúng version @sdcorejs/angular của project. Mỗi pattern phải nêu khi dùng, API dữ liệu, input/output, state, permission, URL nếu có, responsive và cách kiểm chứng.

Spec của component đặt cạnh source; E2E của pattern nằm trong scope feature/module theo [Testing](project-structure/testing.md). Mỗi pattern nêu các case có giá trị như validation, save failure, dirty guard, direct URL, keyboard/focus; không sinh spec rỗng hoặc lặp lại cùng một case ở mọi tầng.

Detail/update có ID nhận entity đã tải sau khi qua kiểm tra quyền theo [Routes](project-structure/routes.md). Page khởi tạo view/form từ route data hoặc contract tương đương, nhận entity mới khi đổi ID và không tải lặp entity chính trong lifecycle. Thiếu quyền hoặc lỗi tải entity chuyển tới flow/trang lỗi của consumer trước khi page đích được kích hoạt. Page/drawer vẫn sở hữu lỗi validation/lưu và bảo vệ draft trong quá trình tương tác.

Component route trong `validation/angular-foundation` vẫn là fixture không có Core UI. `validation/angular-consumer` bổ sung implementation thật cho tập con nêu ở đầu tài liệu. Không copy fixture nền tảng thành page production hoặc coi toàn bộ pattern đã được kiểm chứng.

Các case UI cần kiểm chứng khi triển khai: header tối đa hai dòng; section/value đúng loại; relation thiếu dữ liệu hoặc lỗi; edit với select inactive; table nhập liệu không có mô tả thừa dưới select; chuyển tab/bước giữ draft; validation/lưu lỗi; permission độc lập với điều kiện trạng thái; chuẩn bị entity trước khi mở drawer; tất cả đường đóng qua dirty guard; cập nhật kết quả về caller và khôi phục focus. Kiểm tra responsive và scroll trên component Core thật, không suy từ ảnh/mockup.

Nguồn tham khảo là portal-template cùng API Core đúng version đã ghi ở từng pattern. Convention đã chốt được giữ khi bổ sung mã giả TS/HTML đầy đủ hoặc implementation kiểm chứng; những lựa chọn flow còn mở chỉ trở thành mặc định khi được thống nhất.
