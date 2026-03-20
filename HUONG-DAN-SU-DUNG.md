# Hướng dẫn cài đặt và sử dụng UI Test Case Tool

> Tool tự động sinh UI Test Case từ Figma design và ghi vào Google Sheets.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt phần mềm cần thiết](#2-cài-đặt-phần-mềm-cần-thiết)
3. [Thiết lập Google Sheets API](#3-thiết-lập-google-sheets-api)
4. [Cài đặt dự án](#4-cài-đặt-dự-án)
5. [Cấu hình MCP trong Cursor](#5-cấu-hình-mcp-trong-cursor)
6. [Cài đặt Figma Plugin](#6-cài-đặt-figma-plugin)
7. [Cách sử dụng](#7-cách-sử-dụng) (gồm [đẩy chunk bằng script API](#đẩy-nhiều-chunk-tc-bằng-script-google-sheets-api-một-lần))
8. [Xử lý lỗi thường gặp](#8-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Phần mềm       | Phiên bản tối thiểu | Ghi chú                          |
|-----------------|---------------------|----------------------------------|
| Node.js         | 18+                 | Kiểm tra: `node -v`             |
| Cursor IDE      | Mới nhất            | Tải tại https://cursor.com      |
| Figma Desktop   | Mới nhất            | **Bắt buộc dùng bản Desktop**, không dùng bản Web |
| Python (uvx)    | 3.10+               | Cần để chạy MCP Google Sheets   |
| Git             | Bất kỳ              | Để clone dự án                   |

---

## 2. Cài đặt phần mềm cần thiết

### 2.1. Cài đặt Node.js

1. Tải Node.js tại: https://nodejs.org (chọn phiên bản LTS)
2. Cài đặt theo hướng dẫn mặc định
3. Mở Terminal/PowerShell, kiểm tra:
   ```bash
   node -v
   # Kết quả mong đợi: v18.x.x hoặc cao hơn
   ```

### 2.2. Cài đặt Cursor IDE

1. Tải Cursor tại: https://cursor.com
2. Cài đặt và mở Cursor
3. Đăng nhập tài khoản Cursor (nếu có)

### 2.3. Cài đặt Figma Desktop

1. Tải Figma Desktop tại: https://www.figma.com/downloads/
2. Cài đặt và đăng nhập tài khoản Figma

### 2.4. Cài đặt Python + uv (cho Google Sheets MCP)

1. Tải Python tại: https://www.python.org/downloads/ (chọn 3.10+)
2. Khi cài đặt, **tick chọn "Add Python to PATH"**
3. Cài `uv` (package manager cho Python):
   ```bash
   pip install uv
   ```
4. Kiểm tra:
   ```bash
   uvx --version
   ```

---

## 3. Thiết lập Google Sheets API

> Phần này cần thực hiện **1 lần duy nhất**.

### Bước 1: Tạo Google Cloud Project

1. Truy cập: https://console.cloud.google.com
2. Đăng nhập bằng tài khoản Google
3. Click **"Select a project"** (góc trên bên trái) → **"NEW PROJECT"**
4. Đặt tên project (VD: `ui-testcase-tool`) → **"CREATE"**
5. Chọn project vừa tạo

### Bước 2: Bật API cần thiết

1. Vào menu **"APIs & Services"** → **"Library"**
2. Tìm và bật (Enable) lần lượt:
   - **Google Sheets API**
   - **Google Drive API**

### Bước 3: Tạo Service Account

1. Vào **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"Service account"**
3. Đặt tên (VD: `testcase-writer`) → **"CREATE AND CONTINUE"**
4. Ở phần Role, chọn **"Editor"** → **"CONTINUE"** → **"DONE"**

### Bước 4: Tải file credentials

1. Trong danh sách Service Accounts, click vào account vừa tạo
2. Chuyển sang tab **"Keys"**
3. Click **"ADD KEY"** → **"Create new key"** → chọn **JSON** → **"CREATE"**
4. File JSON sẽ tự tải về máy
5. **Di chuyển file này** đến thư mục an toàn, ví dụ:
   ```
   C:\Users\<TenBan>\.google\credentials.json
   ```

### Bước 5: Chia sẻ Google Sheet với Service Account

1. Mở file JSON vừa tải, tìm trường `"client_email"` — copy email đó
   (dạng: `testcase-writer@ui-testcase-tool.iam.gserviceaccount.com`)
2. Mở Google Sheet cần ghi test case
3. Click **"Share"** → dán email service account → quyền **"Editor"** → **"Send"**

> **Quan trọng:** Mỗi Google Sheet muốn ghi test case đều phải được share với email service account này.

---

## 4. Cài đặt dự án

### Bước 1: Clone dự án

```bash
git clone <repository-url>
cd ai-docs-cursor
```

### Bước 2: Mở dự án bằng Cursor IDE

```bash
# Hoặc mở Cursor → File → Open Folder → chọn thư mục ai-docs-cursor
cursor .
```

### Bước 3: Chạy setup tự động

Trong Cursor, mở **Chat** (Ctrl+L) và gõ:
```
/init
```

AI sẽ tự động:
- Kiểm tra phiên bản Node.js
- Cài đặt dependencies (`npm install`)
- Tạo file cấu hình MCP
- Hỏi bạn đường dẫn file credentials Google

**Hoặc** cài đặt thủ công:
```bash
npm install
```

---

## 5. Cấu hình MCP trong Cursor

### Bước 1: Tạo file cấu hình

Copy file mẫu:
```bash
cp mcp-config/mcp.json.example .cursor/mcp.json
```

### Bước 2: Sửa file `.cursor/mcp.json`

Mở file `.cursor/mcp.json` và sửa đường dẫn credentials:

```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "npx",
      "args": ["-y", "cursor-talk-to-figma-mcp@latest"]
    },
    "google-sheets": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-google-sheets"],
      "env": {
        "CREDENTIALS_PATH": "C:\\Users\\<TenBan>\\.google\\credentials.json",
        "TOKEN_PATH": "C:\\Users\\<TenBan>\\.google\\token.json"
      }
    }
  }
}
```

> **Thay `<TenBan>`** bằng tên user Windows của bạn (VD: `Trin`, `NguyenVanA`).

### Bước 3: Xác nhận MCP hoạt động

1. Đóng và mở lại Cursor
2. Vào **Settings** → **MCP** (hoặc tìm "MCP" trong settings)
3. Kiểm tra 2 server đều hiện trạng thái **xanh (connected)**:
   - `TalkToFigma`
   - `google-sheets`

Nếu chưa xanh, thử click **"Restart"** bên cạnh mỗi server.

---

## 6. Cài đặt Figma Plugin

> Chỉ cần thực hiện **1 lần duy nhất**.

### Bước 1: Import plugin vào Figma

1. Mở **Figma Desktop**
2. Vào menu: **Plugins** → **Development** → **Import plugin from manifest...**
3. Trỏ đến file:
   ```
   <đường-dẫn-dự-án>/figma-plugin/manifest.json
   ```
4. Plugin **"Cursor MCP Plugin"** sẽ xuất hiện trong menu Development

### Bước 2: Kiểm tra plugin đã cài thành công

1. Mở 1 file Figma bất kỳ
2. Vào **Plugins** → **Development** → phải thấy **"Cursor MCP Plugin"**

---

## 7. Cách sử dụng

### Quy trình tổng quan

```
Bước 1: Chạy WebSocket Server
    ↓
Bước 2: Mở Figma Plugin → Connect
    ↓
Bước 3: Chọn frame cần test trong Figma
    ↓
Bước 4: Gõ lệnh trong Cursor Chat
    ↓
Bước 5: AI scan → sinh test case → preview
    ↓
Bước 6: Xác nhận → Ghi vào Google Sheet
```

---

### Bước 1: Chạy WebSocket Server

Mở Terminal trong Cursor (Ctrl+`) và chạy:

```bash
npm run figma-socket
```

Kết quả mong đợi:
```
Figma MCP WebSocket server running on ws://localhost:3055
Keep this terminal open. Then: open Figma Desktop -> run plugin -> join channel.
```

> **Giữ terminal này mở** trong suốt quá trình làm việc. Không đóng!

---

### Bước 2: Kết nối Figma Plugin

1. Mở **Figma Desktop** → mở file design cần test
2. Vào **Plugins** → **Development** → **Cursor MCP Plugin**
3. Cửa sổ plugin hiện ra → click nút **"Connect"**
4. Khi hiện trạng thái xanh **"Connected to server in channel: xxxxxxxx"** → thành công

---

### Bước 3: Kết nối channel trong Cursor

Quay lại Cursor Chat, gõ lệnh join channel:
```
join channel <mã-channel>
```

Trong đó `<mã-channel>` là mã 8 ký tự hiện trên plugin Figma (VD: `a1b2c3d4`).

---

### Bước 4: Chọn frame và chạy lệnh

1. **Trong Figma**: click chọn 1 frame (màn hình) cần sinh test case
2. **Trong Cursor Chat**: gõ `/start` hoặc gõ trực tiếp:

```
Scan frame đang chọn trong Figma và sinh UI test case.
Ghi vào Google Sheet:
- Link: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
- Sheet: TenSheet
```

> **Thay thế:**
> - `SPREADSHEET_ID`: ID của Google Sheet (phần giữa `/d/` và `/edit` trong URL)
> - `TenSheet`: Tên sheet muốn ghi (VD: `TC_Login`, `TC_Dashboard`)

---

### Bước 5: Tương tác với AI

AI sẽ hỏi bạn lần lượt:

1. **"Nhập link Google Sheet?"** → Dán link Google Sheet
2. **"Tên hệ thống (システム名) là gì?"** → Nhập tên hệ thống (VD: `勤務管理`)
3. **"Đã chọn frame chưa?"** → Chọn frame trong Figma → trả lời **"OK"** hoặc **"Rồi"**

AI sẽ:
- Scan tất cả element trong frame
- Phân loại (Button, Input, Table, List, Label...)
- Lọc bỏ phần common (Header, Sidebar, Footer...)
- Sinh test case cho từng element

---

### Bước 6: Xác nhận và ghi Sheet

1. AI hiển thị **bảng preview** test case dạng Markdown
2. AI hỏi: **"Xác nhận ghi N test cases chưa?"**
3. Trả lời **"OK"** hoặc **"Xác nhận"** → AI ghi vào Google Sheet
4. Sau khi ghi xong, AI thông báo hoàn tất

---

### Đẩy nhiều chunk TC bằng script (Google Sheets API một lần)

Khi đã có các file `mcp-arg-chunk-NN.json` (payload chuẩn cho MCP) và muốn **ghi toàn bộ lên Sheet một lần** mà không gọi MCP từng chunk trong chat:

1. **Xác thực** (chọn một):
   - **Service Account:** JSON như [mục 3](#3-thiết-lập-google-sheets-api), [share Sheet với email SA](#bước-5-chia-sẻ-google-sheet-với-service-account). Đặt `GOOGLE_APPLICATION_CREDENTIALS` hoặc `CREDENTIALS_PATH` trỏ tới file đó.
   - **OAuth (giống MCP Google Sheets):** file `credentials.json` (client *installed*) + `token.json` đã đăng nhập. Đặt `CREDENTIALS_PATH` và `TOKEN_PATH` (nếu không đặt `TOKEN_PATH`, script dùng `token.json` cùng thư mục với credentials).

2. Trong PowerShell:

   ```powershell
   # Service Account
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Users\<TenBan>\.google\sa-key.json"
   # hoặc OAuth (MCP)
   $env:CREDENTIALS_PATH = "C:\Users\<TenBan>\.google\credentials.json"
   $env:TOKEN_PATH = "C:\Users\<TenBan>\.google\token.json"
   cd "D:\đường\dẫn\ai-docs-cursor"
   npm run push-chunks
   ```

3. Script đọc mọi `mcp-arg-chunk-*.json` trong thư mục gốc dự án, gọi `batchUpdate` với `USER_ENTERED` để công thức (ví dụ `=row()-9`) được tính đúng.

Tùy chọn:

- `node scripts/push-chunks-sheets-api.js --dry-run` — chỉ in tổng số range, không ghi.
- `node scripts/push-chunks-sheets-api.js --from 4 --to 14` — chỉ các chunk số trong khoảng.
- `node scripts/push-chunks-sheets-api.js --dir "D:\path"` — thư mục chứa file chunk (mặc định: thư mục gốc repo).

**Lưu ý:** Không commit file JSON key lên Git.

Nếu thiếu `mcp-arg-chunk-01.json` / `02.json` (vùng A10:O29) nhưng đã có `cells-p1-only.json` (dữ liệu gốc A10:O79), chạy `npm run split-p1-chunks` để tạo lại hai file đó trước khi `npm run push-chunks`.

---

### Ví dụ phiên làm việc hoàn chỉnh

```
Bạn: /start

AI:  Nhập link Google Sheet?

Bạn: https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit

AI:  Tên hệ thống (システム名) là gì?

Bạn: 勤務管理

AI:  Hãy chọn 1 frame trong Figma rồi nói "OK".

Bạn: OK

AI:  Đang scan frame "勤務一覧"...
     Tìm thấy 45 elements → Lọc còn 18 elements chính.
     Sinh được 12 test cases:

     | # | Sub Features | Description          |
     |---|-------------|----------------------|
     | 1 | Overview    | Tổng quan màn hình   |
     | 2 | Title row   | Tiêu đề 勤務一覧     |
     | 3 | Button      | Nút 検索              |
     | ...                                      |

     Xác nhận ghi 12 test cases?

Bạn: OK

AI:  Đã ghi 12 test cases vào sheet "TC_勤務一覧" thành công!
```

---

## 8. Xử lý lỗi thường gặp

### Lỗi: WebSocket server không chạy

```
Error: connect ECONNREFUSED 127.0.0.1:3055
```

**Giải pháp:** Chạy lại `npm run figma-socket` trong terminal.

---

### Lỗi: Figma Plugin không kết nối được

**Giải pháp:**
1. Kiểm tra WebSocket server đang chạy (terminal hiện `running on ws://localhost:3055`)
2. Đóng plugin → mở lại → click **Connect**
3. Kiểm tra port trong plugin là `3055`

---

### Lỗi: MCP server không xanh trong Cursor Settings

**Giải pháp:**
1. Kiểm tra file `.cursor/mcp.json` có đúng format không
2. Kiểm tra đường dẫn `CREDENTIALS_PATH` tồn tại
3. Click **"Restart"** bên cạnh server trong Cursor Settings → MCP
4. Đóng và mở lại Cursor

---

### Lỗi: Không ghi được vào Google Sheet

```
Error: The caller does not have permission
```

**Giải pháp:**
1. Kiểm tra đã share Google Sheet với email service account chưa (xem [Bước 5 mục 3](#bước-5-chia-sẻ-google-sheet-với-service-account))
2. Quyền phải là **Editor** (không phải Viewer)

---

### Lỗi: AI không scan được frame

**Giải pháp:**
1. Kiểm tra đã join đúng channel chưa (channel trên Figma Plugin phải khớp)
2. Kiểm tra đã chọn đúng 1 frame (không phải group hoặc layer con)
3. Thử đóng plugin → mở lại → Connect → join channel lại

---

### Lỗi: `uvx` không tìm thấy

```
'uvx' is not recognized as an internal or external command
```

**Giải pháp:**
```bash
pip install uv
```
Nếu vẫn lỗi, cài trực tiếp:
```bash
# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

---

### Lỗi: Node.js version thấp

**Giải pháp:** Tải và cài phiên bản Node.js mới nhất (LTS) tại https://nodejs.org

---

## Mẹo sử dụng

- **Chọn frame nhỏ trước**: Thử với 1 frame đơn giản trước để làm quen quy trình, sau đó mới scan frame phức tạp.
- **Kiểm tra kết nối**: Trước khi bắt đầu, luôn đảm bảo 3 thứ đã sẵn sàng:
  1. WebSocket server đang chạy (`npm run figma-socket`)
  2. Figma Plugin đã Connected (status xanh)
  3. MCP servers trong Cursor đều xanh
- **Mỗi frame = 1 lần scan**: Mỗi lần chỉ nên scan 1 frame. Muốn scan frame khác, chọn frame mới và chạy lệnh lại.
- **Share sheet trước**: Nhớ share Google Sheet với email service account **trước khi** chạy lệnh ghi.

---

## Cấu trúc dự án (tham khảo)

```
ai-docs-cursor/
├── .cursor/
│   ├── mcp.json              ← Config MCP (chứa API key, không commit)
│   ├── rules                 ← Quy tắc hành vi cho AI
│   └── prompts/
│       ├── init.md           ← Lệnh /init (auto setup)
│       └── start.md          ← Lệnh /start (quy trình chính)
├── figma-plugin/             ← Source code Figma plugin
│   ├── manifest.json         ← File đăng ký plugin
│   ├── code.js               ← Logic backend plugin
│   └── ui.html               ← Giao diện plugin
├── mcp-config/
│   └── mcp.json.example      ← Template config MCP
├── prompts/                   ← Prompt xử lý nghiệp vụ
│   ├── 01-parse-figma-...    ← Parse & filter dữ liệu Figma
│   ├── 02-ui-testcase-...    ← Sinh UI test case
│   └── 03-tc-scenario-...    ← Template TC cho Google Sheet
├── scripts/
│   └── figma-ws-server.js    ← WebSocket server (port 3055)
├── output/                    ← Thư mục lưu kết quả
├── package.json               ← Dependencies & scripts
└── README.md                  ← Tài liệu tóm tắt
```

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề không thể tự xử lý, hãy liên hệ người phụ trách kèm thông tin:
- Ảnh chụp màn hình lỗi
- Nội dung log trong terminal (WebSocket server)
- Phiên bản Node.js (`node -v`)
- Trạng thái MCP servers trong Cursor Settings
