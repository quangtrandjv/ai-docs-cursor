# KẾ HOẠCH: BA & Tester Tool — Cursor + MCPs

---

## TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────┐
│                  CURSOR IDE                      │
│                                                  │
│  Chat Interface  ←→  Claude AI (Cursor Agent)   │
│                            ↕                     │
│         ┌──────────────────────────────┐         │
│         │         MCP LAYER            │         │
│         │                              │         │
│         │  1. Talk to Figma MCP        │         │
│         │     → Đọc frames/components  │         │
│         │     → Export design data     │         │
│         │                              │         │
│         │  2. Redmine MCP              │         │
│         │     → Đọc task description   │         │
│         │     → Lấy links đính kèm     │         │
│         │                              │         │
│         │  3. Google Sheets MCP        │         │
│         │     → Đọc Spec cũ            │         │
│         │     → Ghi Spec/Testcase mới  │         │
│         │                              │         │
│         │  4. Google Drive MCP         │         │
│         │     → Browse/đọc file        │         │
│         └──────────────────────────────┘         │
└─────────────────────────────────────────────────┘
```

---

## PHẦN 1 — CÁC MCP CẦN THIẾT

### 1.1 Talk to Figma MCP ⭐ (Quan trọng nhất)

**Repo:** https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp

**Cách hoạt động:**
- Chạy một WebSocket server local (port 3055)
- Cài Figma Plugin "Cursor Talk to Figma" vào Figma app
- Cursor AI ↔ WebSocket ↔ Figma Plugin ↔ Design file

**Khả năng:**
- Đọc toàn bộ cấu trúc frames, layers, components
- Lấy text content từ design
- Đọc properties (màu sắc, kích thước, font)
- Không cần Personal Access Token

**Yêu cầu:**
- Node.js 18+
- npx / bunx để chạy server
- Figma Desktop app (không phải web)
- Cài plugin vào Figma

---

### 1.2 Redmine MCP

**Package:** `redmine-mcp-server` hoặc tự host

**Khả năng:**
- `get_issue(id)` → lấy toàn bộ thông tin task
- `list_issues(project)` → liệt kê tasks
- `get_issue_journals` → lấy comments/history
- Extract links từ description tự động

**Yêu cầu:**
- REDMINE_URL
- REDMINE_API_KEY (lấy từ My Account)

---

### 1.3 Google Sheets MCP

**Package:** `@modelcontextprotocol/server-google-sheets`
hoặc `mcp-google-sheets`

**Khả năng:**
- `read_spreadsheet` → đọc toàn bộ sheet
- `write_spreadsheet` → ghi data vào range
- `get_sheet_names` → liệt kê tabs
- `format_cells` → định dạng cells

**Yêu cầu:**
- Google Service Account JSON
- Hoặc OAuth2 (user tự login)
- Share sheet với service account email

---

### 1.4 Google Drive MCP

**Package:** `@modelcontextprotocol/server-gdrive`

**Khả năng:**
- `list_files` → browse files/folders
- `read_file` → đọc nội dung file
- `search_files` → tìm kiếm theo tên

**Yêu cầu:** Cùng credentials với Google Sheets

---

## PHẦN 2 — CẤU TRÚC THƯ MỤC PROJECT

```
ba-tester-tool/
│
├── .cursor/
│   └── rules                    ← Cursor Rules (não của tool)
│
├── mcp-config/
│   └── mcp.json                 ← Config tất cả MCPs
│
├── prompts/
│   ├── 01-analyze-task.md       ← Phân tích Redmine task
│   ├── 02-scan-figma.md         ← Scan Figma design
│   ├── 03-compare-spec.md       ← So sánh Spec cũ vs Figma
│   ├── 04-generate-spec.md      ← Sinh Spec mới
│   ├── 05-generate-testcase.md  ← Sinh Testcase từ Spec
│   ├── 06-write-sheet.md        ← Ghi vào Google Sheet
│   └── 07-custom-update.md      ← Chỉnh sửa tự do
│
├── templates/
│   ├── spec-template.md         ← Mô tả cấu trúc Spec
│   └── testcase-template.md     ← Mô tả cấu trúc Testcase
│
├── .env                         ← API keys (không commit git)
└── README.md                    ← Hướng dẫn setup
```

---

## PHẦN 3 — MCP.JSON CONFIG

```json
{
  "mcpServers": {

    "figma": {
      "command": "npx",
      "args": ["-y", "cursor-talk-to-figma-mcp"],
      "note": "Cần chạy kèm Figma Plugin trên Desktop app"
    },

    "redmine": {
      "command": "npx",
      "args": ["-y", "redmine-mcp-server"],
      "env": {
        "REDMINE_URL": "https://redmine.yourcompany.com",
        "REDMINE_API_KEY": "YOUR_API_KEY"
      }
    },

    "google-sheets": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-sheets"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_JSON": "{ ... }"
      }
    },

    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gdrive"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_JSON": "{ ... }"
      }
    }

  }
}
```

> ⚠️ File mcp.json thực tế sẽ đặt tại:
> - macOS/Linux: `~/.cursor/mcp.json` (global)
> - Hoặc: `<project>/.cursor/mcp.json` (per project)

---

## PHẦN 4 — CURSOR RULES

File: `.cursor/rules`

```
# BA & TESTER TOOL — CURSOR RULES

## Vai trò
Bạn là AI hỗ trợ BA và Tester phân tích task, tạo Spec và Testcase.
Luôn trả lời và tạo nội dung bằng Tiếng Việt.

## Quy tắc xử lý task

### Khi nhận được Redmine Task ID:
1. Dùng Redmine MCP đọc task
2. Tóm tắt: tiêu đề, mô tả, priority, assignee
3. Extract tất cả links: Figma URL, Google Sheet URLs
4. Hỏi user: "Chạy full flow hay từng bước?"

### Khi scan Figma:
1. Kết nối qua Talk-to-Figma MCP
2. Liệt kê tất cả frames tìm thấy
3. Với mỗi frame: đọc tên, layout, text content, components
4. Nhóm theo feature/màn hình
5. KHÔNG tự động sinh Spec khi chưa có lệnh

### Khi so sánh Spec cũ vs Figma mới:
1. Đọc Spec cũ từ Google Sheets
2. Đọc design hiện tại từ Figma
3. Tạo bảng so sánh: Giữ nguyên | Thay đổi | Thêm mới | Đã xóa
4. Highlight các điểm cần cập nhật
5. Chờ user xác nhận trước khi sinh Spec mới

### Khi sinh Spec:
- Bám sát template trong file templates/spec-template.md
- Ưu tiên: thông tin từ Figma > mô tả Redmine
- Mỗi màn hình/feature = ít nhất 1 spec row
- Ghi rõ Acceptance Criteria dạng checklist

### Khi sinh Testcase:
- Bám sát template trong file templates/testcase-template.md
- Mỗi Spec row → tối thiểu 3 test cases
- Bắt buộc cover: Happy path, Negative, Validation
- Thêm nếu phù hợp: Boundary, UI/UX, Permission

### Khi ghi vào Google Sheet:
1. LUÔN hiển thị preview data lên chat trước
2. Hỏi: "Xác nhận ghi vào Sheet chưa?"
3. Chỉ ghi sau khi user nói "OK" / "Xác nhận" / "Ghi đi"
4. Báo cáo kết quả sau khi ghi xong

## Quy tắc tổng quát
- Không tự chạy quá 1 bước nếu chưa được yêu cầu
- Mỗi bước xong phải tóm tắt kết quả và hỏi bước tiếp
- Khi không chắc → hỏi, không tự đoán
- Khi user yêu cầu chỉnh sửa → thực hiện ngay, không hỏi lại
```

---

## PHẦN 5 — PROMPT TEMPLATES

### 01 — Phân tích task
```
Phân tích task Redmine #[TASK_ID]:
- Lấy toàn bộ thông tin task
- Tóm tắt yêu cầu chính
- Liệt kê các links tìm thấy (Figma, Google Sheet)
- Đề xuất bước tiếp theo
```

### 02 — Scan Figma
```
Scan Figma design tại: [FIGMA_URL hoặc "link vừa lấy từ task"]
- Liệt kê tất cả frames/screens
- Mô tả từng màn hình: tên, các thành phần chính, luồng UX
- Nhóm theo module/feature
```

### 03 — So sánh Spec cũ vs Figma
```
So sánh Spec cũ với design Figma hiện tại:
- Spec cũ tại: [SHEET_URL]
- Figma đã scan ở bước trước
- Tạo bảng: Giữ nguyên | Cập nhật | Thêm mới | Bỏ đi
```

### 04 — Sinh Spec mới
```
Dựa trên phân tích ở trên, tạo Spec mới:
- Theo đúng template trong templates/spec-template.md
- Cover toàn bộ màn hình đã scan từ Figma
- Hiển thị preview dạng bảng trước khi ghi
```

### 05 — Sinh Testcase
```
Từ Spec vừa tạo, sinh Testcase:
- Theo template trong templates/testcase-template.md
- Mỗi feature tối thiểu 3 TC (Happy/Negative/Validation)
- Hiển thị preview và chờ xác nhận
```

### 06 — Ghi vào Sheet
```
Ghi [Spec / Testcase] vào Google Sheet:
- Sheet URL: [URL]
- Preview lại data
- Chờ tôi xác nhận rồi mới ghi
```

### 07 — Chỉnh sửa tự do (ví dụ)
```
Cập nhật Spec trong Sheet:
- Thêm cột "Ghi chú DEV" sau cột "Acceptance Criteria"
- Đổi giá trị Priority: Cao→P1, Trung bình→P2, Thấp→P3
- Gộp dòng 5 và 6 thành 1
```

---

## PHẦN 6 — FLOW SỬ DỤNG HÀNG NGÀY

### Mode A — Full Auto (1 lệnh)
```
User: "Chạy full flow cho task #1234"

AI tự động:
  → Bước 1: Đọc Redmine #1234
  → Bước 2: Scan Figma (link lấy từ task)
  → Bước 3: Đọc Spec cũ (link lấy từ task)
  → Bước 4: So sánh → tóm tắt thay đổi
  → Bước 5: Sinh Spec mới → preview
  → Bước 6: Sinh Testcase → preview
  → Bước 7: "Xác nhận ghi vào Sheet không?"
```

### Mode B — Step by Step
```
User: "Lấy task #1234"          → AI đọc & tóm tắt
User: "Scan Figma"               → AI liệt kê frames
User: "So sánh với spec cũ"      → AI bảng diff
User: "Sinh spec mới"            → AI preview spec
User: "OK ghi vào sheet"         → AI ghi
User: "Giờ làm testcase"         → AI preview TC
User: "Ghi testcase vào sheet"   → AI ghi
```

### Mode C — Chỉnh sửa tự do
```
User: "Đổi tên cột 'Mô tả' thành 'User Story'"
User: "Thêm 3 testcase cho màn hình Login"
User: "Xóa các TC có priority Thấp"
User: "Format lại cột Steps thành numbered list"
```

---

## PHẦN 7 — CHECKLIST SETUP

### Bước 1 — Chuẩn bị môi trường
- [ ] Cài Node.js 18+ trên máy
- [ ] Cài Cursor IDE (bản mới nhất)
- [ ] Cài Figma Desktop app

### Bước 2 — Setup Talk to Figma MCP
- [ ] Clone repo: `git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp`
- [ ] Cài Figma Plugin "Cursor Talk to Figma" (link trong repo)
- [ ] Test: mở Figma → bật plugin → chạy `npx cursor-talk-to-figma-mcp`
- [ ] Verify kết nối trong Cursor MCP panel

### Bước 3 — Setup Redmine MCP
- [ ] Lấy API key từ Redmine (My Account → API access key)
- [ ] Điền REDMINE_URL và REDMINE_API_KEY vào mcp.json
- [ ] Test: hỏi Cursor "lấy task #[số task thật]"

### Bước 4 — Setup Google Sheets MCP
- [ ] Tạo Google Service Account trên Google Cloud Console
- [ ] Enable Sheets API + Drive API
- [ ] Tải JSON key → stringify → điền vào mcp.json
- [ ] Share 1 Sheet test với email service account (quyền Editor)
- [ ] Test: hỏi Cursor "đọc sheet [url]"

### Bước 5 — Config Cursor Rules
- [ ] Tạo file `.cursor/rules` trong project folder
- [ ] Paste nội dung Cursor Rules ở Phần 4
- [ ] Cập nhật templates/ với format thực tế của team

### Bước 6 — Chạy thử end-to-end
- [ ] Chọn 1 task Redmine thật (có link Figma + Sheet)
- [ ] Chạy full flow
- [ ] Review output
- [ ] Chỉnh prompt nếu cần

---

## PHẦN 8 — LƯU Ý QUAN TRỌNG

### Talk to Figma — Điều kiện bắt buộc
```
⚠️  Phải dùng Figma DESKTOP, không dùng web
⚠️  WebSocket server (port 3055) phải đang chạy
⚠️  Figma file phải đang MỞ trong Desktop app
⚠️  Plugin phải được KÍCH HOẠT trong file đó
```

### Google Sheets — Quyền truy cập
```
⚠️  PHẢI share sheet với email service account
    (dạng: name@project.iam.gserviceaccount.com)
⚠️  Quyền tối thiểu: Editor (để ghi được)
⚠️  File .env / mcp.json KHÔNG được commit lên Git
```

### Cursor Rules — Giới hạn
```
ℹ️  Rules chỉ áp dụng trong project folder đó
ℹ️  Mỗi project có thể có Rules khác nhau
ℹ️  Có thể override bằng cách chat trực tiếp
```
