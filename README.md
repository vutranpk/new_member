# Welcome Studio — HR Onboarding Poster Dashboard

Ứng dụng tạo thông báo chào đón nhân sự mới tự động chuẩn A4 (300 DPI) dành cho HR, chạy hoàn toàn bằng **HTML/CSS/JS thuần**, không cần backend database, sẵn sàng đưa lên **GitHub Pages** và đồng bộ danh sách công ty qua **Google Sheets**.

---

## 🚀 Cách chạy thử trên máy (Local)

1. Mở PowerShell tại thư mục dự án:
   ```powershell
   powershell -ExecutionPolicy Bypass -File serve.ps1
   ```
2. Mở trình duyệt truy cập:
   - Trang chọn công ty: **http://localhost:5173/**
   - Mở sẵn Phúc Sinh Consumers: **http://localhost:5173/?c=psc**
   - Mở kèm dữ liệu thử nghiệm chuẩn mẫu: **http://localhost:5173/?c=psc&demo**
   - Thử nghiệm trường hợp tên rất dài: **http://localhost:5173/?c=demo-b&demo=long**

---

## 🎨 Điểm nổi bật & Tính năng tự động hóa

1. **Khóa 100% Font Barlow chính hãng:**
   - Đã nhúng sẵn toàn bộ font chuẩn tiếng Việt (`woff2`) gồm Barlow, Barlow Semi Condensed và Barlow Condensed.
2. **Auto-fit Name (Bảo vệ tên nhân viên):**
   - Tên ngắn/vừa: Dùng Barlow Bold chuẩn.
   - Tên dài (như *Nguyễn Hoàng Huyền Trang*): Hệ thống tự đổi sang *Barlow Semi Condensed Bold*, tự co size để **luôn giữ 1 dòng**. Nếu tên cực dài mới tách dòng cân đối (`text-wrap: balance`).
3. **Chỉnh khung ảnh chân dung trực tiếp (Drag & Zoom):**
   - Kéo-thả ảnh từ máy tính hoặc thả trực tiếp lên khung ảnh trên poster.
   - Thanh trượt zoom (100% – 300%) và dùng chuột kéo di chuyển khuôn mặt vào đúng tâm góc vát chéo.
4. **Thông minh hóa nội dung (Smart Copy):**
   - Chọn `Anh / Mr.` $\rightarrow$ Tự động điền câu chúc: *"Chào mừng anh gia nhập... We wish him..."*
   - Chọn `Chị / Ms.` $\rightarrow$ Tự động đổi sang *"chị"* và *"her"*.
   - Rời ô email sẽ tự ghép đuôi `@domain` của công ty đang chọn.
   - Rời ô số điện thoại tự định dạng nhóm số Việt Nam `09xx xxx xxx`.
5. **Xuất file A4 siêu nét (300 DPI):**
   - Nút **Tải ảnh A4**: Xuất định dạng JPG chất lượng cao đúng chuẩn $2480 \times 3508\text{ px}$, tối ưu dung lượng gửi mail/Zalo.
   - Nút **PDF**: Xuất file PDF vector A4 chuẩn in ấn.

---

## 📊 Hướng dẫn kết nối Google Sheets (Khi đưa lên GitHub Pages)

Sau khi tạo bảng tính Google Sheets để quản lý danh sách công ty, bạn chỉ cần thực hiện 3 bước:

### Bước 1: Chuẩn bị bảng Google Sheets
Tạo các cột tiêu đề ở dòng 1 (chữ thường hoặc hoa đều được):
- `id`: Mã định danh ngắn (ví dụ: `psc`, `kcoffee`, `pscorp`)
- `name`: Tên hiển thị (ví dụ: `Phúc Sinh Consumers`)
- `legal_name`: Tên pháp nhân xuất hiện trong lời chúc (ví dụ: `Phuc Sinh Consumer Corp.`)
- `logo`: Đường dẫn logo (ví dụ: `assets/companies/psc/logo.png`)
- `background`: Đường dẫn ảnh viền nền A4 (ví dụ: `assets/companies/psc/background.jpg`)
- `ink`: Màu chữ tiêu đề (mã hex, ví dụ: `#103D54`)
- `primary`: Màu thương hiệu chính viền khung ảnh (ví dụ: `#11A3DC`)
- `accent`: Màu nhấn gạch đỏ & ngôi sao (ví dụ: `#EB1F36`)
- `email_domain`: Đuôi email gợi ý (ví dụ: `kcoffee.vn`)
- `footer`: Dòng chữ dưới cùng (ví dụ: `WWW.KCOFFEE.VN / K COFFEE APP`)
- `announce_vi`: Tiêu đề thông báo TV (để trống sẽ lấy mặc định)
- `announce_en`: Tiêu đề thông báo TA (để trống sẽ lấy mặc định)
- `active`: Điền `TRUE` để hiển thị trên web

### Bước 2: Xuất bản Sheet dạng CSV
1. Trên Google Sheets: Vào menu **Tệp (File)** $\rightarrow$ **Chia sẻ (Share)** $\rightarrow$ **Xuất bản lên web (Publish to web)**.
2. Tại mục *Liên kết (Link)*, chọn tab chứa danh sách công ty $\rightarrow$ định dạng chọn **Giá trị được phân tách bằng dấu phẩy (.csv)**.
3. Bấm **Xuất bản (Publish)** và copy đường link nhận được.

### Bước 3: Dán link vào file cấu hình
Mở file [`js/config.js`](file:///d:/antigravity/new%20personnel/js/config.js) và dán link vào:
```javascript
window.WS_CONFIG = {
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv',
  // ...
};
```
Mỗi khi công ty cập nhật hay thêm dòng mới trên Google Sheets, web sẽ tự động nhận diện và cập nhật danh sách!
