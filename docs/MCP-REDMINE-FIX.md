# Sửa lỗi MCP Redmine (Error trong Settings → Tools & MCP)

## Nguyên nhân đã xác định

1. **Node 14 không tương thích:** Package Redmine MCP (`redmine-mcp-server` và `@onozaty/redmine-mcp-server`) cần **Node >= 18** (engine trong package.json). Máy đang dùng **Node 14.15.0**.
2. **Lỗi khi chạy server:** Khi chạy bằng Node 14 xuất hiện:
   ```text
   Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './v3' is not defined by "exports" in zod/package.json
   ```
   Do dependency (zod / zod-to-json-schema) không tương thích với Node 14.

Config hiện dùng **@onozaty/redmine-mcp-server** (cùng REDMINE_URL, REDMINE_API_KEY). Cần môi trường Node 18 để chạy ổn định.

---

## Cách 1: Dùng Node 18 (khuyến nghị)

1. Cài Node 18 (nếu dùng nvm):
   ```powershell
   nvm install 18
   nvm use 18
   ```
   Hoặc cài từ [nodejs.org](https://nodejs.org/) (bản LTS 18.x).

2. Đặt Node 18 làm mặc định, sau đó **tắt Cursor hoàn toàn rồi mở lại** (để Cursor dùng Node 18 khi spawn MCP).

3. Vào **Settings → Tools & MCP** → Redmine → Refresh. Nếu vẫn lỗi, xem log chi tiết bên cạnh server.

---

## Cách 2: Dùng Docker (không phụ thuộc Node trên máy)

Nếu đã cài Docker Desktop, có thể chạy Redmine MCP trong container (bên trong đã có Node phù hợp).

**Sửa `.cursor/mcp.json`** — thay block `redmine` bằng:

```json
"redmine": {
  "command": "docker",
  "args": [
    "run", "--rm", "-i",
    "-e", "REDMINE_URL=https://redmine.your-company.com/",
    "-e", "REDMINE_API_KEY=YOUR_REDMINE_API_KEY",
    "ghcr.io/onozaty/redmine-mcp-server:latest"
  ]
}
```

Lưu ý: Thay `REDMINE_URL` và `REDMINE_API_KEY` bằng giá trị thật của bạn (hoặc dùng biến môi trường hệ thống nếu muốn bảo mật hơn).

Sau khi sửa: **Restart Cursor** hoặc reload MCP trong Settings → Tools & MCP.

---

## Kiểm tra sau khi sửa

- Settings → Tools & MCP: Redmine không còn báo error.
- Trong Chat: thử *"Lấy thông tin task #[số task]"* từ Redmine.
