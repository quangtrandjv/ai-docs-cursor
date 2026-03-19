# Start — Sinh UI Test Case từ Figma

Thực hiện tuần tự các bước sau. KHÔNG bỏ qua bước nào.

## Bước 0 — Khởi động WebSocket server

Kiểm tra WebSocket server cho Figma plugin:

1. Chạy `npm run figma-socket` trong terminal
2. Nếu thành công → terminal hiển thị server đang listen trên port 3055
3. Nếu port 3055 đã bị chiếm (server đang chạy từ trước) → thông báo: "WebSocket server đã chạy sẵn." và tiếp tục
4. Nếu lỗi khác → hiển thị lỗi, đề xuất cách fix → DỪNG

Thông báo:

```
WebSocket server đang chạy (port 3055).
Hãy đảm bảo:
- Figma Desktop đã mở file design
- Plugin "Talk to Figma" đã chạy và Connect thành công
```

## Bước 1 — Nhận link Google Sheet và xác nhận template

Hỏi user:

```
Gán link Google Sheet chứa sheet TC_Scenario:
(Ví dụ: https://docs.google.com/spreadsheets/d/xxx/edit?gid=xxx#gid=xxx)
```

Chờ user gửi link. Sau khi nhận link:
- Trích xuất **Spreadsheet ID** từ URL (phần giữa `/d/` và `/edit`)
- Dùng Google Sheets MCP `list_sheets` để lấy danh sách sheet
- Tìm sheet có tên **TC_Scenario**
- Nếu không tìm thấy → thông báo: "Không tìm thấy sheet TC_Scenario trong spreadsheet này." → DỪNG
- Nếu tìm thấy → thông báo: "Đã tìm thấy sheet TC_Scenario. Tiếp tục?"

Hỏi thêm:

```
Tên hệ thống (システム名) là gì?
(Ví dụ: Reserve, Attendance...)
```

Chờ user trả lời. Nếu user bỏ qua → để trống, tester điền sau.

**Lưu lại:** Spreadsheet ID, tên hệ thống.

## Bước 2 — Chọn frame Figma và scan

Hỏi user:

```
Mở Figma Desktop và chọn (select) frame cần scan.
Nhắn "OK" khi đã chọn xong.
```

Chờ user nhắn OK / xác nhận. Sau đó:

1. `join_channel` → kết nối channel Figma (nếu chưa join)
2. `get_selection` → lấy frame đang chọn
3. Nếu không có selection → nhắc user chọn lại
4. Nếu có nhiều node → chỉ lấy node đầu tiên
5. `get_node_info(frameId)` + `scan_text_nodes(frameId)` → scan frame

**Lưu lại:** Tên frame (sẽ dùng làm tên sheet mới).

Thông báo: "Đã scan frame **[TÊN_FRAME]**."

## Bước 3 — Tạo sheet mới từ TC_Scenario template

Dùng Google Sheets MCP để tạo sheet mới:

1. `copy_sheet` — copy sheet `TC_Scenario` sang cùng spreadsheet với tên tạm:
   ```
   src_spreadsheet: [SPREADSHEET_ID]
   src_sheet:       TC_Scenario
   dst_spreadsheet: [SPREADSHEET_ID]
   dst_sheet:       [TÊN_FRAME]
   ```

2. Nếu tên sheet `[TÊN_FRAME]` đã tồn tại → thông báo và hỏi user:
   ```
   Sheet [TÊN_FRAME] đã tồn tại. Chọn:
   1. Ghi tiếp vào sheet hiện tại (không tạo mới)
   2. Tạo sheet với tên khác: [TÊN_FRAME]_2
   ```

3. Sau khi tạo xong → cập nhật header (Row 1-4) của sheet mới:
   - **Row 1, Cột C (システム名):** Giá trị user cung cấp ở Bước 1 (hoặc để trống)
   - **Row 2, Cột C (モジュールコード):** `[TÊN_FRAME]` (tên sheet mới)
   - **Row 3, Cột C (担当者):** `AI`
   - **Row 4, Cột C (画面):** `[TÊN_FRAME]` (giống Row 2)

   Dùng `update_cells` để ghi:
   ```
   sheet: [TÊN_FRAME]
   range: C1:C4
   data: [[tên hệ thống], [TÊN_FRAME], ["AI"], [TÊN_FRAME]]
   ```

4. Xóa dữ liệu mẫu trong sheet (nếu TC_Scenario có data rows mẫu từ Row 10 trở đi):
   - Đọc sheet mới để kiểm tra có data cũ từ Row 10 không
   - Nếu có → xóa data (giữ nguyên header Row 1-9)

Thông báo: "Đã tạo sheet **[TÊN_FRAME]** từ template TC_Scenario."

**Lưu lại:** Tên sheet mới = `[TÊN_FRAME]`.

## Bước 4 — Parse & Filter dữ liệu

Thực hiện theo `prompts/01-parse-figma-frame-data.md`:

1. Lọc element ẩn (visible: false, opacity: 0, kích thước 0)
2. Lọc vùng common (Header, Sidebar, Footer) — thông báo cho user đã lọc gì
3. Lọc wrapper vô nghĩa
4. Phân loại UI element (Button, Input, Label, Table, List...)
5. Gộp repeating items → chỉ giữ 1 item đại diện
6. Chuẩn hóa output → flat list theo vị trí top→bottom

Hiển thị tóm tắt:

```
Frame: [TÊN_FRAME]
Sheet đích: [TÊN_SHEET_MỚI]
Đã lọc: [danh sách vùng common đã lọc]
Tổng element: X
- Title: N
- Label: N
- Button: N
- Input: N
- Dropdown: N
- Table: N
- List: N
- Tooltip: N
- Khác: N
```

## Bước 5 — Sinh UI Test Case

Thực hiện theo `prompts/02-ui-testcase-from-figma.md`:

- TC tổng quan + 1 TC riêng cho mỗi element + 1 TC riêng cho mỗi tooltip
- TC Spacing (padding/gap) + TC Typography tổng hợp ở cuối
- List items lặp → chỉ 1 TC
- Features (cột B): tên frame từ Figma
- Sub Features (cột C): phân nhóm theo vùng UI (Title row, Form xxx, Tooltip, Layout...)
- Priority: `M` (TC Typography = `L`)
- Creator: `AI`
- **Expected Result: LUÔN ghi giá trị cụ thể** (font, size, color, width, radius, padding) từ Figma scan. KHÔNG ghi "đúng design"

Hiển thị preview bảng test cases (markdown table).

Hỏi: **"Xác nhận ghi N test cases vào sheet [TÊN_SHEET_MỚI] chưa?"**

Chỉ tiếp tục khi user đồng ý.

## Bước 6 — Ghi vào Google Sheet

Thực hiện theo `prompts/03-tc-scenario-sheet-template.md`:

1. Sheet mới đã có header (copy từ TC_Scenario) + đã cập nhật Row 1-4 ở Bước 3
2. Tìm row trống đầu tiên từ Row 10 để bắt đầu ghi
3. Merge cells F:I và J:M cho mỗi dòng TC
4. Ghi data cột A-O
5. Báo cáo kết quả:

```
✅ Đã ghi xong!
- Sheet: [TÊN_SHEET_MỚI]
- Số test cases: N
- Range: A10:O[LAST_ROW]
- Link: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```
