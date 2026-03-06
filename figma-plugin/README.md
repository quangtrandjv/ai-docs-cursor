# Plugin Figma — Cursor Talk to Figma MCP

Plugin Figma nằm ngay trong project (bản từ [cursor-talk-to-figma-mcp](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp)).

## Import vào Figma (chỉ 1 lần)

1. Mở **Figma Desktop**.
2. Vào **Plugins** → **Development** → **Import plugin from manifest…**
3. Chọn file **manifest.json** trong thư mục này:
   ```
   <đường_dẫn_project>\figma-plugin\manifest.json
   ```
   Ví dụ: `D:\Project\ai-docs-cursor\figma-plugin\manifest.json`
4. Plugin sẽ xuất hiện trong **Development** với tên **Cursor MCP Plugin**.

Sau đó mỗi lần dùng: chạy `npm run figma-socket` trong project → mở Figma → chạy plugin → Connect (port 3055).
