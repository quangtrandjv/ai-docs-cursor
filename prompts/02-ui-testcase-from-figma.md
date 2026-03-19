# Sinh UI Test Case từ Figma Design

## Mục đích

Scan frame đang chọn trong Figma, phân tích các UI element, sinh test case kiểm tra giao diện chi tiết cho từng element và ghi vào Google Sheet theo template TC_Scenario.

## Điều kiện

- Figma Desktop đang mở file design, plugin Talk to Figma đã kết nối
- User đã chọn **đúng 1 frame** (1 màn hình) trong Figma
- Google Sheets MCP đã kết nối (nếu cần ghi sheet)
- Đã đọc hiểu quy trình parse data tại `prompts/01-parse-figma-frame-data.md`
- Đã đọc hiểu template TC_Scenario tại `prompts/03-tc-scenario-sheet-template.md`

---

## Quy trình thực hiện

### Bước 1 — Kết nối và lấy frame

```
1. join_channel → kết nối channel Figma (nếu chưa join)
2. get_selection → lấy ID của frame đang chọn
3. Xác nhận với user: "Đã nhận frame [TÊN_FRAME]. Tiếp tục scan?"
```

**Lưu ý:** Nếu `get_selection` trả về nhiều node → chỉ lấy node đầu tiên và thông báo cho user.

### Bước 2 — Scan frame

Gọi song song 2 tools:

```
get_node_info(frameId)    → cấu trúc cây node: children, type, name, style, fills, bounds
scan_text_nodes(frameId)  → danh sách tất cả text nodes: characters, fontName, fontSize, fills
```

### Bước 3 — Parse & Filter dữ liệu

Thực hiện đúng theo quy trình trong **`prompts/01-parse-figma-frame-data.md`**:

1. **Lọc element ẩn** — bỏ `visible: false`, `opacity: 0`, kích thước 0
2. **Lọc vùng common** — bỏ Header, Sidebar, Footer... (mặc định). Thông báo cho user đã lọc những gì
3. **Lọc wrapper vô nghĩa** — bỏ frame auto-generated, nâng child lên
4. **Phân loại element** — gán loại UI (Button, Input, Label, Table, List...)
5. **Gộp repeating items** — INSTANCE lặp → gộp thành List, chỉ giữ 1 item
6. **Chuẩn hóa output** — flat list sắp xếp theo vị trí (top→bottom, left→right)

Kết quả: danh sách element sạch, mỗi item có `name`, `uiType`, `text`, `location`, `bounds`.

### Bước 4 — Sinh UI Test Cases

Với mỗi element đáng chú ý, tạo 1 test case theo format.

**NGUYÊN TẮC QUAN TRỌNG cho Expected Result:**
- **LUÔN ghi giá trị cụ thể** lấy từ Figma scan, KHÔNG ghi "đúng design"
- Mỗi Expected Result phải bao gồm **tất cả thuộc tính** mà Figma cung cấp cho element đó
- Thuộc tính cần ghi (nếu có trong data scan):

| Thuộc tính | Cách lấy từ Figma | Ví dụ |
|------------|-------------------|-------|
| Font family | `style.fontFamily` hoặc `fontName` | Noto Sans JP, Meiryo |
| Font weight | `style.fontWeight` hoặc `fontName.style` | Regular, Bold |
| Font size | `style.fontSize` | 14px, 16px, 28px |
| Text color | `fills[0].color` → convert sang hex | #333333, #ffffff |
| Background | `fills[0].color` của parent frame/rectangle | #7cbd45, #eeeeee |
| Width | `absoluteBoundingBox.width` | 200px, 128px |
| Height | `absoluteBoundingBox.height` | 36px, 50px |
| Kích thước (WxH) | width × height | 128×36 px |
| Border radius | `cornerRadius` | 4px, 8px |
| Padding | `paddingLeft/Right/Top/Bottom` | 16px |
| Gap/Spacing | `itemSpacing` (auto-layout) | 16px |
| Stroke/Border | `strokes`, `strokeWeight` | border 1px #cccccc |
| Placeholder text | `characters` của TEXT con bên trong input | 「表示名」 |
| Tooltip text | Text trong tooltip node | 「未入力の場合は...」 |
| Opacity | `opacity` (nếu < 1) | opacity 0.5 |

#### 4.1 Test Case đầu tiên (luôn có): Check giao diện tổng quan

```
Title:     Check giao diện tổng quan
Steps:     1. Open màn hình [Tên frame]
           2. Quan sát toàn bộ giao diện
Expected:  1. Màn hình hiển thị đúng design
           2. Layout, bố cục các thành phần đúng vị trí
Priority:  M
```

#### 4.2 Test Case cho từng element

**Title / Tiêu đề trang:**
```
Title:     Check tiêu đề [text JP]
Steps:     1. Open màn hình [Tên frame]
           2. Xem tiêu đề trang
Expected:  Tiêu đề hiển thị 「[text JP]」, [mô tả vị trí: cùng hàng với X (trái) và Y (phải)].
           Font [fontFamily] [fontWeight], font size [fontSize]px.
           Màu chữ [textColor].
```

**Label / Nhãn form:**
```
Title:     Check nhãn [text JP]
Steps:     1. Open màn hình [Tên frame]
           2. Xem [vị trí: form/section chứa label]
Expected:  Nhãn 「[text JP]」 hiển thị.
           Font [fontFamily] [fontWeight], font size [fontSize]px.
           Màu chữ [textColor].
```

**Button:**
```
Title:     Check [nút/button] [text JP]
Steps:     1. Open màn hình [Tên frame]
           2. Xem [vị trí: vùng chứa button]
Expected:  Nút 「[text JP]」 hiển thị [mô tả vị trí].
           Kích thước: [width]×[height] px.
           Background: [bgColor].
           Border radius: [radius]px.
           Font [fontSize]px, màu chữ [textColor].
```

**Button icon (nút chỉ có icon, không có text):**
```
Title:     Check nút [tên icon JP] (icon)
Steps:     1. Open màn hình [Tên frame]
           2. Xem [vị trí]
Expected:  Nút [tên] hiển thị icon [mô tả icon], [vị trí].
           Kích thước nút: [width]×[height] px.
           Background: [bgColor].
           Icon: [iconWidth]×[iconHeight] px.
```

**Input field:**
```
Title:     Check [placeholder text hoặc tên input JP]
Steps:     1. Open màn hình [Tên frame]
           2. Xem ô nhập [vị trí: bên cạnh label nào]
Expected:  Placeholder text 「[placeholder]」 hiển thị.
           Font [fontFamily] [fontWeight], font size [fontSize]px.
           Độ rộng ô: [width]px.
           [Border radius: [radius]px.] (nếu có)
           [Border: [strokeWeight]px [strokeColor].] (nếu có)
```

**Dropdown / Select:**
```
Title:     Check dropdown [tên dropdown JP]
Steps:     1. Open màn hình [Tên frame]
           2. Click dropdown [tên]
           3. Xem danh sách và độ rộng ô
Expected:  Độ rộng dropdown: [width]px.
           Hiển thị [N] option:
           [option1]
           [option2]
           ...
           Font [fontSize]px.
           [Border radius: [radius]px.] (nếu có)
```

**Checkbox / Radio / Toggle:**
```
Title:     Check [loại] [tên JP]
Steps:     1. Open màn hình [Tên frame]
           2. Xác nhận hiển thị [loại] [tên]
Expected:  [Loại] 「[tên]」 hiển thị [vị trí].
           Kích thước: [width]×[height] px.
           Trạng thái mặc định: [checked/unchecked/on/off].
           Label font [fontSize]px.
```

**Table header:**
```
Title:     Check cột bảng [tên cột JP]
Steps:     1. Open màn hình [Tên frame]
           2. Xem header cột bảng
Expected:  Cột 「[tên cột]」 hiển thị.
           Font [fontFamily] [fontWeight], font size [fontSize]px.
           [Màu chữ [textColor].] (nếu khác default)
```

**Table row / List cell:**
```
Title:     Check font size nội dung dòng bảng
Steps:     1. Open màn hình [Tên frame]
           2. Xem nội dung 1 dòng bảng
Expected:  Text dòng ([liệt kê tên cột]) dùng [fontFamily] [fontWeight].
           Font size [fontSize]px.
           [Màu chữ [textColor].] (nếu khác default)
```

**List / Repeating items:**
```
Title:     Check hiển thị item trong danh sách [tên list]
Steps:     1. Open màn hình [Tên frame]
           2. Xác nhận hiển thị danh sách [tên list]
           3. Xác nhận layout 1 item trong danh sách
Expected:  2. Danh sách hiển thị đúng vị trí
           3. Mỗi item hiển thị: [mô tả thành phần có trong 1 item từ design]
           Font [fontSize]px.
```

**Modal / Dialog:**
```
Title:     Check hiển thị [tên modal JP]
Steps:     1. Open màn hình [Tên frame]
           2. Thao tác mở [tên modal]
           3. Xác nhận giao diện modal
Expected:  2. Modal hiển thị
           3. Title 「[title text]」, font [fontSize]px.
           Kích thước modal: [width]×[height] px.
           Background: [bgColor].
           Border radius: [radius]px.
           [Nút đóng/xác nhận: mô tả chi tiết]
```

**Tooltip:**
```
Title:     Check tooltip [tên element JP]
Steps:     1. Open màn hình [Tên frame]
           2. Hover vào [icon/label] có tooltip [tên]
Expected:  Tooltip hiển thị: 「[nội dung tooltip text đầy đủ]」.
           Font [fontSize]px.
```

**Icon:**
```
Title:     Check icon [tên icon]
Steps:     1. Open màn hình [Tên frame]
           2. Xác nhận hiển thị icon [tên] tại [vị trí]
Expected:  Icon hiển thị [vị trí].
           Kích thước: [width]×[height] px.
           [Màu: [fillColor].] (nếu là vector icon)
```

**Image / Avatar:**
```
Title:     Check hiển thị [image/avatar] [tên]
Steps:     1. Open màn hình [Tên frame]
           2. Xác nhận hiển thị [image/avatar]
Expected:  [Image/Avatar] hiển thị [vị trí].
           Kích thước: [width]×[height] px.
           [Border radius: [radius]px.] (nếu có)
```

#### 4.3 Test Case bổ sung (luôn tạo nếu có data)

**TC Tooltip:** Tạo 1 TC riêng cho MỖI tooltip tìm thấy trong frame. Ghi rõ toàn bộ nội dung text tooltip.

**TC Spacing / Khoảng cách:**
```
Title:     Check khoảng cách padding/gap
Steps:     1. Open màn hình [Tên frame]
           2. Xem khoảng cách giữa [mô tả các vùng chính]
Expected:  Khoảng cách: [liệt kê padding/gap cụ thể từ Figma].
           Ví dụ: padding form 16px; gap giữa form và list 16px; gap giữa các block 16px.
```

**TC Typography tổng hợp (luôn là TC cuối cùng):**
```
Title:     Check tổng hợp font size
Steps:     1. Open màn hình [Tên frame]
           2. So sánh font size (px) của từng nhóm text sau với giá trị trong cột Expected Result:
           (1) [Nhóm 1: Tiêu đề trang]
           (2) [Nhóm 2: Header bảng]
           (3) [Nhóm 3: Nội dung bảng]
           (4) [Nhóm 4: Nhãn form]
           (5) [Nhóm 5: Input/button/dropdown]
           (6) [Nhóm 6: Nút chính]
           (7) [Nhóm 7: Tooltip]
Expected:  [Nhóm 1] [fontSize]px
           [Nhóm 2] [fontSize]px
           [Nhóm 3] [fontSize]px
           [Nhóm 4] [fontSize]px
           [Nhóm 5] [fontSize]px
           [Nhóm 6] [fontSize]px
           [Nhóm 7] [fontSize]px.
Priority:  L
```

#### 4.4 Quy tắc chung khi sinh TC

**Nội dung:**
- **Mỗi element đáng chú ý = 1 TC riêng biệt**
- **List items lặp lại → chỉ 1 TC** cho cả nhóm
- **Mỗi tooltip = 1 TC riêng** — ghi rõ toàn bộ text tooltip
- **Mỗi placeholder = ghi rõ text** — không ghi "placeholder đúng design"
- **TC Spacing + TC Typography** luôn tạo ở cuối nếu có data

**Expected Result — KHÔNG ĐƯỢC ghi chung chung:**
- ❌ "hiển thị đúng design"
- ❌ "cỡ chữ đúng design"
- ❌ "placeholder đúng design"
- ✅ "Font Noto Sans JP Regular, font size: 14px."
- ✅ "Placeholder text 「表示名」"
- ✅ "Width: 128px. Height: 36px. Background: #7cbd45. Border radius: 4px."

**Expected Result — KHÔNG ĐƯỢC dùng tên node/path Figma:**
- ❌ `Instance lv2/button/back kích thước 50×50px` → tên node Figma, người đọc không hiểu
- ❌ `Ô lv2/form/input 240×32px` → tên node Figma
- ❌ `Nút lv2/button📖 64×39px` → tên node + emoji
- ❌ `Frame 86 form`, `Bottom_wrap`, `Container` → tên nội bộ Figma
- ✅ `Nút quay lại (icon mũi tên) width: 50px, height: 50px.`
- ✅ `Ô nhập 表示名 width: 240px, height: 32px.`
- ✅ `Nút 「保存」 width: 64px, height: 39px.`

**Expected Result — KHÔNG ĐƯỢC ghi kích thước bounding box của text:**
- ❌ `vùng text 908×21px`, `vùng chữ 96×24px`, `vùng tên 224×24px`
- Kích thước bounding box text là thông tin kỹ thuật Figma, không có ý nghĩa khi test UI
- Chỉ ghi kích thước cho element có ý nghĩa: button, input, dropdown, icon, modal

**Expected Result — Mỗi giá trị PHẢI có label rõ ràng:**
- ❌ `128×36px, corner radius 4px` → thiếu label
- ✅ `Width: 128px. Height: 36px. Border radius: 4px.`
- Các label bắt buộc: `Font:`, `Font size:`, `Font weight:`, `Text color:`, `Background:`, `Width:`, `Height:`, `Border radius:`, `Border:`, `Padding:`, `Gap:`

**Mô tả vị trí — PHẢI dùng ngôn ngữ dễ hiểu:**
- ❌ "Xem nút bên phải tiêu đề" → không rõ tiêu đề nào
- ❌ "Xem link dưới khối form" → không rõ form nào
- ✅ "Xem nút 「面会枠の種類」 ở góc phải hàng tiêu đề 「病棟編集」"
- ✅ "Xem link 「病室を追加」 phía dưới danh sách phòng bệnh"
- Quy tắc: luôn kèm **tên tiếng Nhật** của element hoặc vùng chứa để người đọc xác định được vị trí chính xác trên giao diện

**Nếu Figma không cung cấp giá trị** cho 1 thuộc tính (vd: không có fills, không có cornerRadius) → bỏ qua thuộc tính đó, KHÔNG đoán giá trị.

**Format:**
- **Priority mặc định:** `M` (TC Typography = `L`)
- **Creator:** `AI`
- **Sub Features (cột C):** Phân nhóm theo vùng UI: `Title row`, `List header`, `List row`, `Form [tên form]`, `Dropdown`, `Bottom`, `Tooltip`, `Layout`, `Typography`. Nếu không xác định được → `-`
- **Features (cột B):** Lấy nguyên tên frame từ Figma
- **Ngôn ngữ:** Steps/Expected bằng tiếng Việt, giữ nguyên tên tiếng Nhật từ design
- **Test Steps:** Luôn bắt đầu bằng `1. Open màn hình [Tên frame]`
- **Expected Result:** Mỗi thuộc tính xuống dòng riêng, dễ đọc

### Bước 5 — Preview và xác nhận

**BẮT BUỘC** trước khi ghi vào Google Sheet:

1. Hiển thị tóm tắt scan:
   ```
   Frame: [Tên frame]
   Tổng element phát hiện: X
   - Title: N
   - Label: N
   - Button: N
   - Input: N
   - Dropdown: N
   - Table header: N
   - Table row: N
   - List: N
   - Tooltip: N
   - Icon: N
   - Khác: N
   + TC Spacing: 1
   + TC Typography: 1
   ```

2. Hiển thị preview bảng test cases trên chat (dạng markdown table)

3. Hỏi user: **"Xác nhận ghi N test cases vào Google Sheet chưa?"**

4. Chỉ ghi sau khi user đồng ý

### Bước 6 — Ghi vào Google Sheet

Thực hiện đúng theo quy trình trong `prompts/03-tc-scenario-sheet-template.md`:

1. **Tạo header** (nếu sheet mới hoặc chưa có header)
2. **Merge cells** F:I và J:M cho mỗi dòng TC
3. **Ghi data** cột A-O
4. **Báo cáo kết quả:** Tổng TC đã ghi, range dữ liệu

---

## Prompt gợi ý

### Cách dùng cơ bản
```
Scan frame đang chọn trong Figma và sinh UI test case.
Ghi vào Google Sheet:
- Spreadsheet ID: [SPREADSHEET_ID]
- Sheet: [SHEET_NAME]
```

### Chỉ preview (không ghi sheet)
```
Scan frame đang chọn trong Figma và sinh UI test case.
Chỉ hiển thị preview, chưa ghi vào sheet.
```

### Chỉ định thêm context
```
Scan frame đang chọn trong Figma và sinh UI test case.
Đây là màn hình [MÃ_MÀN_HÌNH] - [Mô tả ngắn].
Ghi vào Google Sheet: [SPREADSHEET_ID] / [SHEET_NAME]
```

---

## Tham chiếu

- **Parse & Filter Figma data: `prompts/01-parse-figma-frame-data.md`** ← BẮT BUỘC đọc
- Template TC_Scenario: `prompts/03-tc-scenario-sheet-template.md`
