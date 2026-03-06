# Fix Google Sheets MCP (mcp-gsheets)

**mcp-gsheets** chỉ hỗ trợ **Service Account**, không dùng OAuth (`credentials.json` + `token.json` kiểu client secret).

## Cách 1: File của bạn đã là Service Account key

Nếu file credentials của bạn (ví dụ `C:\path\to\your\credentials.json`) là **file JSON key của Service Account** (trong file có `"type": "service_account"` và có `project_id`, `private_key`, `client_email`):

1. Mở `.cursor/mcp.json`.
2. Đặt `GOOGLE_PROJECT_ID` = **project ID** (lấy từ Google Cloud Console hoặc từ trong file JSON, trường `project_id`).
3. Reload MCP trong Cursor (hoặc restart Cursor).
4. **Share từng Google Sheet** cần dùng với email Service Account (trường `client_email` trong JSON, dạng `xxx@yyy.iam.gserviceaccount.com`) với quyền **Editor**.

## Cách 2: Bạn đang dùng OAuth (credentials.json + token.json)

Nếu file `credentials.json` của bạn là **OAuth client secret** (có `client_id`, `client_secret`, `redirect_uris`), mcp-gsheets **không dùng** được. Làm theo bước sau:

### Bước 1: Tạo Service Account trên Google Cloud

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → chọn project (hoặc tạo mới).
2. **APIs & Services** → **Library** → bật **Google Sheets API** (và **Google Drive API** nếu cần).
3. **APIs & Services** → **Credentials** → **Create credentials** → **Service account**.
4. Đặt tên → **Create and Continue** → (có thể bỏ qua role) → **Done**.
5. Vào Service account vừa tạo → tab **Keys** → **Add key** → **Create new key** → chọn **JSON** → **Create** (file JSON sẽ tải về).

### Bước 2: Lưu key và cấu hình MCP

1. Đặt file JSON vừa tải vào thư mục an toàn, ví dụ:  
   `C:\path\to\your\service-account-sheets.json`
2. Mở `.cursor/mcp.json`, sửa phần `google-sheets`:

```json
"google-sheets": {
  "command": "npx",
  "args": ["-y", "mcp-gsheets@latest"],
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "C:\\path\\to\\your\\service-account-sheets.json",
    "GOOGLE_PROJECT_ID": "YOUR_GOOGLE_PROJECT_ID"
  }
}
```

- `GOOGLE_PROJECT_ID`: lấy từ Google Cloud Console (tên project) hoặc từ trong file JSON (trường `project_id`).

### Bước 3: Share Sheet với Service Account

- Mở từng Google Sheet cần đọc/ghi → **Share** → thêm email Service Account (trường `client_email` trong file JSON, dạng `...@....iam.gserviceaccount.com`) với quyền **Editor**.

Sau đó reload MCP hoặc restart Cursor và thử lại.

## Kiểm tra nhanh

- Trong Cursor Chat, thử: *"Đọc sheet [URL một Google Sheet đã share cho service account]"*.
- Nếu vẫn lỗi: xem Cursor **Settings** → **MCP** → click vào server **google-sheets** để xem log lỗi (thiếu project ID, sai đường dẫn file, hoặc chưa share Sheet).
