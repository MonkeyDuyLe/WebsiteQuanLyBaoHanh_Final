# HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG HỆ THỐNG TECHCARE PRO
## Website Quản Lý Bảo Hành & Hỗ Trợ Kỹ Thuật PC & Laptop (37 User Stories / 5 Sprints)

---

### 1. Giới thiệu tổng quan
Dự án được xây dựng hoàn chỉnh dựa trên 37 User Stories trong 5 Sprints từ file Excel, sử dụng công nghệ:
- **Frontend:** HTML5, CSS3 hiện đại, JavaScript ES6+, FontAwesome Icons, Chart.js, SheetJS (XLSX), Html5-QRCode.
- **Backend & Database:** **Firebase Firestore** (cơ sở dữ liệu đám mây thời gian thực) và **Firebase Authentication** (xác thực người dùng an toàn).
- **Phân quyền độc lập:**
  - **Trang Quản Trị (Admin):** Nằm riêng biệt trong thư mục `admin/`. Chỉ tài khoản có vai trò `admin`, `nhanvien_tiepnhan`, `ktv`, `thungan`, `quanlykho` mới có thể truy cập.
  - **Cổng Khách Hàng (User):** Nằm riêng biệt trong thư mục `user/`. Chỉ tài khoản có vai trò `khachhang` mới truy cập được.
  - **Đăng ký tài khoản ngoài trang chủ:** Khách hàng **chỉ có thể đăng ký tài khoản Khách hàng**, hệ thống tự động khóa vai trò `khachhang`, hoàn toàn không thể tự ý đăng ký làm Admin.

---

### 2. Cấu hình Firebase (Bắt buộc 1 lần duy nhất)
Mở file [js/firebase-config.js](file:///d:/Downloads/WebsiteQuanLyBaoHanh/js/firebase-config.js) và thay thế cấu hình bằng thông tin dự án Firebase của bạn:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

#### Các dịch vụ cần bật trên Firebase Console (https://console.firebase.google.com):
1. **Authentication:**
   - Vào menu **Authentication** &rarr; tab **Sign-in method** &rarr; Bật **Email/Password**.
2. **Firestore Database:**
   - Vào menu **Firestore Database** &rarr; Chọn **Create database** &rarr; Chọn chế độ **Start in test mode** (để đọc ghi dữ liệu thoải mái khi thử nghiệm).

---

### 3. Cấu trúc các trang và Chức năng theo 5 Sprints

#### A. Cổng Công Khai & Khách Vãng Lai:
1. `index.html`: Trang đăng nhập thông minh. Nhập email/mật khẩu, hệ thống tự động phân loại: nếu là Admin/KTV chuyển ngay vào trang Quản trị, nếu là Khách hàng chuyển vào Cổng Khách hàng.
2. `register.html`: Đăng ký tài khoản Khách hàng (US.06, US.07).
3. `forgot-password.html`: Khôi phục mật khẩu qua Email (US.06).
4. `services.html`: Xem bảng giá dịch vụ sửa chữa và linh kiện PC/Laptop tham khảo cho khách vãng lai (US.04).
5. `tracking.html`: Tra cứu tiến độ phiếu sửa chữa bằng Ticket ID + Số điện thoại (US.14) hoặc quét mã QR bằng camera điện thoại/laptop (US.15).

#### B. Phân Hệ Quản Trị Hệ Thống (`admin/`):
1. `admin/dashboard.html`: Thống kê tổng quan phiếu trong ngày, đang xử lý, chờ linh kiện, hoàn thành.
2. `admin/services.html`: Quản lý danh mục Dịch vụ & Linh kiện (Thêm, Sửa, Xóa, Tìm kiếm, Khởi tạo dữ liệu mẫu) (US.01).
3. `admin/employees.html`: Quản lý danh sách nhân sự, phân quyền CSKH, KTV, Thu ngân, Thủ kho, Khóa/Mở khóa tài khoản, Nhập hàng loạt từ file Excel (US.02, US.03, US.11, US.12).
4. `admin/schedules.html`: Quản lý Lịch làm việc & Ca trực Sáng - Chiều - Tối của từng KTV theo tuần (US.13).
5. `admin/inventory.html`: Quản lý Kho vật tư, Nhập kho, Xuất kho tự động trừ tồn kho (US.26), Cảnh báo tồn kho tối thiểu (US.27), Đề xuất nhập linh kiện đặc thù từ KTV (US.28).
6. `admin/tickets.html`: Trung tâm tiếp nhận máy vãng lai (US.21), Tra cứu bảo hành gốc Serial/IMEI (US.22), Check-in tự cấp Ticket ID (US.20), Phân công KTV (US.18), KTV chẩn đoán (US.23), Lập báo giá linh kiện (US.24), Upload ảnh trước/sau sửa (US.30), Xác nhận thanh toán & Bàn giao máy (US.31), In phiếu biên nhận và hóa đơn (US.32).
7. `admin/reports.html`: Thống kê số lượng tiếp nhận PC vs Laptop (US.34), Năng suất KPI hoàn thành theo KTV (US.35), Tỷ lệ hủy/No-show (US.36), Báo cáo doanh thu & lợi nhuận tài chính, Xuất file Excel (US.37).

#### C. Phân Hệ Khách Hàng (`user/`):
1. `user/dashboard.html`: Tổng quan thiết bị, trạng thái sửa chữa, thông báo báo giá cần duyệt.
2. `user/profile.html`: Cập nhật thông tin cá nhân và Quản lý danh sách thiết bị PC/Laptop (US.08).
3. `user/new-request.html`: Đặt lịch hẹn mang máy đến cửa hàng & Gửi yêu cầu sửa chữa (US.09).
4. `user/my-tickets.html`: Xem tiến độ thời gian thực, Hủy lịch hẹn (US.10), **Đồng ý hoặc Từ chối báo giá sửa chữa của KTV** (US.25).
5. `user/history.html`: Tra cứu lịch sử bảo hành và các linh kiện đã từng thay thế qua các năm (US.16).
6. `user/notifications.html`: Hộp thư thông báo tức thời khi trạng thái phiếu thay đổi (US.17).
7. `user/reviews.html`: Đánh giá 1-5 sao và nhận xét chất lượng phục vụ sau khi nhận máy (US.33).

---

### 4. Cách chạy và Kiểm thử
Bạn có thể mở trực tiếp file `index.html` bằng trình duyệt (hoặc sử dụng Live Server trong VS Code / chạy local server):
- Đăng ký một tài khoản khách hàng mới tại `register.html` &rarr; kiểm tra đăng nhập &rarr; tự động vào `user/dashboard.html`.
- Tạo tài khoản Admin bằng cách đăng ký email có chữ `admin` (vd: `admin@techcare.vn`) hoặc phân quyền trong Firestore collection `users` với trường `role: "admin"` &rarr; đăng nhập &rarr; tự động vào `admin/dashboard.html`.
- Trên các trang Quản trị, có sẵn các nút **Khởi tạo mẫu nhanh (Seed)** để tạo dữ liệu dịch vụ, linh kiện, lịch trực, phiếu sửa chữa mẫu cho bạn kiểm thử toàn bộ tính năng một cách trực quan nhất.
