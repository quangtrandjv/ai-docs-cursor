# Pain points & Ý tưởng: Tự động hóa UI Spec từ Figma

Tài liệu ghi lại yêu cầu từ BA/Tester và hướng giải quyết bằng Cursor + Figma MCP.

---

## ◆ Pain points (BA/Tester)

Những thứ Tester / Dev / BA đang mất thời gian:

| Vấn đề | Mô tả |
|--------|--------|
| **Text tiếng Nhật rải rác** | Text JP nằm trong từng component, khó thu thập đầy đủ cho spec/ test case. |
| **Spec UI chi tiết** | Font, color, background, radius, shadow… phải ghi từng mục trong spec. |
| **Spacing / layout** | Padding, margin… cần ghi chính xác để dev implement. |
| **Quy trình thủ công** | Click từng layout → nhìn panel Figma → copy/paste → **dễ sai, tốn thời gian**. |

---

## ◆ Idea (Mục tiêu)

- **Tự động lấy thông tin từ design:** text JP, font, color, spacing, component… và tạo **UI spec** hoặc **draft SRS**.
- **Mục tiêu:** BA, Dev, Tester **xem và xuất thông tin màn hình nhanh**, không cần click từng component trong Figma → **giảm thời gian và tránh sai sót**.

---

## ◆ Giải pháp đề xuất: Auto UI Spec từ Figma (Cursor + Figma MCP)

### Nguyên tắc

- Dùng **Figma MCP** (Talk to Figma) để đọc design **theo chương trình** (không click từng node).
- User chỉ cần **chọn frame/màn hình** trong Figma → trong Cursor gọi prompt → AI dùng MCP để lấy dữ liệu và **sinh UI spec / draft SRS**.

### Dữ liệu có thể trích xuất từ Figma (qua MCP)

| Nội dung | Cách lấy (MCP) | Ghi chú |
|----------|----------------|---------|
| **Text (JP, label, placeholder)** | `scan_text_nodes`, `get_node_info`, `read_my_design` | Lấy `characters` + node name/path để biết vị trí. |
| **Font** | Trong `get_node_info` / `read_my_design`: `style.fontSize`, `style.fontWeight`, `style.fontName` | Size, weight, font family. |
| **Màu chữ** | `fills` của node TEXT (color, opacity). | Hex/RGB cho spec. |
| **Background / fill** | `fills` của frame/rectangle/component. | Màu nền, gradient (nếu có). |
| **Border / stroke** | `strokes`, `strokeWeight` | Màu viền, độ dày. |
| **Radius** | `cornerRadius` | Bo góc. |
| **Shadow** | `effects` (DROP_SHADOW, INNER_SHADOW) | Blur, offset, color. |
| **Spacing / layout** | `absoluteBoundingBox`, `paddingLeft/Right/Top/Bottom`, `itemSpacing` (auto-layout) | Kích thước, padding, margin (suy ra từ bounds + padding). |
| **Component / structure** | `type` (FRAME, COMPONENT, INSTANCE, TEXT…), `name`, cây `children` | Cấu trúc màn hình, component dùng lại. |

### Luồng đề xuất

1. **Chuẩn bị:** Figma Desktop mở file, plugin Talk to Figma đã kết nối, Cursor đã join channel.
2. **Chọn:** User chọn **một frame** (màn hình) cần xuất UI spec.
3. **Gọi Cursor:** User nhập prompt kiểu: *“Tạo UI spec từ frame đang chọn: text JP, font, color, spacing, component”* hoặc dùng prompt có sẵn (xem `prompts/`).
4. **AI + MCP:**  
   - `get_selection` → lấy ID frame.  
   - `get_node_info(frameId)` hoặc `read_my_design` (sau khi set selection) → cây node.  
   - (Tùy chọn) `scan_text_nodes(frameId)` → tập trung text JP.  
   - Parse dữ liệu: text, style, fill, effect, layout.
5. **Output:**  
   - **UI Spec** (Markdown hoặc Google Sheet): từng section theo màn/component, bảng: Item, Text (JP), Font, Color, Background, Radius, Shadow, Padding/Margin.  
   - Hoặc **draft SRS**: cấu trúc màn hình + đặc tả UI ngắn gọn.

### Output mẫu (UI Spec từ 1 frame)

```markdown
# UI Spec: [Tên frame]

## Tổng quan
- Kích thước: 375×812
- Background: #FFFFFF

## Components / Text

| # | Tên node / Vị trí | Text (JP) | Font | Màu chữ | Background | Radius | Padding/Margin |
|---|-------------------|-----------|------|---------|------------|--------|----------------|
| 1 | Header/Title      | 患者の情報を入力 | 16px Bold | #333333 | —         | —      | 16 16 8 16     |
| 2 | Button Primary    | 確認画面へ     | 14px Medium | #FFFFFF | #18A0FB | 8px    | 12 24          |
...
```

---

## ◆ Cách dùng trong project này

1. **Prompt có sẵn:** Dùng prompt trong **`prompts/08-export-ui-spec-from-figma.md`**.
2. **Quy ước:** Chọn **đúng 1 frame** (màn hình) trước khi gọi; nếu chọn nhiều frame có thể bảo “chỉ frame đầu tiên” hoặc “từng frame một”.
3. **Xuất ra đâu:** Có thể bảo AI “ghi ra file Markdown” trong project hoặc “điền vào Google Sheet” (nếu dùng Google Sheets MCP).

---

## ◆ Hạn chế hiện tại

- **Figma MCP:** Một số thuộc tính (ví dụ margin tách bạch) có thể phải suy ra từ bounds + padding.
- **Khối lượng:** Frame rất nhiều node có thể cần chunk (ví dụ `scan_text_nodes` với tham số) để tránh timeout.
- **Ngôn ngữ:** Text lấy được là raw từ Figma; cần quy ước tên layer (JP/VI) để dễ map sang spec.

---

## ◆ Tóm tắt

| Pain point | Hướng xử lý |
|------------|-------------|
| Text JP rải rác | Trích xuất tập trung bằng `scan_text_nodes` / `get_node_info`. |
| Spec UI (font, color, radius, shadow…) | Lấy từ node `style`, `fills`, `effects`, `cornerRadius` qua MCP. |
| Spacing / layout | Lấy từ `absoluteBoundingBox`, padding, itemSpacing (auto-layout). |
| Click từng component → copy/paste | Chỉ cần chọn 1 frame → chạy prompt → nhận UI spec / draft SRS tự động. |

Mục tiêu: **BA, Dev, Tester xem và xuất thông tin màn hình nhanh, không cần click từng component trong Figma, giảm thời gian và sai sót.**
