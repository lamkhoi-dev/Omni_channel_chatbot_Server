# 🚀 HƯỚNG DẪN CHẠY VÀ TEST ỨNG DỤNG CRM BIC HÀ NỘI

## ✅ YÊU CẦU HỆ THỐNG

- **Node.js**: v18+ (kiểm tra: `node -v`)
- **MySQL**: v8.0+ (kiểm tra: `mysql --version`)
- **NPM**: v9+ (kiểm tra: `npm -v`)

---

## 📦 BƯỚC 1: CÀI ĐẶT DATABASE

### Cách 1: Import Seed Data (KHUYẾN NGHỊ - Có sẵn data test)
```cmd
# Import seed.sql với data test đầy đủ
mysql -u root -p crm_bic < backend\seed.sql
```

**Kết quả:**
- ✅ 5 nhân viên (admin, manager1, nhanvien1, nhanvien2, nhanvien3)
- ✅ 8 khách hàng (mix cá nhân + doanh nghiệp, đủ 5 trạng thái)
- ✅ 8 cơ hội (từ Mới → Thành công/Thất bại)
- ✅ 12 lịch hẹn (có hẹn sắp tới, đã hoàn thành, hủy)
- ✅ 4 hồ sơ (đã duyệt, chờ duyệt, cần bổ sung)
- ✅ 2 hợp đồng (1 đang hiệu lực, 1 sắp hết hạn)
- ✅ **TẤT CẢ PASSWORD: `123456`**

### Cách 2: Setup tự động (Database trống + 3 tài khoản cơ bản)
```cmd
cd backend
node setup-database.js
```

**Kết quả:**
- ✅ 3 tài khoản: admin, nhanvien1, quanly1
- ✅ **TẤT CẢ PASSWORD: `123456`**

---

## 🔐 TÀI KHOẢN ĐĂNG NHẬP

### ⚠️ **Password cho TẤT CẢ tài khoản: `123456`**

**Nếu dùng seed.sql:**
| Username | Password | Role | Dữ liệu |
|----------|----------|------|---------|
| admin | 123456 | Ban giám đốc | Xem tất cả |
| manager1 | 123456 | Quản lý | Xem tất cả + Duyệt hồ sơ |
| nhanvien1 | 123456 | Nhân viên | Lê Minh Cường - 3 KH, 3 cơ hội |
| nhanvien2 | 123456 | Nhân viên | Phạm Thu Dung - 3 KH, 3 cơ hội |
| nhanvien3 | 123456 | Nhân viên | Hoàng Văn Em - 2 KH, 2 cơ hội |

**Nếu dùng setup-database.js:**
| Username | Password | Role |
|----------|----------|------|
| admin | 123456 | Ban giám đốc |
| nhanvien1 | 123456 | Nhân viên |
| quanly1 | 123456 | Quản lý |
  'Hoạt động'
);

-- Tạo quản lý test (username: quanly1, password: quanly123)
INSERT INTO NhanVien (ID_Role, TenNhanVien, CCCD, Email, Username, MatKhau, TrangThaiNhanVien) 
VALUES (
  2, 
  'Trần Thị B', 
  '001234567892', 
  'quanly1@bic.vn', 
  'quanly1', 
  '$2a$10$qJZ3Z3Z3Z3Z3Z3Z3Z3Z3ZuXxGJZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z',
  'Hoạt động'
);
```

**⚠️ LƯU Ý:** Mật khẩu mã hóa trên là giả. Cần chạy script `setup-database.js` để tạo tài khoản thật.

---

## 📦 BƯỚC 2: SETUP BACKEND
---

## 📦 BƯỚC 2: SETUP BACKEND

### 2.1. Cài đặt Dependencies
```cmd
cd backend
npm install
```

### 2.2. Kiểm tra file .env
Tạo file `.env` trong thư mục `backend` nếu chưa có:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crm_bic
JWT_SECRET=crm_bic_hanoi_2024_super_secret_key_32_chars_minimum_length
PORT=5000
NODE_ENV=development
```

### 2.3. Khởi động Backend Server
```cmd
npm run dev
```

**✅ Backend chạy thành công khi thấy:**
```
🚀 Server running on port 5000
✅ MySQL Connected
⏰ Cron job: Contract renewal check scheduled at 6:00 AM daily
```

**🌐 Test API:**
```cmd
curl http://localhost:5000/api/auth/login
```

---

## 📦 BƯỚC 3: SETUP FRONTEND

### 3.1. Mở terminal mới (GIỮ backend đang chạy)
```cmd
cd frontend
```

### 3.2. Cài đặt Dependencies
```cmd
npm install
```

### 3.3. Khởi động Frontend
```cmd
npm run dev
```

**✅ Frontend chạy thành công khi thấy:**
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3.4. Mở trình duyệt
```
http://localhost:5173
```

---

## 🧪 BƯỚC 4: TEST CHỨC NĂNG

### 4.1. Test Đăng nhập

**Login với Admin:**
- Username: `admin`
- Password: `admin123`
- ✅ Kiểm tra: Redirect về Dashboard, sidebar hiển thị đầy đủ 9 menu

**Login với Nhân viên:**
- Username: `nhanvien1`
- Password: `nhanvien123`
- ✅ Kiểm tra: Không hiển thị menu "Quản lý"

**Login với Quản lý:**
- Username: `quanly1`
- Password: `quanly123`
- ✅ Kiểm tra: Hiển thị menu "Quản lý", có quyền duyệt hồ sơ

---

### 4.2. Test Module KHÁCH HÀNG

**Bước 1: Tạo Khách hàng Cá nhân**
1. Vào menu **Khách hàng** → Nút **Thêm Khách hàng**
2. Điền:
   - Tên KH: `Nguyễn Văn Tuấn`
   - Loại: `Cá nhân`
   - SĐT: `0987654321`
   - Email: `tuan@gmail.com`
   - Địa chỉ: `123 Láng Hạ, Đống Đa, Hà Nội`
3. Nhấn **Lưu**
4. ✅ Kiểm tra:
   - KH xuất hiện trong bảng
   - Trạng thái: **Tiềm năng** (màu vàng)
   - Badge hiển thị đúng

**Bước 2: Tạo Khách hàng Doanh nghiệp**
1. Nhấn **Thêm Khách hàng**
2. Điền:
   - Loại: `Doanh nghiệp`
   - Tên DN: `Công ty TNHH ABC`
   - SĐT: `0243123456`
   - Email: `abc@company.vn`
3. Nhấn **Lưu**
4. ✅ Kiểm tra: DN xuất hiện với badge "Doanh nghiệp"

**Bước 3: Test Filters**
- Tìm kiếm: Nhập `Tuấn` → Chỉ hiển thị KH có tên Tuấn
- Lọc Trạng thái: Chọn `Tiềm năng` → Chỉ hiển thị KH tiềm năng
- Lọc Loại: Chọn `Doanh nghiệp` → Chỉ hiển thị DN

**Bước 4: Test Sửa/Xóa**
- Nhấn **Edit** → Sửa SĐT → Lưu → ✅ Cập nhật thành công
- Nhấn **Delete** → Confirm → ✅ Xóa khỏi danh sách

---

### 4.3. Test Module CƠ HỘI (State Machine)

**Bước 1: Tạo Cơ hội Mới**
1. Vào menu **Cơ hội** → **Thêm Cơ hội**
2. Điền:
   - Khách hàng: Chọn `Nguyễn Văn Tuấn`
   - Tên cơ hội: `Bảo hiểm sức khỏe gia đình`
   - Giá trị: `50000000` (50 triệu)
3. Nhấn **Lưu**
4. ✅ Kiểm tra:
   - Cơ hội xuất hiện với trạng thái **Mới** (màu xanh)
   - KH `Nguyễn Văn Tuấn` tự động chuyển sang **Đang chăm sóc**

**Bước 2: Test State Machine - Chuyển trạng thái**
1. Tại cơ hội vừa tạo → Nhấn **Cập nhật trạng thái**
2. ✅ Kiểm tra dropdown chỉ hiển thị:
   - `Chờ xử lý`
   - `Thất bại`
   - KHÔNG hiển thị `Thành công` (vì chưa qua Chờ xử lý)
3. Chọn `Chờ xử lý` → Lưu
4. ✅ Kiểm tra: Badge chuyển sang màu vàng

**Bước 3: Test Invalid Transition**
1. Nhấn **Cập nhật trạng thái** lại
2. ✅ Kiểm tra dropdown chỉ có:
   - `Thành công`
   - `Thất bại`
   - KHÔNG có `Mới` (không cho quay lại)

**Bước 4: Chuyển sang Thành công**
- Chọn `Thành công` → Lưu → ✅ Badge màu xanh lá

---

### 4.4. Test Module LỊCH HẸN

**Bước 1: Tạo Lịch hẹn Hôm nay**
1. Vào menu **Lịch hẹn** → **Thêm Lịch hẹn**
2. Điền:
   - Cơ hội: Chọn cơ hội vừa tạo
   - Thời gian: Chọn **hôm nay** (27/11/2025), giờ 14:00
   - Địa điểm: `Văn phòng BIC Hà Nội`
   - Nội dung: `Tư vấn gói bảo hiểm`
3. Nhấn **Lưu**
4. ✅ Kiểm tra:
   - Lịch hẹn xuất hiện trong **Lịch hẹn hôm nay** (phần highlight)
   - Trạng thái: `Sắp diễn ra`

**Bước 2: Hoàn thành Lịch hẹn Thành công**
1. Tại lịch hẹn vừa tạo → Nhấn **Hoàn thành**
2. Trong modal:
   - Kết quả: Chọn **Thành công**
   - Ghi chú: `KH đồng ý mua gói Premium`
3. Nhấn **Lưu**
4. ✅ Kiểm tra:
   - Trạng thái: `Hoàn thành`
   - Hiển thị kết quả đúng

**Bước 3: Test Hủy Lịch hẹn**
1. Tạo lịch hẹn mới
2. Nhấn **Hủy** → Lý do: `KH bận`
3. ✅ Kiểm tra: Trạng thái `Hủy`, Cơ hội chuyển sang `Thất bại`

---

### 4.5. Test Module HỒ SƠ (File Upload)

**Bước 1: Upload Hồ sơ**
1. Vào menu **Hồ sơ** → **Upload Hồ sơ**
2. Điền:
   - Cơ hội: Chọn cơ hội `Chờ xử lý` hoặc `Mới`
   - Tên hồ sơ: `Hồ sơ bảo hiểm Nguyễn Văn Tuấn`
   - File: Chọn file PDF/JPG (< 5MB)
3. Nhấn **Upload**
4. ✅ Kiểm tra:
   - Hồ sơ xuất hiện với trạng thái `Chờ duyệt`

**Bước 2: Duyệt Hồ sơ (Quản lý/Admin)**
1. Logout → Login lại với `quanly1` / `quanly123`
2. Vào **Hồ sơ** → Tìm hồ sơ `Chờ duyệt`
3. Nhấn **Duyệt** → Confirm
4. ✅ Kiểm tra:
   - Trạng thái: `Đã duyệt`
   - **Thông báo realtime** xuất hiện (icon chuông header)

**Bước 3: Từ chối Hồ sơ**
1. Upload hồ sơ mới
2. Nhấn **Từ chối** → Lý do: `Thiếu CMND`
3. ✅ Kiểm tra: Trạng thái `Bổ sung`, có ghi chú

**Bước 4: Download Hồ sơ**
- Nhấn **Download** → ✅ File tải về đúng

---

### 4.6. Test Module HỢP ĐỒNG

**Bước 1: Tạo Hợp đồng (Validation)**
1. Vào menu **Hợp đồng** → **Thêm Hợp đồng**
2. Chọn Hồ sơ có trạng thái `Chờ duyệt`
3. ✅ Kiểm tra: Hiển thị lỗi **"Hồ sơ chưa được duyệt"**

**Bước 2: Tạo Hợp đồng hợp lệ**
1. Chọn Hồ sơ `Đã duyệt`
2. Điền:
   - Mã HĐ: `HD2025001`
   - Ngày hiệu lực: `01/12/2025`
   - Ngày hết hạn: `01/12/2026`
   - Giá trị: `50000000`
   - File: Upload PDF hợp đồng
3. Nhấn **Lưu**
4. ✅ Kiểm tra:
   - HĐ được tạo thành công
   - **Cơ hội tự động chuyển sang `Thành công`**
   - **KH tự động chuyển sang `Thành công`**

**Bước 3: Kiểm tra Cascade Update**
- Vào module **Cơ hội** → ✅ Trạng thái `Thành công` (xanh lá)
- Vào module **Khách hàng** → ✅ Trạng thái `Thành công` (xanh lá)

---

### 4.7. Test Module BÁO CÁO

**Bước 1: Xem Biểu đồ Doanh thu**
1. Vào menu **Báo cáo**
2. Chọn khoảng thời gian: `01/11/2025` - `30/11/2025`
3. ✅ Kiểm tra:
   - Biểu đồ cột hiển thị doanh thu theo tháng (Recharts)
   - Dữ liệu từ HĐ vừa tạo xuất hiện

**Bước 2: Xem KPI**
1. Cuộn xuống phần **KPI cá nhân**
2. ✅ Kiểm tra:
   - Số KH mới: X/10 (progress bar)
   - Cơ hội thành công: X/5
   - Doanh thu: X/100,000,000 VNĐ
   - % completion hiển thị đúng

**Bước 3: Top Nhân viên**
1. Xem bảng **Top 10 Nhân viên**
2. ✅ Kiểm tra: Sắp xếp theo doanh thu giảm dần

**Bước 4: Export Excel (Optional)**
- Nhấn **Xuất Excel** → ✅ File .xlsx tải về

---

### 4.8. Test Module QUẢN LÝ (Admin/Quản lý)

**Bước 1: Quản lý Nhân viên**
1. Login với `admin` / `admin123`
2. Vào menu **Quản lý** → Tab **Nhân viên**
3. Nhấn **Thêm Nhân viên**
4. Điền:
   - Tên: `Lê Văn C`
   - Username: `nhanvien2`
   - Password: `123456`
   - Email: `nhanvien2@bic.vn`
   - Role: `Nhân viên`
5. Nhấn **Lưu**
6. ✅ Kiểm tra: NV mới xuất hiện

**Bước 2: Khóa Tài khoản**
- Nhấn **Khóa** tại nhân viên vừa tạo
- Logout → Thử login `nhanvien2` → ✅ Lỗi "Tài khoản bị khóa"

**Bước 3: Hồ sơ Chờ duyệt**
1. Tab **Hồ sơ Chờ duyệt**
2. ✅ Kiểm tra: Chỉ hiển thị hồ sơ có trạng thái `Chờ duyệt`

**Bước 4: Lịch hẹn Quá hạn**
1. Tab **Lịch hẹn Quá hạn**
2. ✅ Kiểm tra: Hiển thị lịch hẹn quá thời gian nhưng chưa xử lý

---

### 4.9. Test Module THÔNG BÁO (Realtime)

**Bước 1: Test Thông báo Lịch hẹn**
1. Mở 2 tab trình duyệt:
   - Tab 1: Login `nhanvien1`
   - Tab 2: Login `quanly1`
2. Tab 2 (Quản lý): Tạo lịch hẹn giao cho `nhanvien1`
3. ✅ Kiểm tra Tab 1:
   - **Icon chuông header hiển thị badge đỏ**
   - Click vào → Dropdown hiển thị thông báo mới
   - Nội dung: "Bạn có lịch hẹn mới..."

**Bước 2: Test Thông báo Duyệt hồ sơ**
1. Tab 1 (NV): Upload hồ sơ
2. Tab 2 (QL): Duyệt hồ sơ
3. ✅ Kiểm tra Tab 1: Thông báo "Hồ sơ đã được duyệt"

**Bước 3: Test Đánh dấu Đã đọc**
1. Vào menu **Thông báo**
2. Click vào thông báo `Chưa đọc` (màu xanh highlight)
3. ✅ Kiểm tra: Chuyển sang `Đã đọc` (không highlight)
4. Nhấn **Đánh dấu tất cả đã đọc**
5. ✅ Kiểm tra: Tất cả chuyển sang đã đọc

**Bước 4: Test Filter Thông báo**
- Tab **Tất cả**: Hiển thị cả đã đọc + chưa đọc
- Tab **Chưa đọc**: Chỉ hiển thị chưa đọc
- Tab **Đã đọc**: Chỉ hiển thị đã đọc

---

### 4.10. Test CRON JOB Tái tục (6:00 AM)

**Cách 1: Test thủ công**
```cmd
# Trong backend, mở file server.js
# Tìm dòng: cron.schedule('0 6 * * *', async () => {
# Sửa thành: cron.schedule('* * * * *', async () => {  // Chạy mỗi phút
# Restart backend
```

**Cách 2: Tạo HĐ hết hạn trong 30 ngày**
1. Tạo Hợp đồng mới
2. Ngày hết hạn: `15/12/2025` (< 30 ngày từ hôm nay)
3. Đợi 6:00 AM ngày mai
4. ✅ Kiểm tra:
   - Thông báo tái tục xuất hiện
   - Nội dung: "Hợp đồng HD2025001 sẽ hết hạn vào 15/12/2025"

---

## 🐛 TROUBLESHOOTING

### Lỗi 1: "Cannot connect to database"
**Giải pháp:**
```cmd
# Kiểm tra MySQL đang chạy
net start MySQL80

# Test kết nối
mysql -u root -p210506 -e "SELECT 1"

# Kiểm tra .env
type backend\.env
```

### Lỗi 2: "Port 5000 already in use"
**Giải pháp:**
```cmd
# Tìm process đang dùng port 5000
netstat -ano | findstr :5000

# Kill process (thay PID)
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
PORT=5001
```

### Lỗi 3: "JWT token expired"
**Giải pháp:**
- Logout và login lại
- Xóa localStorage: `F12` → Console → `localStorage.clear()`

### Lỗi 4: "File upload failed"
**Giải pháp:**
```cmd
# Tạo thư mục uploads
cd backend
mkdir uploads\hoso
mkdir uploads\hopdong

# Kiểm tra quyền ghi
icacls uploads /grant Everyone:F
```

### Lỗi 5: "Socket.IO not connecting"
**Giải pháp:**
- Kiểm tra CORS trong `backend/server.js`:
```javascript
const io = socketIO(server, {
  cors: {origin: 'http://localhost:5173'}
});
```
- Kiểm tra token hợp lệ (F12 → Network → WS)

### Lỗi 6: Frontend không build
**Giải pháp:**
```cmd
cd frontend
# Xóa node_modules
rmdir /s /q node_modules
# Cài lại
npm install
```

---

## ✅ CHECKLIST HOÀN CHỈNH

### Backend
- [x] MySQL running và database `crm_bic` tồn tại
- [x] File `.env` đúng cấu hình
- [x] `npm install` không lỗi
- [x] `node setup-database.js` tạo admin thành công
- [x] `npm run dev` chạy port 5000
- [x] Thư mục `uploads/hoso` và `uploads/hopdong` tồn tại
- [x] Socket.IO kết nối thành công

### Frontend
- [x] `npm install` không lỗi (đặc biệt `date-fns`, `recharts`)
- [x] `npm run dev` chạy port 5173
- [x] Login thành công với admin
- [x] Socket.IO realtime hoạt động
- [x] Tất cả 9 menu hiển thị (với admin)

### Features
- [x] CRUD Khách hàng (tìm kiếm, filter, phân trang)
- [x] State machine Cơ hội (chỉ cho chuyển trạng thái hợp lệ)
- [x] Lịch hẹn hôm nay (highlight, hoàn thành/hủy)
- [x] Upload/Download hồ sơ (duyệt/từ chối)
- [x] Tạo Hợp đồng (validate hồ sơ đã duyệt, cascade update)
- [x] Biểu đồ báo cáo (Recharts, KPI progress bar)
- [x] Quản lý nhân viên (thêm/khóa, pending queue)
- [x] Thông báo realtime (Socket.IO, đánh dấu đã đọc)
- [x] Cron job tái tục (chạy 6:00 AM)

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi test xong, anh sẽ có:

1. **Database** với:
   - 3+ Khách hàng (Cá nhân + Doanh nghiệp)
   - 2+ Cơ hội (trạng thái khác nhau)
   - 3+ Lịch hẹn (hôm nay, hoàn thành, hủy)
   - 2+ Hồ sơ (đã duyệt, chờ duyệt)
   - 1+ Hợp đồng

2. **Kiểm chứng Business Logic:**
   - ✅ Tạo Cơ hội → KH chuyển "Đang chăm sóc"
   - ✅ Tạo Lịch hẹn → Cơ hội "Chờ xử lý"
   - ✅ Hủy Lịch hẹn → Cơ hội "Thất bại"
   - ✅ Tạo Hợp đồng → Cơ hội + KH "Thành công"
   - ✅ State machine không cho chuyển sai (Mới → Thành công ❌)

3. **Kiểm chứng Realtime:**
   - ✅ Duyệt hồ sơ → Thông báo ngay lập tức
   - ✅ Tạo lịch hẹn → Icon chuông cập nhật

4. **Kiểm chứng Authorization:**
   - ✅ Nhân viên không thấy menu "Quản lý"
   - ✅ Chỉ Quản lý mới duyệt được hồ sơ
   - ✅ NV chỉ thấy KH của mình

---

## 📞 HỖ TRỢ

Nếu gặp lỗi không có trong Troubleshooting:

1. **Check Backend logs** (terminal backend)
2. **Check Browser Console** (F12 → Console)
3. **Check Network tab** (F12 → Network → XHR/Fetch)
4. **Check MySQL logs**: `SHOW PROCESSLIST;`

---

**Chúc anh test thành công! 🚀**

_Tài liệu này bao gồm 100% tính năng theo PROJECT_DOCUMENTATION.md_



database.sql, setup-database.js, seed.sql
