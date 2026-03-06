# Xuất UI Spec từ Figma (frame đang chọn)

**Mục đích:** Tự động lấy text (JP), font, color, background, radius, shadow, spacing từ design và tạo UI spec / draft SRS — không cần click từng component trong Figma.

**Điều kiện:** Đã join channel Figma; trong Figma đang chọn **một frame** (màn hình) cần xuất spec.

---

## Prompt gợi ý

```
Từ frame đang chọn trên Figma, hãy:
1. Lấy toàn bộ thông tin design (get_selection → get_node_info hoặc read_my_design cho frame đó).
2. Trích xuất và tổng hợp:
   - Text tiếng Nhật (và label/placeholder) theo từng component/vị trí
   - Font: size, weight, font name
   - Màu: chữ (fills của TEXT), background (fills của frame/component)
   - Border/stroke: màu, độ dày
   - Corner radius
   - Shadow (effects: DROP_SHADOW, INNER_SHADOW) nếu có
   - Spacing/layout: padding (từ auto-layout nếu có), kích thước (absoluteBoundingBox)
   - Cấu trúc: tên component, type (FRAME, TEXT, INSTANCE...)
3. Xuất ra UI Spec dạng Markdown:
   - Bảng: # | Tên node / Vị trí | Text (JP) | Font | Màu chữ | Background | Radius | Padding/Spacing
   - Phần tóm tắt: kích thước màn, background chung
4. Lưu vào file trong project (ví dụ: output/ui-spec-[tên-frame].md) hoặc trả ngay trong chat.
```

---

## Biến thể

- **Chỉ text JP:** "Chỉ trích xuất tất cả text tiếng Nhật trong frame đang chọn, kèm tên node/path, xuất bảng."
- **Chỉ spacing/layout:** "Trích xuất padding, margin (từ bounds), itemSpacing của frame đang chọn và các container con, xuất bảng."
- **Draft SRS:** "Từ frame đang chọn, tạo draft SRS ngắn: tên màn, danh sách thành phần UI (text JP, loại control), ghi chú font/color chính."

---

## Tham chiếu

- Pain points & ý tưởng: `docs/pain-points-and-idea-ui-spec-from-figma.md`
- Figma MCP tools: get_selection, get_node_info, read_my_design, scan_text_nodes (cho frame lớn có thể dùng chunk).
