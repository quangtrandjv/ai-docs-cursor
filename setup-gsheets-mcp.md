Hãy giúp tôi setup Google Sheets MCP cho Cursor sử dụng package `mcp-google-sheets` với OAuth2 authentication (credentials.json + token.json).

## Thông tin cần thiết trước khi bắt đầu

1. Tìm đường dẫn tuyệt đối của 2 file credentials OAuth2 mà Claude Code đang dùng:
   - `credentials.json` — thường nằm ở `~/.config/claude/` hoặc thư mục Claude Code config
   - `token.json` — thường nằm cùng chỗ với credentials.json
   
   Chạy lệnh này để tìm:
   ```bash
   # macOS/Linux
   find ~ -name "credentials.json" 2>/dev/null | grep -v node_modules
   find ~ -name "token.json" 2>/dev/null | grep -v node_modules
   
   # Windows (PowerShell)
   Get-ChildItem -Path $HOME -Recurse -Filter "credentials.json" -ErrorAction SilentlyContinue
   Get-ChildItem -Path $HOME -Recurse -Filter "token.json" -ErrorAction SilentlyContinue
   ```

2. Kiểm tra `uv` đã được cài chưa:
   ```bash
   uv --version
   ```
   Nếu chưa có thì cài:
   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # Windows (PowerShell)
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

## Yêu cầu thực hiện

Sau khi có đủ thông tin trên, hãy:

**Bước 1** — Mở file `~/.cursor/mcp.json` (tạo mới nếu chưa có) và thêm config sau:

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "uvx",
      "args": ["mcp-google-sheets"],
      "env": {
        "CREDENTIALS_PATH": "/THAY_BẰNG_PATH_THỰC_TẾ/credentials.json",
        "TOKEN_PATH": "/THAY_BẰNG_PATH_THỰC_TẾ/token.json"
      }
    }
  }
}
```

Thay `CREDENTIALS_PATH` và `TOKEN_PATH` bằng đường dẫn tuyệt đối tìm được ở trên.

**Bước 2** — Nếu `~/.cursor/mcp.json` đã có các MCP khác, hãy MERGE vào, không ghi đè — chỉ thêm block `"google-sheets": { ... }` vào trong `"mcpServers": { }` hiện có.

**Bước 3** — Kiểm tra lại file `mcp.json` sau khi sửa để đảm bảo JSON hợp lệ (không thiếu dấu phẩy, không sai ngoặc).

**Bước 4** — Hướng dẫn tôi restart Cursor MCP:
   - Vào `Cursor Settings` → `Tools & Integrations` → tìm `google-sheets` → click refresh
   - Hoặc restart toàn bộ Cursor

**Bước 5** — Sau khi restart, test kết nối bằng cách hỏi tôi:
   > "Hãy dùng Google Sheets MCP đọc thử spreadsheet tại URL: [tôi sẽ cung cấp URL]"

## Xử lý lỗi thường gặp

Nếu gặp lỗi `spawn uvx ENOENT`:
```json
"command": "/Users/TÊN_USER/.local/bin/uvx"
```
Tìm đường dẫn thực của uvx bằng: `which uvx`

Nếu gặp lỗi `token expired`:
- token.json đã hết hạn, cần chạy lại OAuth flow
- Xóa token.json cũ, chạy `uvx mcp-google-sheets` trong terminal để trigger browser login lại

Nếu `mcp.json` chưa tồn tại:
```bash
mkdir -p ~/.cursor && touch ~/.cursor/mcp.json
```
Rồi paste toàn bộ JSON config vào.
