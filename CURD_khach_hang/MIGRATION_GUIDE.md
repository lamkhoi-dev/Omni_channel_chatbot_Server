# Hướng Dẫn Cập Nhật Thông Tin Khách Hàng

## Thay đổi cấu trúc dữ liệu

### Các trường mới đã thêm:

#### Cho Cá nhân:
- **CCCD** (VARCHAR 20): Số căn cước công dân
- **NgaySinh** (DATE): Ngày sinh

#### Cho Doanh nghiệp:
- **MaSoThue** (VARCHAR 20): Mã số thuế doanh nghiệp  
- **NgayThanhLap** (DATE): Ngày thành lập doanh nghiệp

## Cách chạy migration

### Cách 1: Chạy file migration tự động
```bash
cd backend
node run-migration.js
```

### Cách 2: Chạy SQL thủ công
```bash
# Kết nối MySQL
mysql -u root -p crm_bic

# Chạy file SQL
source backend/migration-update-khachhang.sql
```

## Cập nhật frontend

### Form thêm/sửa khách hàng (`KhachHang.jsx`):
- Form tự động hiển thị các trường phù hợp dựa trên **Loại khách hàng**
- Khi chọn "Cá nhân" → hiện CCCD và Ngày sinh
- Khi chọn "Doanh nghiệp" → hiện Mã số thuế và Ngày thành lập

### Trang chi tiết khách hàng (`KhachHangDetail.jsx`):
- Hiển thị thông tin CCCD, Ngày sinh (nếu là Cá nhân)
- Hiển thị Mã số thuế, Ngày thành lập (nếu là Doanh nghiệp)
- Thông tin liên hệ (SĐT, Email, Địa chỉ) hiển thị cho cả hai loại

## Cập nhật backend

### `khachhangController.js`:
- **create()**: Thêm xử lý các trường CCCD, NgaySinh, MaSoThue, NgayThanhLap
- **update()**: Cho phép cập nhật các trường mới
- **getAll(), getById()**: Tự động lấy các trường mới từ database

## Validation

### Frontend:
- CCCD và Mã số thuế giới hạn 20 ký tự
- Ngày sinh và Ngày thành lập sử dụng input type="date"
- Các trường này không bắt buộc (optional)

### Backend:
- Chấp nhận giá trị NULL cho tất cả các trường mới
- Không có validation bắt buộc (vì thông tin có thể bổ sung sau)

## Kiểm tra cấu trúc database

```sql
DESCRIBE KhachHang;
```

Kết quả sẽ hiển thị:
```
TenKhachHang      VARCHAR(100)
CCCD              VARCHAR(20)     -- MỚI
NgaySinh          DATE            -- MỚI
TenDoanhNghiep    VARCHAR(200)
MaSoThue          VARCHAR(20)     -- MỚI
NgayThanhLap      DATE            -- MỚI
...
```

## Lưu ý quan trọng

1. **Backup database** trước khi chạy migration:
   ```bash
   mysqldump -u root -p crm_bic > backup.sql
   ```

2. **Kiểm tra kết nối**: Đảm bảo file `.env` có cấu hình đúng:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=crm_bic
   ```

3. **Restart server** sau khi migration:
   ```bash
   # Stop backend
   Ctrl+C
   
   # Start lại
   npm start
   ```

4. **Xóa cache frontend** (nếu cần):
   ```bash
   cd frontend
   npm run dev
   ```

## Kiểm tra hoạt động

### Test tạo khách hàng Cá nhân:
1. Vào trang Khách hàng
2. Click "Thêm khách hàng"
3. Chọn "Cá nhân"
4. Nhập: Tên, CCCD, Ngày sinh, SĐT, Email, Địa chỉ
5. Lưu và kiểm tra

### Test tạo khách hàng Doanh nghiệp:
1. Vào trang Khách hàng
2. Click "Thêm khách hàng"
3. Chọn "Doanh nghiệp"
4. Nhập: Tên DN, Mã số thuế, Ngày thành lập, SĐT, Email, Địa chỉ
5. Lưu và kiểm tra

### Test hiển thị chi tiết:
1. Click vào biểu tượng 👁️ (Eye) ở bất kỳ khách hàng nào
2. Kiểm tra thông tin hiển thị đúng theo loại khách hàng
3. Các trường mới phải xuất hiện nếu có dữ liệu

## Rollback (nếu cần)

Nếu có lỗi, chạy lệnh sau để xóa các cột mới:
```sql
ALTER TABLE KhachHang 
DROP COLUMN CCCD,
DROP COLUMN NgaySinh,
DROP COLUMN MaSoThue,
DROP COLUMN NgayThanhLap;

DROP INDEX idx_cccd ON KhachHang;
DROP INDEX idx_mst ON KhachHang;
```

## Hoàn thành ✅

Migration đã chạy thành công! Các trường mới đã được thêm vào database và frontend đã được cập nhật để hiển thị và xử lý chúng.
