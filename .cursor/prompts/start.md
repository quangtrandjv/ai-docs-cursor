# Start — Sinh UI Test Case từ Figma

Thực hiện tuần tự các bước sau. KHÔNG bỏ qua bước nào.

**QUY TẮC FORMAT CHUNG:**
- Mỗi bước PHẢI bắt đầu bằng tiêu đề `## Bước N — Tên bước`
- Mỗi bước PHẢI kết thúc bằng block `📋 Kết quả` (theo template bên dưới)
- Khi hỏi user → dùng đúng câu hỏi trong template, KHÔNG diễn giải lại
- Khi chờ user trả lời → DỪNG, không tự chạy bước tiếp
- Không giải thích dài dòng — chỉ hiển thị đúng template output

---

## Bước 0 — Khởi động WebSocket server

Kiểm tra WebSocket server cho Figma plugin:

1. Chạy `npm run figma-socket` trong terminal
2. Nếu thành công → server listen trên port 3055
3. Nếu port 3055 đã bị chiếm → tiếp tục
4. Nếu lỗi khác → hiển thị lỗi → DỪNG

**📋 Output bắt buộc:**

```
## Bước 0 — Khởi động WebSocket server

✅ WebSocket server đang chạy (port 3055).

Checklist trước khi tiếp tục:
- [ ] Figma Desktop đã mở file design
- [ ] Plugin "Talk to Figma" đã chạy và Connect thành công

Nhắn **OK** khi đã sẵn sàng.
```

Chờ user nhắn OK → chuyển sang Bước 1.

---

## Bước 1 — Nhận link Google Sheet và xác nhận template

**📋 Output bắt buộc:**

```
## Bước 1 — Nhận link Google Sheet

Gửi link Google Sheet chứa sheet TC_Scenario:
(Ví dụ: https://docs.google.com/spreadsheets/d/xxx/edit?gid=xxx)
```

Chờ user gửi link. Sau khi nhận link:
- Trích xuất **Spreadsheet ID** từ URL (phần giữa `/d/` và `/edit`)
- Dùng Google Sheets MCP `list_sheets` để lấy danh sách sheet
- Tìm sheet có tên **TC_Scenario**
- Nếu không tìm thấy → thông báo lỗi → DỪNG

**📋 Output sau khi xác nhận sheet:**

```
## Bước 1 — Kết quả

| Thông tin | Giá trị |
|-----------|---------|
| Spreadsheet ID | `[ID]` |
| TC_Scenario | ✅ Tìm thấy |
| Danh sách sheet | [liệt kê tên các sheet] |

Tên hệ thống (システム名) là gì?
(Ví dụ: Reserve, Attendance, SM...)
```

Chờ user trả lời. Nếu user bỏ qua → để trống.

**Lưu lại:** Spreadsheet ID, tên hệ thống.

---

## Bước 2 — Chọn frame Figma và scan

**📋 Output bắt buộc:**

```
## Bước 2 — Chọn frame Figma

Mở Figma Desktop và **chọn (select) đúng 1 frame** cần scan.
Nhắn **OK** khi đã chọn xong.
```

Chờ user nhắn OK. Sau đó:

1. `join_channel` → kết nối channel Figma (nếu chưa join)
2. `get_selection` → lấy frame đang chọn
3. Nếu không có selection → nhắc user chọn lại
4. Nếu có nhiều node → chỉ lấy node đầu tiên
5. `get_node_info(frameId)` + `scan_text_nodes(frameId)` → scan frame

**📋 Output sau khi scan:**

```
## Bước 2 — Kết quả scan

| Thông tin | Giá trị |
|-----------|---------|
| Frame | [TÊN_FRAME] |
| Frame ID | `[FRAME_ID]` |
| Kích thước | [WIDTH] × [HEIGHT] px |
| Tổng nodes | [SỐ_NODE] |

Tiếp tục tạo sheet và parse dữ liệu?
```

**Lưu lại:** Tên frame, Frame ID.

---

## Bước 3 — Tạo sheet mới từ TC_Scenario template

Dùng Google Sheets MCP:

1. `copy_sheet` — copy sheet `TC_Scenario` sang cùng spreadsheet với tên `[TÊN_FRAME]`
2. Nếu tên sheet đã tồn tại → hỏi user:
   ```
   Sheet [TÊN_FRAME] đã tồn tại. Chọn:
   1. Ghi tiếp vào sheet hiện tại
   2. Tạo sheet mới: [TÊN_FRAME]_v2
   ```
3. Cập nhật header (Row 1-4):
   - C1 (システム名): giá trị user cung cấp ở Bước 1
   - C2 (モジュールコード): `[TÊN_FRAME]`
   - C3 (担当者): `AI`
   - C4 (画面): `[TÊN_FRAME]`
4. Xóa dữ liệu mẫu từ Row 10 nếu có

**📋 Output bắt buộc:**

```
## Bước 3 — Kết quả tạo sheet

| Thông tin | Giá trị |
|-----------|---------|
| Sheet mới | [TÊN_SHEET] |
| Template | TC_Scenario ✅ |
| Header C1:C4 | Đã cập nhật ✅ |
| Data mẫu cũ | Đã xóa ✅ (hoặc: Không có) |

Tiếp tục parse dữ liệu Figma?
```

**Lưu lại:** Tên sheet mới, Sheet ID.

---

## Bước 4 — Parse & Filter dữ liệu

Thực hiện theo `prompts/01-parse-figma-frame-data.md`:

1. Lọc element ẩn (visible: false, opacity: 0, kích thước 0)
2. Lọc vùng common (Header, Sidebar, Footer) — mặc định bỏ
3. Lọc wrapper vô nghĩa
4. Phân loại UI element (Button, Input, Label, Table, List...)
5. Phát hiện duplicate labels across sections (ghi parentSection)
6. Extract dropdown options
7. Gộp repeating items → chỉ giữ 1 item đại diện
8. Chuẩn hóa output → flat list theo vị trí top→bottom

**📋 Output bắt buộc (ĐÚNG format này):**

```
## Bước 4 — Kết quả parse & filter

**Frame:** [TÊN_FRAME]
**Sheet đích:** [TÊN_SHEET]

### Đã lọc bỏ (vùng common)

| Vùng | Node name | Số children |
|------|-----------|-------------|
| Header | [tên node] | [N] |
| Sidebar | [tên node] | [N] |
(Nếu cần test các vùng này, hãy cho tôi biết.)

### Tổng element sau lọc

| Loại | Số lượng |
|------|----------|
| Title | [N] |
| Label / Hint | [N] |
| Button | [N] |
| Input | [N] |
| Dropdown | [N] |
| List (nhóm) | [N] |
| Tooltip | [N] |
| Khác | [N] |
| **Tổng** | **[N]** |

Tiếp tục sinh test case?
```

---

## Bước 5 — Sinh UI Test Case

Thực hiện theo `prompts/02-ui-testcase-from-figma.md`:

- TC tổng quan + 1 TC riêng cho mỗi element + 1 TC riêng cho mỗi tooltip
- TC Spacing (padding/gap) + TC Typography tổng hợp ở cuối
- List items lặp → chỉ 1 TC
- Features (cột B): tên frame từ Figma
- Sub Features (cột C): phân nhóm theo vùng UI, **dùng tên tiếng Nhật** (Title row, Form 病棟, Form 面会枠, Tooltip, Layout...)
- Priority: `H` (TC Layout/Spacing = `M`, TC Typography = `L`)
- Creator: `AI`
- Preconditions: luôn ghi `Mở MH [tên JP]`
- **Expected Result: LUÔN ghi giá trị cụ thể** (font, size, color, width, radius, padding) từ Figma scan. KHÔNG ghi "đúng design"

**📋 Output bắt buộc (ĐÚNG format này):**

```
## Bước 5 — Preview test cases

**Frame:** [TÊN_FRAME] | **Sheet:** [TÊN_SHEET] | **Tổng TC:** [N]

| # | Sub Features | Test Case Title | Pri | Expected (tóm tắt) |
|---|-------------|-----------------|-----|---------------------|
| 1 | Layout | Check giao diện tổng quan | M | Nền #ffffff; bố cục khớp [W]×[H]px |
| 2 | Title row | Check tiêu đề「...」 | H | Font ..., size ...px |
| 3 | ... | ... | ... | ... |
| N | Typography | Check tổng hợp font size | L | Title 28px; Header 14px; ... |

---

**Xác nhận ghi [N] test cases vào sheet [TÊN_SHEET]?** (yes/no)
```

Chỉ tiếp tục khi user đồng ý.

---

## Bước 6 — Ghi vào Google Sheet

Thực hiện theo `prompts/03-tc-scenario-sheet-template.md`:

1. **Tính phạm vi:** `LAST_DATA_ROW = 9 + TC_COUNT`, `END_ROW_INDEX = LAST_DATA_ROW`
2. Sheet đã có header (copy từ TC_Scenario) + đã cập nhật Row 1-4 ở Bước 3
3. Gộp TẤT CẢ requests vào **1 lần gọi `batch_update` duy nhất**, theo thứ tự:
   - Merge cells F:I và J:M cho mỗi dòng TC
   - Border DOTTED cho toàn bộ data range (4 requests theo vùng)
   - repeatCell (wrap + TOP)
   - autoResizeDimensions
4. Ghi data cột A-O bằng `batch_update_cells`

**📋 Output bắt buộc:**

```
## Bước 6 — Kết quả ghi sheet

| Thông tin | Giá trị |
|-----------|---------|
| Sheet | [TÊN_SHEET] |
| Số test cases | [N] |
| Data range | A10:O[LAST_ROW] |
| Merge cells | [N×2] requests ✅ |
| Border | DOTTED ✅ |
| Text wrap | WRAP + TOP ✅ |
| Auto resize | ✅ |

🔗 [Mở Google Sheet](https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit)
```

## Bước 7 — Dọn dẹp và lưu báo cáo

Thực hiện tự động ngay sau Bước 6, KHÔNG cần hỏi user.

### 7.1 Lưu báo cáo vào `output/[TÊN_FRAME]-report.md`

Tạo file markdown chứa toàn bộ thông tin đã xác nhận trong flow:

```markdown
# [TÊN_FRAME] — TC Report

**Ngày tạo:** [YYYY-MM-DD]
**Spreadsheet:** `[SPREADSHEET_ID]`
**Sheet:** [TÊN_SHEET]
**Sheet ID:** [SHEET_ID]

## Thông tin header (C1:C4)

| Row | Label | Giá trị |
|-----|-------|---------|
| C1 | システム名 | [GIÁ TRỊ] |
| C2 | モジュールコード | [TÊN_FRAME] |
| C3 | 担当者 | AI |
| C4 | 画面 | [TÊN_FRAME] |

## Figma scan

| Thông tin | Giá trị |
|-----------|---------|
| Frame | [TÊN_FRAME] |
| Frame ID | [FRAME_ID] |
| Kích thước | [W] × [H] px |
| Đã lọc | [danh sách vùng common] |

## Preview test cases

[Copy bảng preview từ Bước 5 vào đây — đầy đủ N dòng]

## Kết quả ghi sheet

| Thông tin | Giá trị |
|-----------|---------|
| Số TC | [N] |
| Data range | A10:O[LAST_ROW] |
| Link | [URL] |
```

### 7.2 Xóa file tạm

Xóa tất cả file tạm đã tạo trong quá trình chạy flow (JSON cache, parsed data, chunk files...).
Giữ lại:
- `output/[TÊN_FRAME]-report.md` (vừa tạo ở 7.1)
- `output/README.md`
- Tất cả file trong `scripts/`, `prompts/`, `.cursor/`, `figma-plugin/`

Lệnh xóa: tìm và xóa các file `.json`, `.txt` trong thư mục gốc project và folder `output/` mà KHÔNG nằm trong danh sách giữ lại (`package.json`, `package-lock.json`).

### 7.3 Hiển thị thông báo hoàn thành

**📋 Output bắt buộc:**

```
---

✅ **Hoàn thành!** Đã tạo xong [N] test cases cho màn hình [TÊN_FRAME] vào sheet [TÊN_SHEET].

📄 Báo cáo: `output/[TÊN_FRAME]-report.md`
🗑️ Đã dọn [X] file tạm.

Vui lòng mở link Google Sheet để kiểm tra kết quả.
```

**Sau khi hiển thị output trên → DỪNG.** Không tự chạy thêm bước nào.
