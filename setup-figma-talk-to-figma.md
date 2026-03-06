# Cursor Talk to Figma — Bạn chỉ cần 2 bước

Đã cấu hình xong trong project. **Bạn chỉ cần:**

1. **Chạy cầu nối (mỗi lần dùng Figma):** Mở terminal trong project → chạy `npm run figma-socket` → **giữ terminal mở**.
2. **Figma:** Mở **Figma Desktop** → mở file design → **Plugins** → **Cursor Talk to Figma MCP** (hoặc **Development** → plugin tương ứng) → nhập **channel** (vd: `default`) → **Join**.

Sau đó trong Cursor, bảo AI: **"Join channel default"** (hoặc đúng tên channel bạn vừa nhập). Xong — bạn có thể hỏi "lấy frame đang chọn", "đọc document info", v.v.

---

## Cài plugin Figma (chỉ 1 lần)

Plugin nằm **ngay trong project** — không cần clone repo hay cài từ Community:

1. Mở **Figma Desktop**.
2. **Plugins** → **Development** → **Import plugin from manifest…**
3. Chọn file:
   ```
   <project>\figma-plugin\manifest.json
   ```
   Ví dụ: `D:\Project\ai-docs-cursor\figma-plugin\manifest.json`
4. Plugin xuất hiện trong **Development** với tên **Cursor MCP Plugin**.

Dùng **Figma Desktop app**, không dùng Figma trên trình duyệt.

---

## Luồng mỗi phiên

| Bước | Việc bạn làm |
|------|------------------|
| 1 | Terminal: `npm run figma-socket` (giữ mở) |
| 2 | Mở Figma Desktop, mở file design |
| 3 | Plugins → Cursor Talk to Figma MCP → nhập channel (vd: `default`) → Join |
| 4 | Trong Cursor: "Join channel default" (hoặc tên channel bạn đặt) |
| 5 | Dùng lệnh: "Lấy frame đang chọn", "Đọc document info", v.v. |

---

## Lỗi thường gặp

- **"Not connected to Figma"** → Chưa chạy `npm run figma-socket` hoặc plugin chưa Join channel. Chạy socket, mở Figma, chạy plugin và Join.
- **"Must join a channel"** → Trong Cursor chưa join channel. Bảo AI: "Join channel [tên_bạn_nhập_trong_plugin]".

---

## Chi tiết kỹ thuật (nếu cần)

- WebSocket server do project tự chạy bằng **Node** (không cần Bun), port **3055**.
- Script: `scripts/figma-ws-server.js`; lệnh: `npm run figma-socket`.
- MCP Figma đã cấu trong `.cursor/mcp.json` và kết nối tới `localhost:3055`.
