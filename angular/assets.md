# Assets ở module và feature

## Cấu trúc

Cùng một quy ước cho module/assets và feature/assets:

| Nhóm | Nội dung |
| --- | --- |
| images | Ảnh minh họa/background/placeholder |
| icons | Icon tùy chỉnh; ưu tiên icon sẵn có của Core |
| fonts | Font đặc thù thực sự cần đóng gói |
| styles | CSS/SCSS dùng chung trong phạm vi đó |
| templates | File mẫu nghiệp vụ, ví dụ Excel import hoặc Word |
| documents | Tài liệu tĩnh mà ứng dụng cung cấp cho người dùng |

Không đưa tài liệu kiến trúc/developer vào assets/documents. Không tạo thư mục rỗng.

## Namespace URL

| Owner | URL xuất bản ví dụ |
| --- | --- |
| Module MDM | /assets/mdm/images/... |
| Feature Product | /assets/mdm/features/product/images/... |

Source feature/assets vẫn nằm trong feature. Không copy source sang module/assets chỉ để có URL mong muốn.

Host cấp assetBaseUrl qua configuration. Khi remote origin thay đổi, module không phải hardcode lại đường dẫn Portal. Cách publish và version/cache assets của từng deployment cần đồng bộ với configuration.

## Build copy — đoạn ghép vào angular.json

```json
{
  "assets": [
    {
      "glob": "**/*",
      "input": "public",
      "output": "/"
    },
    {
      "glob": "**/*",
      "input": "src/modules/mdm/assets",
      "output": "/assets/mdm",
      "ignore": ["styles/**", "**/*.scss", "**/*.sass", "**/*.less"]
    },
    {
      "glob": "**/*",
      "input": "src/modules/mdm/features/product/assets",
      "output": "/assets/mdm/features/product",
      "ignore": ["styles/**", "**/*.scss", "**/*.sass", "**/*.less"]
    }
  ]
}
```

Đây là fragment cho build.options của project Angular có các thư mục tương ứng; không thay toàn bộ angular.json. Chỉ thêm entry cho thư mục có thật.

Nếu module được build/deploy riêng, copy assets trong pipeline của module đó và cấp URL kết quả cho Portal. Configuration provider chỉ cấp URL, không tự chạy build hay copy file.

## SCSS dùng chung

- *.component.scss: style riêng của component.
- _variables.scss: biến SCSS dùng chung; màu/theme ưu tiên Core tokens.
- _mixins.scss: mixin layout/behavior.
- _utilities.scss: utility có scope/prefix rõ, chỉ thêm khi có consumer.
- _index.scss: public Sass entry tập hợp các phần dùng chung.

Ví dụ tối giản không phát sinh CSS ngoài ý muốn:

### src/modules/mdm/assets/styles/_variables.scss

<!-- example: src/modules/mdm/assets/styles/_variables.scss -->
```scss
$content-gap: 12px !default;
```

### src/modules/mdm/assets/styles/_mixins.scss

<!-- example: src/modules/mdm/assets/styles/_mixins.scss -->
```scss
@use 'variables' as variables;

@mixin content-stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  gap: variables.$content-gap;
}
```

### src/modules/mdm/assets/styles/_index.scss

<!-- example: src/modules/mdm/assets/styles/_index.scss -->
```scss
@forward 'variables';
@forward 'mixins';
```

Component sử dụng mixin qua @use và @include tại selector của mình. _utilities.scss không được tạo sẵn nếu chưa có utility cần dùng.

Không tự phát sinh reset/theme/global styles từ mỗi lần import _index.scss. Không dùng selector rộng để override toàn Portal. Nếu có CSS global thật sự cần thiết, khai báo entry và scope cụ thể trong integration.

## Nguồn

[Angular workspace assets/styles configuration](https://angular.dev/reference/configs/workspace-config).
