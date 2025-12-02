# 🚀 HƯỚNG DẪN SETUP DATABASE CRM BIC HÀ NỘI

## Tổng quan

File **`setup-complete-database.js`** là giải pháp **ALL-IN-ONE** để khởi tạo toàn bộ database từ đầu, bao gồm:

✅ Tạo database `crm_bic`  
✅ Tạo 8 bảng chính với đầy đủ quan hệ  
✅ **Migration**: Thêm các trường mới (CCCD, NgaySinh, MaSoThue, NgayThanhLap)  
✅ **Seed data**: 5 nhân viên, 8 khách hàng, 8 cơ hội, 12 lịch hẹn, 4 hồ sơ, 2 hợp đồng, 6 thông báo

## Yêu cầu trước khi chạy

1. **MySQL Server** đang chạy (localhost:3306)
2. **Node.js** và **npm** đã cài đặt
3. File **`.env`** đã cấu hình đúng:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_bic
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
```

## Cách sử dụng

### 🎯 Cách 1: Chạy trực tiếp (Khuyến nghị)

```bash
cd backend
node setup-complete-database.js
```

**Kết quả:**
- Xóa database cũ (nếu có)
- Tạo database mới với đầy đủ cấu trúc
- Import dữ liệu mẫu
- Hiển thị thống kê và tài khoản test

### 🎯 Cách 2: Thêm vào package.json

Thêm script vào `package.json`:

```json
"scripts": {
  "setup": "node setup-complete-database.js",
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Chạy:
```bash
npm run setup
```

## Cấu trúc Database

### Bảng chính (8 bảng)

```
Role ──┐
       │
       ├──> NhanVien ──┬──> KhachHang ──> CoHoi ──┬──> LichHen
                       │                           │
                       │                           ├──> HoSo ──> HopDong
                       │                           │
                       └──────────────────────────┘
                                  │
                                  └──> ThongBao
```

### Các trường MỚI trong KhachHang

| Trường | Kiểu | Áp dụng cho | Mô tả |
|--------|------|-------------|-------|
| `CCCD` | VARCHAR(20) | Cá nhân | Số căn cước công dân |
| `NgaySinh` | DATE | Cá nhân | Ngày sinh |
| `MaSoThue` | VARCHAR(20) | Doanh nghiệp | Mã số thuế DN |
| `NgayThanhLap` | DATE | Doanh nghiệp | Ngày thành lập DN |

## Dữ liệu mẫu

### 👤 Tài khoản (5 người)

| Username | Password | Vai trò | Tên |
|----------|----------|---------|-----|
| `admin` | 123456 | Ban giám đốc | Nguyễn Văn An |
| `manager1` | 123456 | Quản lý | Trần Thị Bình |
| `nhanvien1` | 123456 | Nhân viên | Lê Minh Cường |
| `nhanvien2` | 123456 | Nhân viên | Phạm Thu Dung |
| `nhanvien3` | 123456 | Nhân viên | Hoàng Văn Em |

⚠️ **Mật khẩu mặc định: `123456`** (Nên đổi sau khi đăng nhập!)

### 👥 Khách hàng (8 khách)

**Cá nhân (5):**
- Nguyễn Thị Lan (CCCD: 001088234567, Sinh: 15/03/1985) - **Thành công**
- Trần Văn Hùng (CCCD: 001088345678, Sinh: 20/07/1990) - Đang chăm sóc
- Lê Thị Mai (CCCD: 001088456789, Sinh: 05/11/1988) - **Thành công**
- Phạm Đức Thắng (CCCD: 001088567890, Sinh: 14/02/1982) - Rời bỏ
- Vũ Minh Tuấn (CCCD: 001088678901, Sinh: 30/06/1995) - Tiềm năng

**Doanh nghiệp (3):**
- Công ty TNHH ABC (MST: 0123456789, TL: 10/05/2015) - Tiềm năng
- Siêu thị XYZ (MST: 0987654321, TL: 20/08/2010) - Đang chăm sóc
- Đỗ Thị Hương (Cá nhân) - Không tiềm năng

### 💼 Cơ hội (8 cơ hội)

- **Thành công (2)**: Bảo hiểm nhân thọ 20 năm (50 triệu), Bảo hiểm ung thư (30 triệu)
- **Chờ xử lý (2)**: Bảo hiểm ô tô (8.5 triệu), Bảo hiểm DN (85 triệu)
- **Mới (2)**: Bảo hiểm tập thể (120 triệu), Bảo hiểm du lịch (2 triệu)
- **Thất bại (2)**: Tái tục sức khỏe, Bảo hiểm sức khỏe

### 📅 Lịch hẹn (12 cuộc hẹn)

- **Hoàn thành (8)**: Các cuộc hẹn đã diễn ra
- **Sắp diễn ra (3)**: 
  - 02/12/2024 09:00 - Trần Văn Hùng
  - 03/12/2024 14:00 - Siêu thị XYZ
  - 05/12/2024 14:00 - Công ty ABC
- **Hủy (1)**: Gọi điện không nghe máy

### 📄 Hồ sơ & 📋 Hợp đồng

**Hồ sơ (4):**
- Đã duyệt (2): Nguyễn Thị Lan, Lê Thị Mai
- Chờ duyệt (1): Trần Văn Hùng
- Bổ sung (1): Siêu thị XYZ

**Hợp đồng (2):**
- BIC-HN-2024-001: 50 triệu, HSD đến 2044
- BIC-HN-2024-002: 30 triệu, **sắp hết hạn 19/02/2025** (để test tái tục)

## Kiểm tra kết quả

### Cách 1: MySQL CLI
```bash
mysql -u root -p
```

```sql
USE crm_bic;
SHOW TABLES;
SELECT * FROM NhanVien;
SELECT * FROM KhachHang;
DESCRIBE KhachHang;  -- Xem cấu trúc bảng
```

### Cách 2: MySQL Workbench / phpMyAdmin
- Kết nối đến localhost
- Chọn database `crm_bic`
- Xem các bảng và dữ liệu

## Test hệ thống

### 1. Test đăng nhập
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Truy cập: http://localhost:5173

### 2. Kịch bản test theo vai trò

#### 👨 Nhân viên (nhanvien1 / 123456)
- ✅ Xem 3 khách hàng của mình
- ✅ Xem 3 cơ hội đang phụ trách
- ✅ Có 2 lịch hẹn sắp tới (02/12 và 05/12)
- ✅ Có thông báo nhắc lịch hẹn

#### 👩 Nhân viên (nhanvien2 / 123456)
- ✅ Xem 3 khách hàng của mình
- ✅ Có thông báo tái tục hợp đồng (19/02/2025)
- ✅ Có hồ sơ chờ duyệt và cần bổ sung
- ✅ Có lịch hẹn ngày 03/12

#### 👔 Quản lý (manager1 / 123456)
- ✅ Xem tất cả 8 khách hàng
- ✅ Xem tất cả 8 cơ hội
- ✅ Duyệt hồ sơ chờ duyệt
- ✅ Xem báo cáo theo nhân viên
- ✅ Quản lý tài khoản nhân viên

#### 👑 Ban giám đốc (admin / 123456)
- ✅ Xem báo cáo tổng hợp toàn chi nhánh
- ✅ Xem KPI các nhân viên
- ✅ Xem dashboard tổng quan
- ⛔ Không có quyền chỉnh sửa dữ liệu

## Các file liên quan

```
backend/
├── setup-complete-database.js   ← FILE CHÍNH (Chạy 1 lần duy nhất)
├── database.sql                 ← Schema cũ (không cần dùng nữa)
├── seed.sql                     ← Seed cũ (không cần dùng nữa)
├── setup-database.js            ← Setup cũ (không cần dùng nữa)
├── migration-update-khachhang.sql ← Migration cũ (đã tích hợp)
└── run-migration.js             ← Script migration cũ (đã tích hợp)
```

## Troubleshooting

### ❌ Lỗi: Access denied for user 'root'@'localhost'

**Nguyên nhân:** Sai mật khẩu MySQL hoặc user không tồn tại

**Giải pháp:**
```bash
# Kiểm tra lại file .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_correct_password
```

### ❌ Lỗi: Cannot find module 'mysql2'

**Nguyên nhân:** Chưa cài đặt dependencies

**Giải pháp:**
```bash
cd backend
npm install
```

### ❌ Lỗi: Database 'crm_bic' already exists

**Nguyên nhân:** Database đã tồn tại từ trước

**Giải pháp:** Script tự động xóa database cũ. Nếu vẫn lỗi:
```sql
DROP DATABASE crm_bic;
```

### ❌ Lỗi: ER_NOT_SUPPORTED_AUTH_MODE

**Nguyên nhân:** MySQL 8.0 sử dụng authentication method mới

**Giải pháp:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## So sánh với cách cũ

### ❌ Cách CŨ (3 bước)
```bash
# Bước 1: Tạo schema
mysql -u root -p < database.sql

# Bước 2: Chạy migration
node run-migration.js

# Bước 3: Import seed data
mysql -u root -p crm_bic < seed.sql
```

### ✅ Cách MỚI (1 bước)
```bash
node setup-complete-database.js
```

## Lưu ý quan trọng

⚠️ **Script này sẽ XÓA toàn bộ dữ liệu cũ!**

✅ **Chỉ chạy khi:**
- Lần đầu setup hệ thống
- Cần reset lại database về trạng thái ban đầu
- Đang ở môi trường development/testing

⛔ **KHÔNG chạy trên production** nếu đã có dữ liệu thật!

## Backup & Restore

### Backup trước khi chạy
```bash
mysqldump -u root -p crm_bic > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore nếu cần
```bash
mysql -u root -p crm_bic < backup_20241201_143000.sql
```

## Câu hỏi thường gặp

**Q: Có cần chạy file này mỗi khi start server không?**  
A: KHÔNG. Chỉ chạy 1 lần khi setup ban đầu.

**Q: Làm sao để thêm dữ liệu mới sau khi setup?**  
A: Sử dụng giao diện web hoặc chạy các API endpoint để thêm dữ liệu.

**Q: Có thể thay đổi password mặc định không?**  
A: CÓ. Đăng nhập vào hệ thống và đổi password qua giao diện hoặc cập nhật trực tiếp trong database.

**Q: Làm sao để xóa dữ liệu mẫu nhưng giữ lại cấu trúc bảng?**  
A: Chạy:
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ThongBao;
TRUNCATE TABLE HopDong;
TRUNCATE TABLE HoSo;
TRUNCATE TABLE LichHen;
TRUNCATE TABLE CoHoi;
TRUNCATE TABLE KhachHang;
TRUNCATE TABLE NhanVien;
SET FOREIGN_KEY_CHECKS = 1;
```

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. MySQL Server đang chạy
2. File `.env` cấu hình đúng
3. Đã cài đặt `npm install`
4. Port 3306 không bị block bởi firewall

---

**Tác giả:** CRM BIC Team  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 01/12/2025
