# ESLint cho quy ước Blueprint

Trạng thái: bản nháp, chờ review. Blueprint liệt kê rule; consumer ghép vào `eslint.config.js` của mình. Rule mới bật ở mức `warn`, sửa code hiện có cho sạch rồi mới nâng `error`.

## Trạng thái rule

| Quy ước | Rule | Trạng thái |
| --- | --- | --- |
| Output không tiền tố on, không trùng sự kiện native | @angular-eslint/no-output-on-prefix · no-output-native | Có trong tsRecommended |
| Không dùng any | @typescript-eslint/no-explicit-any | Có trong recommended |
| Ảnh có alt, không div (click), th scope | template/alt-text · click-events-have-key-events · table-scope | Có trong templateAccessibility |
| Hàm bắt đầu bằng động từ; boolean, array, Type/Enum | @typescript-eslint/naming-convention | Cấu hình thêm, type-aware |
| Không data, info, item, obj | id-denylist | Cấu hình thêm |
| Private member dùng # | no-restricted-syntax | Cấu hình thêm |
| Promise phải được xử lý | @typescript-eslint/no-floating-promises | Cấu hình thêm, type-aware |
| Host không import features/; module không import environments | no-restricted-imports | Cấu hình thêm |
| inject() thay constructor; không new …Service() | @angular-eslint/prefer-inject · no-restricted-syntax | Cấu hình thêm |
| Signal input/query; output readonly | @angular-eslint/prefer-signals · prefer-output-readonly | Cấu hình thêm |
| Mã quyền MODULE_ENTITY_[C/A/G]_ACTION | no-restricted-syntax | Cấu hình thêm |
| button có type | template/button-has-type | Cấu hình thêm |
| Boolean trong signal/computed/input có tiền tố | local/signal-boolean-prefix | Custom rule |
| Không .set() trong effect() | local/no-set-in-effect | Custom rule |
| iframe có title | local/iframe-has-title | Custom rule |
| Template không gọi hasPermission() | local/no-permission-call-in-template | Custom rule |
| Không ::ng-deep, không mã màu hex trong scss feature | Stylelint | Ngoài ESLint, đề xuất riêng |

## Phần bổ sung cho eslint.config.js

```js
{
  files: ['**/*.ts'],
  languageOptions: { parserOptions: { projectService: true } },
  plugins: { local: require('./eslint-rules') },
  rules: {
    '@typescript-eslint/naming-convention': ['warn',
      { selector: ['variable', 'property', 'parameter'], types: ['boolean'],
        format: ['PascalCase'], prefix: ['is', 'has', 'should', 'can'],
        filter: { regex: '^(loading|disabled|readonly)$', match: false } },
      { selector: ['variable', 'property'], types: ['array'], format: ['camelCase'],
        custom: { regex: '(s|List|Collection)$', match: true },
        filter: { regex: '^children$', match: false } },
      { selector: ['function', 'method'], format: ['camelCase'],
        custom: { regex: '^(get|fetch|read|list|detail|create|update|delete|remove|approve|reject|set|save|on|to|format|convert|ng)', match: true } },
      { selector: 'typeLike', format: ['PascalCase'] },
      { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: false } },
      { selector: 'typeAlias', format: ['PascalCase'], custom: { regex: '^T[A-Z]', match: false } },
      { selector: 'enumMember', format: ['PascalCase'] },
    ],
    'id-denylist': ['warn', 'data', 'info', 'item', 'obj'],
    '@typescript-eslint/no-floating-promises': 'error',
    '@angular-eslint/prefer-inject': 'error',
    '@angular-eslint/prefer-signals': 'warn',
    '@angular-eslint/prefer-output-readonly': 'error',
    'no-restricted-syntax': ['error',
      { selector: "Property[key.name='permission'] > Literal:not([value=/^[A-Z0-9]+_[A-Z0-9]+_[CAG]_[A-Z0-9_]+$/])",
        message: 'Mã quyền MODULE_ENTITY_TYPE_ACTION · conventions/permission.md' },
      { selector: 'NewExpression[callee.name=/Service$/]',
        message: 'Dùng inject() · project-structure/configuration.md' },
      { selector: "PropertyDefinition[accessibility='private'], MethodDefinition[accessibility='private']",
        message: 'Private member dùng # · conventions/naming.md' },
    ],
    'local/signal-boolean-prefix': 'warn',
    'local/no-set-in-effect': 'warn',
  },
},
{
  files: ['src/app/**/*.ts'],
  rules: { 'no-restricted-imports': ['error', { patterns: [
    { group: ['**/modules/*/features/**'], message: 'Import từ public entry · project-structure/README.md' },
  ] }] },
},
{
  files: ['src/modules/**/*.ts'],
  rules: { 'no-restricted-imports': ['error', { patterns: [
    { group: ['**/environments/*'], message: 'Nhận cấu hình qua provide<Module>Configuration · configuration.md' },
  ] }] },
},
{
  files: ['**/*.html'],
  rules: {
    '@angular-eslint/template/button-has-type': 'error',
    'local/iframe-has-title': 'error',
    'local/no-permission-call-in-template': 'error',
  },
},
```

## Lưu ý

- Rule naming-convention cho boolean/array và no-floating-promises cần lint type-aware; đo thời gian `npm run lint` trước và sau khi bật.
- naming-convention chỉ thấy kiểu `WritableSignal<boolean>`, không thấy boolean bên trong; custom rule `local/signal-boolean-prefix` bù phần này.
- Chỉ `no-restricted-*` cho đổi message. Custom rule đặt `meta.docs.url` trỏ về trang Blueprint tương ứng.
- Danh sách động từ cho tên hàm là danh sách mở; bổ sung khi gặp trường hợp hợp lệ, không tắt rule.
- Custom rule có test bằng RuleTester, đặt cùng `eslint-rules/`.

## Kiểm chứng

- [validation/angular-foundation](../../validation/angular-foundation/README.md) trích block Markdown, type-check, kiểm DI/HTTP.
- [validation/angular-consumer](../../validation/angular-consumer/README.md) chạy Core UI thật, production AOT, router integration và Playwright trên CI.
- Code fixture/typecheck không thay bằng chứng E2E.
