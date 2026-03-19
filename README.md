# UI Test Case Tool — Cursor + MCP

Tự động sinh UI Test Case từ Figma design và ghi vào Google Sheets.

## Yêu cầu

- **Node.js 18+** (kiểm tra: `node -v`)
- Cursor IDE
- Figma Desktop

## Setup

Sau khi clone repo, mở project bằng Cursor → Chat → gõ:

```
/init
```

AI sẽ tự động: cài dependency → tạo config MCP → hỏi điền credentials.

## Cấu trúc

```
.cursor/
  rules                               — Quy tắc cho AI
  prompts/init.md                     — Slash command /init (auto setup)
mcp-config/mcp.json.example           — Template config MCP
prompts/
  01-parse-figma-frame-data.md        — Parse & filter dữ liệu Figma
  02-ui-testcase-from-figma.md        — Sinh UI test case
  03-tc-scenario-sheet-template.md    — Template TC_Scenario cho Google Sheet
scripts/figma-ws-server.js            — WebSocket server kết nối Figma
figma-plugin/                         — Figma plugin source
output/                               — Thư mục lưu kết quả
```

## Cách dùng

1. Chạy WebSocket server: `npm run figma-socket`
2. Mở Figma Desktop → import plugin từ `figma-plugin/manifest.json` → Connect
3. Chọn 1 frame (màn hình) trong Figma
4. Trong Cursor Chat, gõ:
   ```
   Scan frame đang chọn trong Figma và sinh UI test case.
   Ghi vào Google Sheet:
   - Spreadsheet ID: [SPREADSHEET_ID]
   - Sheet: [SHEET_NAME]
   ```
5. AI sẽ: scan → parse → sinh TC → preview → chờ xác nhận → ghi Sheet

## Lưu ý

- File `.cursor/mcp.json` chứa API key → không commit. Đã có trong `.gitignore`.
- Google: tạo Service Account trên Cloud Console, bật Sheets API + Drive API, share sheet với email service account (quyền Editor).
