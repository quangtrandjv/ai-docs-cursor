# BA & Tester Tool — Cursor + MCP

Sau khi clone, chỉ cần điền thông tin cá nhân là dùng được.

## Yêu cầu

- **Node.js 18+** (các MCP cần Node 18; kiểm tra: `node -v`, nếu < 18 thì cài [Node 18 LTS](https://nodejs.org/))
- Cursor IDE
- Figma Desktop (cho MCP Figma)

## Setup nhanh

1. **Cài dependency**
   ```bash
   npm install
   ```

2. **Config MCP (bắt buộc)**
   - Copy: `mcp-config/mcp.json.example` → `.cursor/mcp.json`
   - Mở `.cursor/mcp.json`, điền **thông tin cá nhân** (không commit file này):
     - **Redmine:** `REDMINE_URL`, `REDMINE_API_KEY` (lấy từ Redmine → My account → API access key)
     - **Google Sheets:** `GOOGLE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` (đường dẫn file JSON key). Nếu dùng OAuth, xem [docs/SETUP-GOOGLE-SHEETS-MCP.md](docs/SETUP-GOOGLE-SHEETS-MCP.md).
   - Share Google Sheet/Drive với email service account (Editor).
   - **Lưu ý:** Node.js 18+ (kiểm tra: `node -v`).

3. **Figma (nếu dùng)**  
   Plugin nằm trong project: **`figma-plugin/manifest.json`** — trong Figma: Plugins → Development → Import plugin from manifest → chọn file đó. Sau đó: chạy `npm run figma-socket` → mở Figma → chạy plugin → Connect. Chi tiết: [setup-figma-talk-to-figma.md](setup-figma-talk-to-figma.md).

4. Mở project bằng Cursor → Chat dùng được các MCP.

## Cấu trúc

- `.cursor/rules` — Quy tắc cho AI
- `.cursor/mcp.json` — Config MCP (không commit, mỗi người tự điền)
- `mcp-config/mcp.json.example` — Template config MCP
- `prompts/` — Gợi ý prompt từng bước (gồm **08-export-ui-spec-from-figma.md** — xuất UI spec từ frame Figma)
- `docs/pain-points-and-idea-ui-spec-from-figma.md` — Pain points BA/Tester & ý tưởng tự động UI spec từ design
- `templates/` — Template Spec & Testcase
- `output/` — Thư mục lưu kết quả (UI spec, báo cáo, test case…) khi xử lý task
- `cursor-mcp-plan.md` — Tài liệu kiến trúc & flow

## Lưu ý

- File `.cursor/mcp.json` chứa API key → không commit. Đã có trong `.gitignore`.
- Google: tạo Service Account trên Cloud Console, bật Sheets API + Drive API, share sheet/folder với email service account.
