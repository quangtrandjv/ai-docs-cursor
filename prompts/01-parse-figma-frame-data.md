# Parse & Filter dữ liệu Figma Frame

## Mục đích

Xử lý dữ liệu thô từ Figma MCP (`get_node_info`, `scan_text_nodes`), lọc bỏ các element không cần thiết, phân loại UI element, và trả về danh sách sạch dễ hiểu. Skill này được gọi bởi các skill khác (sinh TC, export UI spec...) — không chạy độc lập.

## Điều kiện

- Đã có dữ liệu thô từ `get_node_info(frameId)` và/hoặc `scan_text_nodes(frameId)`

---

## Quy trình xử lý

### Bước 1 — Lọc element ẩn và vô hình

Khi duyệt cây node, **BỎ QUA hoàn toàn** (kể cả children) các node thỏa bất kỳ điều kiện nào:

| Điều kiện | Lý do |
|-----------|-------|
| `visible === false` | Element bị ẩn trong design |
| `opacity === 0` | Element trong suốt hoàn toàn, không nhìn thấy |
| `width === 0` hoặc `height === 0` (từ `absoluteBoundingBox`) | Element không có kích thước hiển thị |

**Quan trọng:** Khi 1 node bị lọc → toàn bộ children của nó cũng bị lọc, không cần duyệt sâu hơn.

### Bước 2 — Lọc vùng common (mặc định bỏ qua)

Các phần common/shared trong design thường nằm ở mọi màn hình và **không cần test** trừ khi task yêu cầu cụ thể.

**Mặc định BỎ QUA** node (và children) có tên khớp các pattern sau (không phân biệt hoa/thường):

| Pattern tên node | Vùng common |
|------------------|-------------|
| `header`, `page-header`, `app-header`, `top-bar`, `topbar`, `navbar`, `appbar` | Header trang |
| `sidebar`, `side-bar`, `side-menu`, `sidemenu`, `left-menu`, `left-nav`, `drawer` | Sidebar / Menu bên |
| `navigation`, `main-nav`, `main-menu`, `global-nav`, `global-menu` | Navigation chính |
| `footer`, `page-footer`, `app-footer`, `bottom-bar`, `bottombar` | Footer trang |
| `breadcrumb`, `breadcrumbs` | Breadcrumb navigation |
| `status-bar`, `statusbar` | Status bar (mobile) |

**Quy tắc match:**
- Match theo **tên node cấp 1** (children trực tiếp của frame gốc) — không match sâu hơn
- So sánh **không phân biệt hoa/thường**
- Chỉ match khi tên node **bắt đầu bằng** hoặc **bằng đúng** pattern (tránh false positive)
- Ví dụ: node tên `Header` → lọc, node tên `Table Header Row` → KHÔNG lọc

**Khi user yêu cầu test vùng common:**
- Nếu user nói rõ: "test cả header", "bao gồm sidebar", "task này cập nhật menu"
- → Bỏ qua bước lọc common cho vùng được chỉ định
- → Ghi nhận trong output: `[COMMON - INCLUDED]`

**Khi lọc xong, thông báo cho user:**
```
Đã lọc bỏ các vùng common:
- Header: [tên node] (X children)
- Sidebar: [tên node] (X children)
Nếu cần test các vùng này, hãy cho tôi biết.
```

### Bước 3 — Lọc node nội bộ vô nghĩa

Sau khi lọc ẩn và common, tiếp tục lọc các node wrapper không mang ý nghĩa UI:

| Điều kiện | Hành động |
|-----------|-----------|
| FRAME chỉ có đúng 1 child và không có text/fill/stroke riêng | **Bỏ wrapper**, giữ child (nâng lên 1 cấp) |
| FRAME tên bắt đầu bằng `Frame `, `Group `, `Container ` theo sau là số (vd: `Frame 427`) | Đây là auto-generated name → **bỏ wrapper**, giữ children |
| VECTOR, LINE, RECTANGLE không có text, không có fill visible | Decoration/spacing element → **bỏ** |
| Node có `absoluteBoundingBox` nằm hoàn toàn ngoài bounds của frame gốc | Overflow/hidden element → **bỏ** |

**KHÔNG lọc:**
- FRAME/GROUP có tên đặt rõ ràng (không phải auto-generated) → đây là section có ý nghĩa
- INSTANCE (component instance) → luôn giữ
- TEXT → luôn giữ
- Node có event handler hoặc là interactive component

### Bước 4 — Phân loại UI element

Với mỗi node còn lại sau bước lọc, gán **loại UI** theo thứ tự ưu tiên:

#### 4.1 Phân loại theo tên node (ưu tiên cao nhất)

Match tên node **không phân biệt hoa/thường**. Nếu tên chứa keyword → gán loại tương ứng:

| Keyword trong tên node | Loại UI |
|------------------------|---------|
| `button`, `btn`, `cta` | **Button** |
| `input`, `textfield`, `text-field`, `text-input`, `search-bar`, `searchbar` | **Input** |
| `dropdown`, `select`, `combobox`, `combo-box`, `picker` | **Dropdown** |
| `checkbox`, `check-box` | **Checkbox** |
| `radio`, `radio-button` | **Radio** |
| `toggle`, `switch` | **Toggle** |
| `tab`, `tabs`, `tab-bar`, `tabbar` | **Tab** |
| `table`, `data-table`, `grid` (khi có nhiều row children) | **Table** |
| `modal`, `dialog`, `popup`, `overlay`, `bottom-sheet` | **Modal** |
| `toast`, `snackbar`, `notification`, `alert` | **Toast** |
| `icon`, `ic-`, `ico-` | **Icon** |
| `image`, `img`, `avatar`, `thumbnail`, `photo` | **Image** |
| `badge`, `tag`, `chip`, `label` (khi là INSTANCE) | **Badge/Tag** |
| `tooltip` | **Tooltip** |
| `pagination`, `pager` | **Pagination** |
| `card` | **Card** |
| `divider`, `separator`, `line` | **Divider** (bỏ qua — không tạo TC) |

#### 4.2 Phát hiện duplicate labels across sections

Khi cùng 1 text (vd: 「表示名」) xuất hiện ở **NHIỀU section/form** khác nhau trong frame:
- Ghi rõ **parent section name** vào field `notes` cho mỗi instance. Ví dụ:
  - `notes: "thuộc section 病棟"` cho 「表示名」 trong form 病棟
  - `notes: "thuộc section 面会枠"` cho 「表示名」 trong form 面会枠
- Điều này giúp bước sinh TC **KHÔNG gộp nhầm** label cùng tên từ section khác nhau thành 1 TC
- Cách xác định parent section: tìm FRAME/INSTANCE cha gần nhất có tên đặt rõ ràng (không phải auto-generated)

#### 4.3 Extract dropdown options

Khi phát hiện node loại **Dropdown/Select** (theo Bước 4.1):
- Duyệt children TEXT nodes để lấy **danh sách tên option**
- Ghi vào field `options: ["option1", "option2", ...]`
- Nếu dropdown panel đang mở trong design (visible), lấy tất cả option text
- Nếu panel đóng, ghi `options: []` và `notes: "panel đóng — không thấy options"`

#### 4.4 Phân loại theo node type (khi tên không match)

| Node type | Điều kiện bổ sung | Loại UI |
|-----------|-------------------|---------|
| `TEXT` | fontSize >= 20 hoặc fontWeight >= 700 | **Title** |
| `TEXT` | fontSize >= 14 và < 20 | **Label** |
| `TEXT` | fontSize < 14 hoặc opacity < 1 | **Hint/Caption** |
| `INSTANCE` | Có children chứa TEXT | **Component** (mô tả theo nội dung) |
| `FRAME` | Có children là nhiều INSTANCE cùng component | **List** |
| `FRAME` | Có auto-layout, nhiều children đa dạng | **Section** |

#### 4.5 Phân loại không được (fallback)

- Gán loại: **UI Component**
- Mô tả: `[node.type] - [node.name]`

### Bước 5 — Phát hiện và gộp repeating items (CRITICAL)

**Đây là bước quan trọng nhất — nếu bỏ qua sẽ tạo ra hàng trăm TC trùng lặp.**

**Cách phát hiện repeating items:**
- FRAME có >= 2 children là INSTANCE **cùng component name** (hoặc cùng structure)
- Hoặc FRAME có auto-layout (`layoutMode` = `VERTICAL` hoặc `HORIZONTAL`) với children giống nhau
- Hoặc **nhiều nhóm element có cùng pattern** (cùng loại, cùng bounds, cùng font) xuất hiện lặp lại ở các vị trí khác nhau

**Các pattern lặp thường gặp trong design:**

| Pattern | Ví dụ | Cách xử lý |
|---------|-------|-------------|
| Nhiều dòng trong danh sách | 3 dòng data trong bảng, mỗi dòng có tên + trạng thái | Giữ **1 dòng đại diện**, ghi `count: N` |
| Nhiều ward/floor/tầng | 「A棟3階」「A棟2階」「A棟4階」 mỗi tầng có cùng pattern (input 病棟 + input 表示名) | Giữ **1 tầng đại diện**, ghi `count: N tầng` |
| Nhiều room/phòng | 「403号室」「404号室」 cùng pattern | Giữ **1 phòng đại diện**, ghi `count: N phòng` |
| Nhiều 面会枠 type | 「通常面会」「荷物受け渡し」「退院迎え」 cùng pattern (nút + input + dropdown) | Giữ **1 type đại diện**, ghi `count: N types` |
| Nhiều dropdown cùng component | Nhiều `lv2/pulldown/list` 224×29px | Giữ **1 dropdown đại diện**, ghi `count: N` |
| Label「表示名」lặp nhiều chỗ | 「表示名」xuất hiện ở mỗi tầng, mỗi phòng, mỗi 面会枠 | Giữ **1 instance mỗi section** (Form 病棟 1 lần, Form 面会枠 1 lần) |

**Xử lý:**
- Gộp thành 1 nhóm loại **List**
- Chỉ giữ **1 item đại diện** (item đầu tiên) để mô tả
- Ghi số lượng item: `count: N`
- Liệt kê thành phần bên trong 1 item (text, icon, button...)
- **KHÔNG tạo entry riêng cho mỗi instance** của cùng 1 pattern

**Kiểm tra cuối:** Sau khi gộp xong, nếu flat list > 40 element → rà lại xem có pattern lặp chưa được gộp không.

### Bước 6 — Chuẩn hóa output

Trả về **flat list** (không lồng nhau) với format cho mỗi element:

```
{
  name:        "tên node gốc từ Figma",
  uiType:      "Button | Input | Dropdown | Label | Title | Table | List | ...",
  text:        "nội dung text (nếu có, giữ nguyên tiếng Nhật)",
  children:    "mô tả ngắn children (nếu là container)",
  parentSection: "tên section/form cha gần nhất (vd: 病棟, 面会枠) — dùng để phân biệt label trùng tên",
  location:    "vị trí tương đối trong frame: top | middle | bottom | left | right",
  bounds:      "WxH (px)",
  listCount:   N (chỉ có khi uiType = List),
  options:     ["option1", "option2"] (chỉ có khi uiType = Dropdown, lấy từ children TEXT),
  isCommon:    false (true nếu user yêu cầu include vùng common),
  notes:       "ghi chú đặc biệt nếu có"
}
```

**Sắp xếp output** theo thứ tự xuất hiện trên giao diện (top → bottom, left → right), dựa vào `absoluteBoundingBox.y` rồi `absoluteBoundingBox.x`.

---

## Output mẫu

```
Frame: AT0022_勤務一覧
Đã lọc: Header (12 children), Sidebar (8 children)
Tổng element sau lọc: 9

1. Title      | "勤務一覧"              | top     | 200x32
2. Label      | "所属を選択"            | top     | 120x20  | section: フィルター
3. Dropdown   | 所属フィルター           | top     | 240x40  | options: [全て, 営業部, 開発部, 総務部]
4. Label      | "期間"                  | top     | 60x20   | section: フィルター
5. Input      | 日付選択                 | top     | 200x40  | placeholder: "YYYY/MM/DD"
6. Button     | "検索"                  | top     | 80x40
7. Table      | 勤務一覧テーブル         | middle  | 800x400 | headers: [名前, 所属, 出勤, 退勤, 休憩]
8. List       | 勤務行                   | middle  | 800x40  | count: 15 | item: [名前, 所属, 時間, 時間, 時間]
9. Pagination | ページネーション          | bottom  | 300x32
```

---

## Các trường hợp đặc biệt

### Frame quá lớn (nhiều node)
- Nếu `get_node_info` trả về > 200 node sau lọc → cảnh báo user
- Đề xuất: "Frame có nhiều element, muốn scan toàn bộ hay chỉ 1 section?"

### Frame chứa nhiều variant/state
- Figma design có thể chứa nhiều state của cùng 1 element (hover, active, disabled...)
- Các variant thường nằm trong COMPONENT_SET hoặc có tên chứa `state=`, `hover`, `active`, `disabled`, `focused`
- **Mặc định chỉ lấy state mặc định** (default/rest state)
- Ghi nhận variant khác vào `notes` để tester biết

### Xử lý color rỗng (`fills[0].color = {}`)

Figma trả về color object rỗng `{}` khi:
- Element kế thừa color từ parent (không set riêng)
- Element dùng style/variable (color nằm trong style, không inline)
- Element thực sự không có fill

**Quy tắc:** Khi `fills[0].color` = `{}` hoặc `{red:0, green:0, blue:0}` (= #000000):
1. **KHÔNG mặc định ghi `#000000`** — giá trị này thường sai
2. **Kiểm tra parent frame/rectangle** để lấy background thực tế
3. **Kiểm tra `style` property** nếu element dùng shared style
4. Nếu không xác định được → **bỏ qua thuộc tính Background**, ghi `notes: "background cần verify trên build"`
5. Đặc biệt: input/text field thường có background `#ffffff` (trắng), nút chính thường có background theo brand color — **KHÔNG BAO GIỜ là #000000**

**Ví dụ sai → đúng:**
- ❌ Input field: `Background: #000000` → ✅ Bỏ qua hoặc `Background: #ffffff` (nếu xác nhận được)
- ❌ Nút「保存」: `Background: #000000` → ✅ `Background: #004580` (lấy từ parent rectangle fills)
- ❌ Nút「面会枠の種類」: `Background: #000000` → ✅ `Background: #7cbd45`

### Lọc text rác / overflow

Lọc bỏ TEXT node có nội dung bất thường:
- Text lặp lại cùng cụm > 3 lần (vd: `「1階　呼吸器外科1階　呼吸器外科1階　呼吸器外科...」`)
- Text quá dài (> 200 ký tự) mà không phải tooltip content
- Đây thường là text overflow hoặc bug trong design → đánh dấu `notes: "text overflow — bỏ qua"`

### Text nội dung dummy/placeholder trong design
- Text như `Lorem ipsum`, `テキスト`, `Text`, `Label`, `000-0000-0000` → có thể là placeholder
- Vẫn giữ nhưng đánh dấu `notes: "possible placeholder"` để tester xác nhận

---

## Tham chiếu

- Figma MCP tools: `get_node_info`, `scan_text_nodes`, `get_selection`
