# Init Project Setup

Thực hiện setup project tự động. Chạy tuần tự từng bước, không bỏ qua bước nào.

## Bước 1 — Kiểm tra Node.js

Chạy `node -v` để kiểm tra version.

- Nếu >= 18 → thông báo OK, tiếp bước 2
- Nếu < 18 hoặc không có → thông báo: "Cần cài Node.js 18+: https://nodejs.org/" → DỪNG

## Bước 2 — Install dependencies

Chạy `npm install`.

- Nếu thành công → tiếp bước 3
- Nếu lỗi → hiển thị lỗi, đề xuất cách fix → DỪNG

## Bước 3 — Tạo file config MCP

Kiểm tra file `.cursor/mcp.json` đã tồn tại chưa:

- **Nếu đã có** → thông báo: "File .cursor/mcp.json đã tồn tại, giữ nguyên config hiện tại." → tiếp bước 4
- **Nếu chưa có** → copy file `mcp-config/mcp.json.example` thành `.cursor/mcp.json` → tiếp bước 4

## Bước 4 — Kiểm tra Figma plugin

Kiểm tra thư mục `figma-plugin/manifest.json` tồn tại:

- Nếu có → thông báo: "Figma plugin sẵn sàng."
- Nếu không → cảnh báo: "Không tìm thấy Figma plugin."

## Bước 5 — Tóm tắt kết quả

Hiển thị bảng tóm tắt:

```
✅ Setup hoàn tất!

| Bước | Trạng thái |
|------|-----------|
| Node.js | v[VERSION] ✓ |
| npm install | ✓ |
| .cursor/mcp.json | [Tạo mới / Đã có sẵn] |
| Figma plugin | [Sẵn sàng / Cần kiểm tra] |
```

## Bước 6 — Yêu cầu điền credentials

Sau khi tóm tắt xong, hỏi user:

```
Để hoàn tất setup, bạn cần điền thông tin Google Sheets:

1. GOOGLE_PROJECT_ID — ID project trên Google Cloud Console
2. GOOGLE_APPLICATION_CREDENTIALS — Đường dẫn tuyệt đối đến file JSON key của Service Account

Bạn có muốn điền ngay bây giờ không?
- Nếu có → nhập lần lượt từng giá trị
- Nếu chưa → bạn có thể tự sửa file .cursor/mcp.json sau
```

**Nếu user cung cấp giá trị:**
- Đọc file `.cursor/mcp.json`
- Thay thế `YOUR_GOOGLE_CLOUD_PROJECT_ID` bằng giá trị user nhập
- Thay thế `C:\\path\\to\\your\\service-account-key.json` bằng đường dẫn user nhập
- Ghi lại file
- Nhắc: "Đã cập nhật. Hãy share Google Sheet với email service account (quyền Editor)."

**Nếu user bỏ qua:**
- Nhắc: "OK. Khi cần, sửa file .cursor/mcp.json và điền GOOGLE_PROJECT_ID + GOOGLE_APPLICATION_CREDENTIALS."

## Bước 7 — Hướng dẫn sử dụng

Kết thúc bằng:

```
🚀 Cách sử dụng:

1. Chạy WebSocket server: npm run figma-socket
2. Mở Figma Desktop → chạy plugin (import từ figma-plugin/manifest.json)
3. Chọn 1 frame trong Figma
4. Quay lại Cursor Chat, gõ:

   Scan frame đang chọn trong Figma và sinh UI test case.
   Ghi vào Google Sheet:
   - Spreadsheet ID: [ID]
   - Sheet: [TÊN_SHEET]
```
