# AGENTS.md — SDCoreJS Blueprint

Hướng dẫn cho AI agent và developer làm việc trong repo này. Đọc hết trước khi sửa.

## Trước khi bắt đầu

- Đọc `HANDOFF.md`, `README.md`, `angular-portal/README.md` và tài liệu liên quan tới việc đang làm.
- Kiểm tra HEAD, branch và PR mới nhất; trạng thái có thể đã đổi sau ngày ghi trong handoff.
- Đối chiếu API Core đúng version của consumer trước khi viết code mẫu; không suy API từ tên component hoặc ví dụ Angular thuần.

## Nguồn sự thật

- Markdown trong `angular-portal/` là nguồn quy tắc cho AI và developer.
- Site HTML trong `site/` là lớp trình bày lại bằng hình, từng bước và code explorer. Site không phải nguồn quy tắc.
- Code mẫu nằm trong block Markdown có marker `<!-- example: <path> -->`. Không duy trì bản source mẫu thứ hai.

## Đồng bộ Markdown ↔ UI (bắt buộc)

Markdown và site phải luôn nói cùng một điều. Mọi PR đều áp dụng các quy tắc sau.

1. **Cùng một PR.** Đổi quy tắc, code mẫu, checklist, tên file hoặc heading trong `angular-portal/**/*.md` thì cập nhật trang site tương ứng trong cùng PR. Đổi nội dung trang site thì Markdown phải có sẵn quy tắc đó, hoặc được bổ sung trong cùng PR.
2. **Markdown thắng.** Khi site và Markdown khác nhau, sửa site theo Markdown. Nếu cho rằng Markdown sai, nêu trong PR và hỏi maintainer; không tự đổi quy tắc chỉ để khớp UI.
3. **Không có quy tắc chỉ nằm trên UI.** Tóm tắt, Mẹo, Lưu ý, Tránh và Đúng/Sai trên site diễn đạt lại câu có trong Markdown nguồn. Badge MUST và callout Tránh chỉ dùng khi Markdown có câu MUST hoặc câu cấm tương ứng.
4. **Bản đồ trang.** `site/page-map.json` ghi mỗi trang → các `file#heading` nguồn. Thêm, xóa hoặc đổi tên heading thì cập nhật map. File Markdown mới phải có trang tương ứng hoặc được khai báo `hidden` kèm lý do.
5. **Code lấy từ Markdown.** Code trên site do build trích từ block `example`; không chép tay. File chỉ để minh họa (chưa có block trong Markdown) phải nằm trong danh sách `illustrative` của page-map và hiển thị nhãn “Minh họa”. Ưu tiên bổ sung block vào Markdown thay vì giữ file minh họa.
6. **MUST/SHOULD.** Nhãn MUST/SHOULD trên UI lấy đúng từ câu trong Markdown.
7. **Checklist.** Checklist của trang lấy từ mục “Nghiệm thu” hoặc “Kiểm tra trước bàn giao” của Markdown nguồn.
8. **ESLint.** Tên rule hiển thị trên site phải có trong `angular-portal/conventions/eslint.md`. Đổi rule ở một nơi thì đổi cả hai.
9. **Ảnh.** Mỗi ảnh ghi nguồn và ngày chụp trong page-map. Ảnh không còn đúng quy tắc hiện tại phải được chụp lại hoặc gắn nhãn “Ảnh cũ”.
10. **Version.** Baseline Angular, TypeScript, Core hiển thị trên site lấy từ cùng nguồn với `validation/`.

### Kiểm tra trước khi commit

```sh
cd site && npm run check:sync        # anchor tồn tại, code khớp block, checklist khớp, rule có trong eslint.md, không có Markdown chưa map
cd validation/angular-foundation && npm run check   # khi đổi block code
```

Không xóa assertion hoặc nới kiểm tra chỉ để PASS. Báo đúng những kiểm tra thực sự đã chạy.

### Mô tả PR

Thêm mục **Đồng bộ Markdown ↔ UI** gồm: file Markdown đã đổi, trang site đã đổi, phần không cần đổi kèm lý do.

## Ranh giới kiểm chứng

- Giữ nguyên ranh giới giữa code nền tảng đã kiểm chứng (`validation/`) và UI/mã giả chưa chạy trên Core thật.
- Fixture kiểm chứng không được copy thành UI production hoặc báo cáo là pattern đã hoàn thành.

## Khi kết thúc phiên

Cập nhật `HANDOFF.md`: việc đã làm, kiểm tra đã chạy thật, chỗ còn mở.
