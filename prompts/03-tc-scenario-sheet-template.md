# Sinh Test Case Scenario và ghi vào Google Sheet

## Mục đích

Hướng dẫn AI sinh test case từ thông tin Figma scan và ghi vào Google Sheet theo đúng template **TC_Scenario**.

## Điều kiện

- Đã có thông tin màn hình (từ Figma scan)
- Đã có Spreadsheet ID và tên sheet đích
- Google Sheets MCP đã kết nối

---

## Template TC_Scenario — Cấu trúc chi tiết

### Vùng Header (Row 1–7)

Vùng metadata và thống kê tự động. AI cần tạo lại khi tạo sheet mới.

| Row | Cột A | Cột B (Label) | Cột C (Giá trị) | Nguồn giá trị | Cột F (Label) | Cột G-I (Formulas) |
|-----|-------|----------------|------------------|----------------|----------------|---------------------|
| 1 | `Scenario` | `システム名` | Tên hệ thống | User cung cấp, hoặc lấy từ tên spreadsheet | | `Fruit` / `Dev` / `Stg` |
| 2 | | `モジュールコード` | Mã module | **Lấy từ tên sheet đích** (vd: sheet `SM0012` → `SM0012`) | `Pass` | COUNTIF Pass theo môi trường |
| 3 | | `担当者` | Tên người phụ trách | `AI` (vì AI tạo TC) | `Fail` | COUNTIF Fail theo môi trường |
| 4 | | `画面` | Mã màn hình | **Lấy từ tên sheet đích** (giống モジュールコード) | `Skip` | COUNTIF Skip theo môi trường |

**Quy tắc điền cột C (Row 1-4):**
- **KHÔNG copy giá trị từ template gốc hoặc sheet khác**
- Row 1 (システム名): Hỏi user nếu chưa biết. Nếu user không cung cấp → lấy từ tên spreadsheet
- Row 2 (モジュールコード): Lấy từ tên sheet đích. Ví dụ: sheet tên `SM0012` → ghi `SM0012`
- Row 3 (担当者): Luôn ghi `AI`
- Row 4 (画面): Giống giá trị Row 2 (モジュールコード)
| 5 | | | | `Not Run Yet` | Tổng chưa chạy theo môi trường |
| 6 | | | | `Number of case on` | Tổng case cần test theo môi trường |
| 7 | | | | | Ghi chú: `※All Testcase` / `※Priority Normal + High` / `※Priority High` |

**Formulas thống kê (Row 2–6, Cột G-I):**

```
# Row 2 — Pass
G2: =COUNTIF(Q$10:Q$321,"Pass")
H2: =COUNTIF(T$10:T$321,"Pass")
I2: =COUNTIF(W$10:W$321,"Pass")

# Row 3 — Fail
G3: =COUNTIF(Q$10:Q$321,"Fail")
H3: =COUNTIF(T$10:T$321,"Fail")
I3: =COUNTIF(W$10:W$321,"Fail")

# Row 4 — Skip
G4: =COUNTIF(Q$10:Q$321,"Skip")
H4: =COUNTIF(T$10:T$321,"Skip")
I4: =COUNTIF(W$10:W$321,"Skip")

# Row 5 — Not Run Yet
G5: =SUM(G6-G2-G3-G4)
H5: =COUNTIFS($N$10:$N$321,"H",$T10:$T321,"")+COUNTIFS($N$10:$N$321,"M",$T10:$T321,"")
I5: =COUNTIFS($N$10:$N$321,"H",$W10:$W321,"")

# Row 6 — Number of case on
G6: =COUNTA($N$10:$N$321)
H6: =SUM(COUNTIF($N$10:$N$321,"H")+COUNTIF($N$10:$N$321,"M"))
I6: =COUNTIF($N$10:$N$321,"H")
```

**Ghi chú Row 4–6, Cột J:**

```
J4: ※Testcase bỏ qua không test
J5: ※Testcase chưa được chạy trên từng môi trường
J6: ※Testcase cần phải test trên từng môi trường
```

**Ghi chú Row 7:**

```
G7: ※All Testcase
H7: ※Priority \nNormal + High
I7: ※Priority High
```

**Ý nghĩa 3 môi trường:**
- **Fruit (cột G):** Test ALL testcase (mọi priority)
- **Dev (cột H):** Chỉ test Priority H + M
- **Stg (cột I):** Chỉ test Priority H

### Row 8 — Sub-header môi trường

Nhóm cột kết quả test theo môi trường:

```
Q-T:  Fruit, Fruit, Fruit, Fruit
U-V:  Dev, Dev
W-Y:  Stg, Stg, Stg
```

### Row 9 — Column Headers

| Cột | Header | Ghi chú |
|-----|--------|---------|
| A | `No.` | |
| B | `機能名\nFeatures` | |
| C | `サブ機能名\nSub Features` | |
| D | `テストケースタイトル\nTest Case Title` | |
| E | `準備\nPreconditions` | |
| F–I | `ステップ\nTest Steps` | **Merged 4 cột** |
| J–M | `期待結果\nExpected Result` | **Merged 4 cột** |
| N | `優先度\nPriority` | |
| O | `Creator` | |
| P | `Self Test` | |
| Q | `Fruit` | Kết quả test |
| R | `テスト日\nTest Date` | Ngày test Fruit |
| S | `担当者\nPIC` | Người test Fruit |
| T | `Dev` | Kết quả test |
| U | `テスト日\nTest Date` | Ngày test Dev |
| V | `担当者\nPIC` | Người test Dev |
| W | `Stg` | Kết quả test |
| X | `テスト日\nTest Date` | Ngày test Stg |
| Y | `担当者\nPIC` | Người test Stg |
| Z | `不具合\nTicket BUG` | |
| AA | `備考\nGhi chú` | |

---

## Quy tắc sinh Test Case (Row 10 trở đi)

### Phạm vi AI điền: Cột A → O

| Cột | Quy tắc |
|-----|---------|
| A (No.) | Formula: `=row()-9` |
| B (Features) | Tên frame từ Figma (vd: `AT0022`) |
| C (Sub Features) | Tên tính năng con (vd: `Filter`, `CRUD`). Nếu không có → ghi `-` |
| D (Test Case Title) | Tiêu đề ngắn gọn. Giữ nguyên tên tiếng Nhật nếu lấy từ design (vd: `所属を選択`) |
| E (Preconditions) | Điều kiện cần có trước khi test. Để trống nếu không có |
| F–I (Test Steps) | **Merge 4 cột F:I** trước, rồi ghi numbered list vào ô merged. Luôn dùng format: `1. xxx\n2. xxx\n3. xxx` |
| J–M (Expected Result) | **Merge 4 cột J:M** trước, rồi ghi numbered list tương ứng với số bước Test Steps |
| N (Priority) | Mặc định: `M`. Tester sẽ xác nhận lại sau |
| O (Creator) | Luôn ghi: `AI` |

### Cột P trở đi — AI KHÔNG điền

Các cột Self Test, kết quả test (Fruit/Dev/Stg), Test Date, PIC, Ticket BUG, Ghi chú — do tester tự điền trong quá trình test.

### Ngôn ngữ nội dung

- **Test Steps, Expected Result, Preconditions:** Viết bằng **tiếng Việt**
- **Tên giao diện, label, button** lấy từ design: Giữ nguyên **tiếng Nhật** để người đọc dễ xác định vị trí trên giao diện
- Ví dụ: `1. Open màn hình AT0022\n2. Dropdown list 所属を選択: chọn filter All\n3. Check kết quả filter`

### Phân loại Test Case

Mỗi feature/spec nên sinh tối thiểu các loại:
- **Happy path:** Luồng chính hoạt động đúng
- **Negative:** Nhập sai, thiếu dữ liệu, thao tác không hợp lệ
- **Validation:** Kiểm tra validate input, error message

Thêm nếu phù hợp: Boundary, UI/UX, Permission.

---

## Quy trình ghi vào Google Sheet

### Bước 1: Tạo header (nếu sheet mới)

Sử dụng `mcp__google-sheets__batch_update_cells` để ghi:
- Row 1–7: Metadata + formulas thống kê
- Row 8: Sub-header môi trường
- Row 9: Column headers

Sau đó merge cells cho row 9: F9:I9 (Test Steps header) và J9:M9 (Expected Result header).

### Bước 2: Merge cells cho data rows

Với mỗi dòng test case (row N), dùng `mcp__google-sheets__batch_update` để merge:

```json
{
  "mergeCells": {
    "range": {
      "sheetId": <SHEET_ID>,
      "startRowIndex": <ROW_INDEX_0_BASED>,
      "endRowIndex": <ROW_INDEX_0_BASED + 1>,
      "startColumnIndex": 5,
      "endColumnIndex": 9
    },
    "mergeType": "MERGE_ALL"
  }
}
```

```json
{
  "mergeCells": {
    "range": {
      "sheetId": <SHEET_ID>,
      "startRowIndex": <ROW_INDEX_0_BASED>,
      "endRowIndex": <ROW_INDEX_0_BASED + 1>,
      "startColumnIndex": 9,
      "endColumnIndex": 13
    },
    "mergeType": "MERGE_ALL"
  }
}
```

> **Lưu ý:** `startRowIndex` dùng 0-based (Row 10 trong Sheet = index 9).
> Cột F=5, I=8 → endColumnIndex=9. Cột J=9, M=12 → endColumnIndex=13.

### Bước 3: Ghi nội dung test cases

Sử dụng `mcp__google-sheets__batch_update_cells` hoặc `mcp__google-sheets__update_cells` để ghi data vào các cột A–O.

- Cột A: ghi formula `=row()-9`
- Cột F: ghi nội dung Test Steps (ô đã merged F:I)
- Cột J: ghi nội dung Expected Result (ô đã merged J:M)

### Bước 3.5: Format rows sau khi ghi

Sau khi ghi data xong, dùng `mcp__google-sheets__batch_update` để format:

**A. Border cho tất cả data rows:**

Áp dụng border cho toàn bộ vùng data (từ Row 10 đến row cuối cùng có data, cột A-AA):

```json
{
  "updateBorders": {
    "range": {
      "sheetId": "<SHEET_ID>",
      "startRowIndex": 9,
      "endRowIndex": "<LAST_ROW_INDEX_0_BASED + 1>",
      "startColumnIndex": 0,
      "endColumnIndex": 27
    },
    "top": { "style": "SOLID", "width": 1, "color": {"red": 0.8, "green": 0.8, "blue": 0.8} },
    "bottom": { "style": "SOLID", "width": 1, "color": {"red": 0.8, "green": 0.8, "blue": 0.8} },
    "left": { "style": "SOLID", "width": 1, "color": {"red": 0.8, "green": 0.8, "blue": 0.8} },
    "right": { "style": "SOLID", "width": 1, "color": {"red": 0.8, "green": 0.8, "blue": 0.8} },
    "innerHorizontal": { "style": "SOLID", "width": 1, "color": {"red": 0.8, "green": 0.8, "blue": 0.8} },
    "innerVertical": { "style": "SOLID", "width": 1, "color": {"red": 0.8, "green": 0.8, "blue": 0.8} }
  }
}
```

**B. Chiều cao row tự động theo nội dung:**

Cho mỗi data row, set chiều cao tự động (auto-fit) để nội dung hiển thị đầy đủ không bị che khuất và không thừa khoảng trắng:

```json
{
  "updateDimensionProperties": {
    "range": {
      "sheetId": "<SHEET_ID>",
      "dimension": "ROWS",
      "startIndex": 9,
      "endIndex": "<LAST_ROW_INDEX_0_BASED + 1>"
    },
    "properties": {
      "pixelSize": 0
    },
    "fields": "pixelSize"
  }
}
```

Sau đó gọi `autoResizeDimensions` để tự co giãn theo nội dung:

```json
{
  "autoResizeDimensions": {
    "dimensions": {
      "sheetId": "<SHEET_ID>",
      "dimension": "ROWS",
      "startIndex": 9,
      "endIndex": "<LAST_ROW_INDEX_0_BASED + 1>"
    }
  }
}
```

> **Lưu ý:** Gộp tất cả requests (merge + border + resize) vào 1 lần gọi `batch_update` để tối ưu.

### Bước 4: Preview và xác nhận

**BẮT BUỘC** trước khi ghi:
1. Hiển thị preview dạng bảng trên chat
2. Hỏi user: "Xác nhận ghi vào Sheet chưa?"
3. Chỉ ghi sau khi user đồng ý

---

## Ví dụ dữ liệu test case

```
Row 10:
  A: =row()-9          → hiển thị: 1
  B: AT0022
  C: -
  D: Check giao diện
  E: (trống)
  F (merged F:I): 1. Open màn hình AT0022\n2. Click A\n3. ....
  J (merged J:M): Giống với design
  N: M
  O: AI

Row 11:
  A: =row()-9          → hiển thị: 2
  B: AT0022
  C: Filter
  D: 所属を選択
  E: (trống)
  F (merged F:I): 1. Open AT0022\n2. Dropdown list 所属を選択: filter All\n3. Check kết quả filter
  J (merged J:M): 3. Kết quả filter: hiển thị toàn bộ record của hệ thống
  N: M
  O: AI
```

---

## Prompt gợi ý

```
Sinh test case cho màn hình [MÃ_MÀN_HÌNH] và ghi vào Google Sheet:
- Spreadsheet ID: [SPREADSHEET_ID]
- Sheet: [SHEET_NAME]
- Thông tin màn hình: [từ Figma scan]
- Hiển thị preview trước khi ghi
```

## Tham chiếu

- Template gốc: `https://docs.google.com/spreadsheets/d/19uzpDY4hvBdwTwA334hqqBIh34GgIHgDpNSKDZVAPd8/edit?gid=804643631`
