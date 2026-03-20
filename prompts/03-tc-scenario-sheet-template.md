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
| C (Sub Features) | Tên tính năng con, **dùng tên tiếng Nhật** để phân biệt section (vd: `Form 病棟`, `Form 面会枠`, `Title row`, `List header`). Nếu không xác định được → ghi `-` |
| D (Test Case Title) | Tiêu đề ngắn gọn. Giữ nguyên tên tiếng Nhật nếu lấy từ design (vd: `Check nhãn 病棟名※`) |
| E (Preconditions) | **Luôn ghi** ít nhất `Mở MH [tên màn hình JP]`. Nếu TC yêu cầu trạng thái đặc biệt (dropdown mở, có dữ liệu) → ghi rõ. Để trống CHỈ KHI không cần bất kỳ setup nào |
| F–I (Test Steps) | **Merge 4 cột F:I** trước, rồi ghi numbered list vào ô merged. Luôn bắt đầu: `1. Mở màn hình [Mã module] ([Tên JP])` |
| J–M (Expected Result) | **Merge 4 cột J:M** trước, rồi ghi giá trị cụ thể (font, size, color, width, height...). KHÔNG ghi "đúng design" |
| N (Priority) | UI Test Case: mặc định `H`. Layout/Spacing: `M`. Typography tổng hợp: `L` |
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

### Bước 1.5: Tính phạm vi row chính xác

**BẮT BUỘC** tính trước khi thực hiện bất kỳ thao tác merge/border/resize nào:

```
FIRST_DATA_ROW = 10                          (cố định — header chiếm Row 1–9)
LAST_DATA_ROW  = FIRST_DATA_ROW + TC_COUNT - 1   (vd: 20 TC → row 29)
LAST_ROW_INDEX = LAST_DATA_ROW - 1               (0-based, vd: row 29 → index 28)
END_ROW_INDEX  = LAST_ROW_INDEX + 1               (exclusive, vd: 29)
```

**Ví dụ:** 20 TC → data từ Row 10 đến Row 29 → `startRowIndex: 9`, `endRowIndex: 29`
**Ví dụ:** 23 TC → data từ Row 10 đến Row 32 → `startRowIndex: 9`, `endRowIndex: 32`

**KHÔNG ĐƯỢC:**
- Dùng giá trị cố định lớn (vd: endRowIndex = 120, 200, 321)
- Tạo merge/border/resize cho row không có data
- Áp dụng format vượt quá `LAST_DATA_ROW`

Mọi thao tác merge, border, resize ở các bước sau đều phải dùng `END_ROW_INDEX` đã tính ở đây.

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
> **Chỉ tạo merge cho row có data:** vòng lặp từ `FIRST_DATA_ROW - 1` (= 9) đến `LAST_ROW_INDEX` (= 8 + TC_COUNT). KHÔNG merge row trống.

### Bước 3: Ghi nội dung test cases

Sử dụng `mcp__google-sheets__batch_update_cells` hoặc `mcp__google-sheets__update_cells` để ghi data vào các cột A–O.

- Cột A: ghi formula `=row()-9`
- Cột F: ghi nội dung Test Steps (ô đã merged F:I)
- Cột J: ghi nội dung Expected Result (ô đã merged J:M)

### Bước 3.5: Format rows sau khi ghi

Gọi `mcp__google-sheets__batch_update` **1 lần duy nhất** với tất cả requests gộp chung.

Thay `<SHEET_ID>` và `<END>` (= `END_ROW_INDEX` tính ở Bước 1.5) rồi gửi:

```json
[
  // --- MERGE (cho mỗi row i từ 9 đến END-1) ---
  {"mergeCells":{"range":{"sheetId":"<SHEET_ID>","startRowIndex":i,"endRowIndex":i+1,"startColumnIndex":5,"endColumnIndex":9},"mergeType":"MERGE_ALL"}},
  {"mergeCells":{"range":{"sheetId":"<SHEET_ID>","startRowIndex":i,"endRowIndex":i+1,"startColumnIndex":9,"endColumnIndex":13},"mergeType":"MERGE_ALL"}},
  // --- BORDER (4 requests, sau tất cả merge) ---
  {"updateBorders":{"range":{"sheetId":"<SHEET_ID>","startRowIndex":9,"endRowIndex":"<END>","startColumnIndex":0,"endColumnIndex":5},"top":{"style":"DOTTED","width":1,"color":{}},"bottom":{"style":"DOTTED","width":1,"color":{}},"left":{"style":"DOTTED","width":1,"color":{}},"right":{"style":"DOTTED","width":1,"color":{}},"innerHorizontal":{"style":"DOTTED","width":1,"color":{}},"innerVertical":{"style":"DOTTED","width":1,"color":{}}}},
  {"updateBorders":{"range":{"sheetId":"<SHEET_ID>","startRowIndex":9,"endRowIndex":"<END>","startColumnIndex":5,"endColumnIndex":9},"top":{"style":"DOTTED","width":1,"color":{}},"bottom":{"style":"DOTTED","width":1,"color":{}},"left":{"style":"DOTTED","width":1,"color":{}},"right":{"style":"DOTTED","width":1,"color":{}},"innerHorizontal":{"style":"DOTTED","width":1,"color":{}}}},
  {"updateBorders":{"range":{"sheetId":"<SHEET_ID>","startRowIndex":9,"endRowIndex":"<END>","startColumnIndex":9,"endColumnIndex":13},"top":{"style":"DOTTED","width":1,"color":{}},"bottom":{"style":"DOTTED","width":1,"color":{}},"left":{"style":"DOTTED","width":1,"color":{}},"right":{"style":"DOTTED","width":1,"color":{}},"innerHorizontal":{"style":"DOTTED","width":1,"color":{}}}},
  {"updateBorders":{"range":{"sheetId":"<SHEET_ID>","startRowIndex":9,"endRowIndex":"<END>","startColumnIndex":13,"endColumnIndex":27},"top":{"style":"DOTTED","width":1,"color":{}},"bottom":{"style":"DOTTED","width":1,"color":{}},"left":{"style":"DOTTED","width":1,"color":{}},"right":{"style":"DOTTED","width":1,"color":{}},"innerHorizontal":{"style":"DOTTED","width":1,"color":{}},"innerVertical":{"style":"DOTTED","width":1,"color":{}}}},
  // --- WRAP + RESIZE (sau border) ---
  {"repeatCell":{"range":{"sheetId":"<SHEET_ID>","startRowIndex":9,"endRowIndex":"<END>","startColumnIndex":0,"endColumnIndex":27},"cell":{"userEnteredFormat":{"wrapStrategy":"WRAP","verticalAlignment":"TOP"}},"fields":"userEnteredFormat.wrapStrategy,userEnteredFormat.verticalAlignment"}},
  {"autoResizeDimensions":{"dimensions":{"sheetId":"<SHEET_ID>","dimension":"ROWS","startIndex":9,"endIndex":"<END>"}}}
]
```

Thứ tự trong array: merge → border → wrap → resize. Gửi **1 lần gọi `batch_update`**.

**B2. Auto-resize row height** — đã bao gồm trong template trên (`autoResizeDimensions` là request cuối cùng).

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
  B: SM000?
  C: Title row
  D: Check tiêu đề trang
  E: Mở MH 病棟編集
  F (merged F:I): 1. Mở màn hình SM000? (病棟編集)\n2. Xem tiêu đề trang
  J (merged J:M): Tiêu đề hiển thị 「病棟編集」, cùng hàng với nút BACK (trái) và nút 面会枠の種類 (phải).\nFont Noto Sans JP Regular, font size 28px.
  N: H
  O: AI

Row 11:
  A: =row()-9          → hiển thị: 2
  B: SM000?
  C: Form 病棟
  D: Check nhãn 病棟名※
  E: Mở MH 病棟編集
  F (merged F:I): 1. Mở màn hình SM000? (病棟編集)\n2. Xem form 病棟
  J (merged J:M): Nhãn 「病棟名※」 hiển thị.\nFont Noto Sans CJK JP Bold, font size 14px.
  N: H
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
