# Blueprint site

Site HTML tĩnh trình bày lại Markdown trong `angular-portal/` bằng hình, từng bước và code explorer. **Markdown là nguồn quy tắc**; site không thêm quy tắc mới. Quy tắc đồng bộ nằm trong [AGENTS.md](../AGENTS.md#đồng-bộ-markdown--ui-bắt-buộc).

## Chạy

Node theo `.node-version` (24.x).

```sh
cd site
npm ci
npm run check:sync   # 10 quy tắc đồng bộ Markdown ↔ UI
npm test             # unit test của bộ đọc Markdown và check:sync
npm run build        # xuất dist/ (tĩnh, không gọi CDN lúc chạy)
npm run serve        # xem dist/ tại http://localhost:4173
npm run test:e2e     # Playwright: deep link, bàn phím, 390px, contrast
```

## Cấu trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `page-map.json` | Bản đồ trang → `file#heading` nguồn, file code, file minh họa, ảnh và dấu đồng bộ |
| `content/home.json` | Trang chủ: thẻ “Đọc theo công việc”; quy tắc chung đọc trực tiếp từ Markdown |
| `content/pages/<id>.json` | Nội dung trình bày của từng trang (tóm tắt, hình chính, bước, callout, Đúng/Sai, lint) |
| `content/illustrative/<id>/` | File minh họa chưa có block trong Markdown; luôn hiển thị nhãn “Minh họa” |
| `assets/img/` | Ảnh chụp; nguồn và ngày chụp khai báo trong `page-map.json → images` |
| `scripts/` | `build.mjs`, `check-sync.mjs`, `outline.mjs`, bộ đọc Markdown trong `lib/` |
| `src/` | HTML/CSS/JS phía trình duyệt (vanilla, ES module) |

## page-map.json

```jsonc
{
  "groups": [{ "id": "project-structure", "no": "02", "name": "Project structure", "pages": ["bp-tree", "…"] }],
  "pages": {
    "bp-routes": {
      "no": "BP-05",
      "title": "Routes & route có ID",
      "layout": "explorer",                       // explorer (2a) | doc (1a)
      "sources": ["angular-portal/project-structure/routes.md#contract-vào-route-có-id"],
      "checklist": "angular-portal/project-structure/README.md#kiểm-tra-trước-bàn-giao", // mục Nghiệm thu / Kiểm tra trước bàn giao, hoặc null
      "files": {
        "p-routes": { "example": "src/modules/mdm/features/product/routes.ts" },          // block <!-- example: … -->
        "detail-route": { "block": "angular-portal/project-structure/routes.md#permission-theo-consumer", "index": 0,
                          "name": "detail-route.ts", "note": "Mã giả trong routes.md" },   // block thứ index ngay dưới heading
        "p-detail-ts": { "illustrative": "illustrative/bp-routes/detail.component.ts",
                         "path": "src/modules/mdm/features/product/pages/detail/detail.component.ts" },
        "app-dir": { "role": "Shell, navigation, auth, cấu hình triển khai", "owner": "Portal",
                     "path": "src/app/", "ref": "angular-portal/project-structure/README.md#quyền-sở-hữu" } // thẻ mô tả, không có code
      },
      "illustrative": ["p-detail-ts"],            // bắt buộc liệt kê mọi file minh họa
      "locks": { "…": "sha256-…" }                // do npm run sync:accept ghi, không sửa tay
    }
  },
  "hidden": [{ "file": "angular-portal/…md", "reason": "…" }],
  "images": { "assets/img/portal-list.png": { "source": "…", "capturedAt": "2026-11-05", "stale": false } }
}
```

Anchor dùng slug của GitHub. In danh sách anchor và block của một file:

```sh
node scripts/outline.mjs angular-portal/project-structure/routes.md
```

## content/pages/&lt;id&gt;.json

```jsonc
{
  "desc": "Một câu mô tả trang.",
  "minutes": 8,
  "movedFrom": "I-03 · I-04",                     // mã trang portal-template cũ, hoặc null
  "tldr": ["…", "…", "…"],                        // đúng 3 ý
  "hero": { "type": "flow", "label": "…", "items": [{ "t": "Guard", "s": "canActivateChild" }] },
  "steps": [{
    "title": "Resolve entity",
    "ref": "angular-portal/project-structure/routes.md#contract-vào-route-có-id",  // bắt buộc
    "text": "Diễn đạt lại câu trong ref; hỗ trợ `code` và **đậm**.",
    "file": "resolver-call", "lines": [1, 3],     // highlight; Doc có thể thêm "range": [a, b] để chỉ hiện đoạn
    "focus": [2],                                 // index phần tử hero sáng lên
    "must": { "quote": "câu nguyên văn trong ref chứa MUST/phải/bắt buộc" },
    "should": { "quote": "câu nguyên văn trong ref chứa SHOULD/nên/ưu tiên/mặc định" },
    "callouts": [{ "kind": "tip|info|warn", "text": "…", "ref": "mặc định = ref của bước", "quote": "bắt buộc với warn" }],
    "result": "Kết quả nhìn thấy được."
  }],
  "do": { "text": "…", "ref": "…" },
  "dont": { "text": "…", "ref": "…", "quote": "câu cấm nguyên văn", "rule": "tên rule ESLint chặn, nếu có" },
  "lint": [{ "rule": "no-restricted-imports", "status": "on|config|custom", "note": "…" },
           { "status": "external", "note": "Kiểm bằng review" }],
  "demo": { "url": "https://…", "label": "…", "img": "assets/img/…" }
}
```

Hero: `flow` (items `{t, s}`), `tree` (items `{t}` mỗi dòng), `shot` (`img`, `ratio`, `alt`, items `{t, x, y}` là pin), `stack` (items `{t, s}` xếp chồng), `compare` (items `{role, ok, bad}`). Phiên bản Angular/TypeScript/Core viết bằng `{angular}`, `{typescript}`, `{core}`; build thay bằng giá trị trong `validation/`.

## Khi đổi Markdown

1. Sửa Markdown.
2. `npm run check:sync` báo trang nào phụ thuộc phần vừa đổi (file, heading, block).
3. Rà và sửa trang đó trong cùng PR; chạy lại `npm run check:sync`.
4. Khi trang đã khớp, `npm run sync:accept` ghi lại dấu đồng bộ.

`--no-locks` và `--page=<id>` chỉ dùng khi đang soạn; CI luôn chạy đủ.
