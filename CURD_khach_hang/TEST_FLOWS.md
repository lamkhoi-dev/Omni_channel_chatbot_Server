# 🧪 TEST FLOWS - CRM BIC HANOI

**Date:** November 27, 2025  
**Purpose:** Hướng dẫn test 7 flow nghiệp vụ để verify toàn bộ hệ thống CRM

---

## 📚 MỤC LỤC

- [Flow 1: Happy Path - Thành công toàn bộ](#flow-1-happy-path---thành-công-toàn-bộ)
- [Flow 2: Unhappy Path - Hủy lịch hẹn](#flow-2-unhappy-path---hủy-lịch-hẹn)
- [Flow 3: Churn Prediction - KH rời bỏ](#flow-3-churn-prediction---kh-rời-bỏ)
- [Flow 4: Churn Prediction - KH không tiềm năng](#flow-4-churn-prediction---kh-không-tiềm-năng)
- [Flow 5: Quản lý từ chối Hồ sơ](#flow-5-quản-lý-từ-chối-hồ-sơ)
- [Flow 6: Nhắc tái tục (Cron Job)](#flow-6-nhắc-tái-tục-cron-job)
- [Flow 7: RBAC - Phân quyền](#flow-7-rbac---phân-quyền)
- [Checklist Testing](#checklist-testing-tổng-hợp)

---

## 🎯 FLOW TEST 1: Happy Path - Thành công toàn bộ

**Mục tiêu:** Test luồng lý tưởng từ KH tiềm năng → Ký HĐ thành công (Bước 1-27)

### ✅ Các bước thực hiện:

#### **Bước 1: Login nhân viên**
```
Username: nhanvien1
Password: 123456
```
**Kỳ vọng:** Đăng nhập thành công, redirect đến Dashboard Nhân viên

---

#### **Bước 2: Tạo Khách hàng mới**
```
Vào menu: Khách hàng → Click "Thêm khách hàng"
Nhập:
  - Tên KH: Nguyễn Văn Test
  - Loại: Cá nhân
  - SĐT: 0987654321
  - Email: test@gmail.com
  - Địa chỉ: 123 Test Street, Hà Nội
  - Ghi chú: Khách hàng test flow 1
```

**Kỳ vọng:**
- ✅ `TrangThaiKhachHang = 'Tiềm năng'` (auto)
- ✅ `NgayTao = NOW()` (auto)
- ✅ Redirect về danh sách KH, thấy KH mới ở đầu bảng

---

#### **Bước 3: Tạo Cơ hội**
```
Vào menu: Cơ hội → Click "Tạo cơ hội"
Nhập:
  - Khách hàng: Nguyễn Văn Test (chọn từ dropdown)
  - Tên cơ hội: Bảo hiểm sức khỏe năm 2025
  - Giá trị: 20,000,000 VNĐ
  - Ghi chú: Test cơ hội thành công
```

**Kỳ vọng:**
- ✅ `CoHoi.TrangThaiCoHoi = 'Mới'` (auto)
- ✅ `KhachHang.TrangThaiKhachHang = 'Đang chăm sóc'` (auto update)
- ✅ Hiển thị trong danh sách Cơ hội với badge màu xanh "Mới"

---

#### **Bước 4: Tạo Lịch hẹn**
```
Vào menu: Lịch hẹn → Click "Tạo lịch hẹn"
Nhập:
  - Cơ hội: Bảo hiểm sức khỏe năm 2025
  - Thời gian: Ngày mai 14:00 (chọn datetime picker)
  - Địa điểm: Văn phòng BIC Láng Hạ
  - Nội dung: Tư vấn gói bảo hiểm sức khỏe toàn diện
```

**Kỳ vọng:**
- ✅ `LichHen.TrangThaiLichHen = 'Sắp diễn ra'` (auto)
- ✅ `CoHoi.TrangThaiCoHoi = 'Chờ xử lý'` (auto update)
- ✅ Hiển thị trong "Lịch hẹn hôm nay" nếu chọn hôm nay
- ✅ **Thông báo realtime (Socket.IO):** Badge đỏ ở icon chuông +1

---

#### **Bước 5: Hoàn thành lịch hẹn THÀNH CÔNG**
```
Vào menu: Lịch hẹn → Tìm lịch vừa tạo
Click nút "Hoàn thành" (icon ✓)
Modal hiện lên:
  - Chọn radio: "Thành công"
  - Nhập kết quả: "KH đồng ý mua, cần bổ sung hồ sơ CMND và giấy khám sức khỏe"
  - Click "Xác nhận"
```

**Kỳ vọng:**
- ✅ `LichHen.TrangThaiLichHen = 'Hoàn thành'`
- ✅ `LichHen.KetQuaSauCuocHen = "KH đồng ý mua..."`
- ✅ Cột **"Kết quả"** trong bảng hiển thị text "KH đồng ý mua..."
- ✅ Badge chuyển sang màu xanh "Hoàn thành"

---

#### **Bước 6: Upload Hồ sơ**
```
Vào menu: Hồ sơ → Click "Tạo hồ sơ"
Nhập:
  - Cơ hội: Bảo hiểm sức khỏe năm 2025
  - Tên hồ sơ: Hồ sơ sức khỏe - Nguyễn Văn Test
  - Upload file: Chọn file PDF (test.pdf)
  - Ghi chú: Bao gồm CMND + giấy khám sức khỏe
```

**Kỳ vọng:**
- ✅ `HoSo.TrangThaiHoSo = 'Chờ duyệt'` (auto)
- ✅ `HoSo.NgayUpload = NOW()` (auto)
- ✅ File được lưu vào `backend/uploads/hoso/[timestamp]-test.pdf`
- ✅ Hiển thị trong danh sách với badge vàng "Chờ duyệt"

---

#### **Bước 7: Login Quản lý để duyệt**
```
Logout nhanvien1 → Login manager1
  Username: manager1
  Password: 123456

Vào menu: Quản lý → Tab "Hồ sơ chờ duyệt"
Tìm hồ sơ: "Hồ sơ sức khỏe - Nguyễn Văn Test"
Click nút "Duyệt" (icon ✓)
```

**Kỳ vọng:**
- ✅ `HoSo.TrangThaiHoSo = 'Đã duyệt'`
- ✅ `HoSo.NgayDuyet = NOW()` (auto)
- ✅ Badge chuyển sang màu xanh "Đã duyệt"
- ✅ **Socket.IO notification:** `nhanvien1` nhận thông báo "Hồ sơ ... đã được duyệt"

---

#### **Bước 8: Upload Hợp đồng**
```
Logout manager1 → Login lại nhanvien1

Vào menu: Hợp đồng → Click "Tạo hợp đồng"
Nhập:
  - Hồ sơ: Hồ sơ sức khỏe - Nguyễn Văn Test (dropdown chỉ hiện hồ sơ "Đã duyệt")
  - Mã hợp đồng: BIC-HN-2025-TEST001
  - Ngày hiệu lực: 01/12/2024
  - Ngày hết hạn: 01/12/2025
  - Giá trị: 20,000,000 VNĐ
  - Upload file: Chọn file PDF (hopdong.pdf)
```

**Kỳ vọng:**
- ✅ Hợp đồng được tạo thành công
- ✅ `CoHoi.TrangThaiCoHoi = 'Thành công'` (auto update)
- ✅ `KhachHang.TrangThaiKhachHang = 'Thành công'` (auto update)
- ✅ File lưu vào `backend/uploads/hopdong/[timestamp]-hopdong.pdf`

---

#### **Bước 9: Kiểm tra Báo cáo**
```
Logout nhanvien1 → Login admin
  Username: admin
  Password: 123456

Vào menu: Báo cáo
Kiểm tra:
  1. Tab "Doanh thu": Thấy +20,000,000 VNĐ tháng 12/2024
  2. Tab "KPI": 
     - Cơ hội thành công: +1
     - Doanh thu: +20M
  3. Tab "Top nhân viên": 
     - nhanvien1 (Lê Minh Cường) dẫn đầu với 20M
```

**Kỳ vọng:**
- ✅ Biểu đồ doanh thu hiển thị spike tháng 12
- ✅ Bảng KPI hiển thị đúng số liệu
- ✅ Top nhân viên xếp hạng đúng

---

## 🔴 FLOW TEST 2: Unhappy Path - Hủy lịch hẹn

**Mục tiêu:** Test logic chuyển trạng thái khi KH không đến hẹn (Bước 7-9)

### ✅ Các bước thực hiện:

#### **Bước 1-3: Tạo KH + Cơ hội + Lịch hẹn**
```
(Giống Flow 1 bước 1-4)
- Tạo KH: Trần Thị Hủy Hẹn
- Tạo Cơ hội: Bảo hiểm du lịch
- Tạo Lịch hẹn: Ngày mai 10:00
```

---

#### **Bước 4: Hủy lịch hẹn**
```
Vào menu: Lịch hẹn → Tìm lịch vừa tạo
Click nút "Hủy" (icon ✗)
Modal hiện lên:
  - Nhập lý do: "KH bận đột xuất, xin dời lịch"
  - Click "Xác nhận"
```

**Kỳ vọng:**
- ✅ `LichHen.TrangThaiLichHen = 'Hủy'`
- ✅ `LichHen.GhiChu = "KH bận đột xuất..."`
- ✅ `CoHoi.TrangThaiCoHoi = 'Thất bại'` (auto update)
- ✅ Badge chuyển sang màu đỏ "Hủy"

---

#### **Bước 5: Verify KH vẫn "Đang chăm sóc"**
```
Vào menu: Khách hàng → Tìm "Trần Thị Hủy Hẹn"
```

**Kỳ vọng:**
- ✅ `TrangThaiKhachHang = 'Đang chăm sóc'` (KHÔNG tự động chuyển)
- ✅ Lý do: Chưa có đánh giá churn prediction (vì chưa hoàn thành cuộc hẹn)

---

## 🟠 FLOW TEST 3: Churn Prediction - KH rời bỏ

**Mục tiêu:** Test logic "KH đã từng mua nhưng HĐ hết hạn → Rời bỏ" (Bước 12-13 CASE 1)

### ✅ Setup (Sử dụng data có sẵn từ seed.sql):

Khách hàng: **Lê Thị Mai** (ID=4) - Đã có hợp đồng `BIC-HN-2024-002` hết hạn `2025-02-19`

---

#### **Bước 1: Tạo Cơ hội tái tục**
```
Login: nhanvien2 (Phạm Thu Dung)

Vào menu: Cơ hội → Click "Tạo cơ hội"
Nhập:
  - Khách hàng: Lê Thị Mai
  - Tên cơ hội: Tái tục bảo hiểm ung thư 2025
  - Giá trị: 35,000,000 VNĐ
  - Ghi chú: Tái tục hợp đồng cũ BIC-HN-2024-002
```

---

#### **Bước 2: Tạo lịch hẹn**
```
Vào menu: Lịch hẹn → Click "Tạo lịch hẹn"
Nhập:
  - Cơ hội: Tái tục bảo hiểm ung thư 2025
  - Thời gian: Ngày mai 15:00
  - Địa điểm: Quán cafe Highlands
  - Nội dung: Tư vấn tái tục hợp đồng
```

---

#### **Bước 3: Hoàn thành lịch hẹn THẤT BẠI**
```
Vào menu: Lịch hẹn → Click "Hoàn thành"
Modal:
  - Chọn radio: "Không thành công"
  - Nhập kết quả: "KH không quan tâm tái tục, đã tìm đơn vị khác"
  - Click "Xác nhận"
```

**Kỳ vọng (Churn Prediction Logic):**
- ✅ `LichHen.TrangThaiLichHen = 'Hoàn thành'`
- ✅ `CoHoi.TrangThaiCoHoi = 'Thất bại'`
- ✅ **CHURN LOGIC CASE 1:**
  ```sql
  -- Backend check:
  1. KH có HopDong nào không? → YES (BIC-HN-2024-002)
  2. Tất cả HopDong đã hết hạn? → YES (NgayHetHan < NOW())
  3. AUTO UPDATE: KhachHang.TrangThaiKhachHang = 'Rời bỏ'
  ```

---

#### **Bước 4: Verify trong Khách hàng**
```
Vào menu: Khách hàng → Lọc "Rời bỏ"
```

**Kỳ vọng:**
- ✅ Thấy **Lê Thị Mai** trong danh sách
- ✅ Badge màu đỏ "Rời bỏ"

---

## 🟡 FLOW TEST 4: Churn Prediction - KH không tiềm năng

**Mục tiêu:** Test logic "KH chưa từng mua + không còn cơ hội → Không tiềm năng" (Bước 13 CASE 2)

### ✅ Các bước thực hiện:

#### **Bước 1: Tạo KH mới chưa từng có HĐ**
```
Login: nhanvien3 (Hoàng Văn Em)

Vào menu: Khách hàng → Click "Thêm khách hàng"
Nhập:
  - Tên: Trần Thị Chưa Mua
  - Loại: Cá nhân
  - SĐT: 0999888777
  - Email: chuamua@test.com
```

---

#### **Bước 2: Tạo Cơ hội**
```
Vào menu: Cơ hội → Click "Tạo cơ hội"
Nhập:
  - Khách hàng: Trần Thị Chưa Mua
  - Tên cơ hội: Bảo hiểm xe máy
  - Giá trị: 3,000,000 VNĐ
```

---

#### **Bước 3: Tạo Lịch hẹn → Hoàn thành THẤT BẠI**
```
Tạo lịch hẹn → Click "Hoàn thành"
Modal:
  - Chọn: "Không thành công"
  - Kết quả: "KH không quan tâm bảo hiểm"
```

**Kỳ vọng (Churn Prediction Logic):**
- ✅ **CHURN LOGIC CASE 2:**
  ```sql
  -- Backend check:
  1. KH có HopDong nào không? → NO
  2. Còn CoHoi nào 'Mới' hoặc 'Chờ xử lý'? → NO (tất cả Thất bại)
  3. AUTO UPDATE: KhachHang.TrangThaiKhachHang = 'Không tiềm năng'
  ```

---

#### **Bước 4: Verify**
```
Vào menu: Khách hàng → Lọc "Không tiềm năng"
```

**Kỳ vọng:**
- ✅ Thấy **Trần Thị Chưa Mua**
- ✅ Badge màu xám "Không tiềm năng"

---

## 🔵 FLOW TEST 5: Quản lý từ chối Hồ sơ

**Mục tiêu:** Test luồng "Hồ sơ sai → Yêu cầu bổ sung" (Bước 20-21)

### ✅ Các bước thực hiện:

#### **Bước 1: Upload Hồ sơ (nhanvien1)**
```
(Giống Flow 1 bước 6)
- Tạo KH + Cơ hội + Upload hồ sơ
- Tên hồ sơ: Hồ sơ test từ chối
```

---

#### **Bước 2: Login manager1 → Từ chối Hồ sơ**
```
Login: manager1

Vào menu: Quản lý → Tab "Hồ sơ chờ duyệt"
Tìm: "Hồ sơ test từ chối"
Click nút "Từ chối" (icon ✗)
Modal:
  - Lý do: "Thiếu giấy CMND, ảnh không rõ. Cần bổ sung"
  - Click "Xác nhận"
```

**Kỳ vọng:**
- ✅ `HoSo.TrangThaiHoSo = 'Bổ sung'`
- ✅ `HoSo.GhiChu = "Thiếu giấy CMND..."`
- ✅ Badge chuyển sang màu vàng "Bổ sung"
- ✅ **Socket.IO:** `nhanvien1` nhận thông báo "Hồ sơ cần bổ sung"

---

#### **Bước 3: Login lại nhanvien1 → Re-upload**
```
Login: nhanvien1

Vào menu: Hồ sơ → Tìm "Hồ sơ test từ chối"
Click "Chỉnh sửa"
  - Upload file mới: test-updated.pdf
  - Ghi chú: Đã bổ sung CMND rõ nét
  - Click "Cập nhật"
```

**Kỳ vọng:**
- ✅ `HoSo.TrangThaiHoSo = 'Chờ duyệt'` (lại)
- ✅ `HoSo.FileHoSo` updated với file mới
- ✅ Badge chuyển lại màu vàng "Chờ duyệt"

---

#### **Bước 4: Manager duyệt lại → Thành công**
```
Login: manager1

Vào: Quản lý → Duyệt hồ sơ "Hồ sơ test từ chối"
```

**Kỳ vọng:**
- ✅ `HoSo.TrangThaiHoSo = 'Đã duyệt'`
- ✅ `HoSo.NgayDuyet = NOW()`

---

## 🟣 FLOW TEST 6: Nhắc tái tục (Cron Job)

**Mục tiêu:** Test Cron job + Socket.IO notification

### ✅ Setup:

Trong seed.sql đã có hợp đồng: `BIC-HN-2024-002` hết hạn `2025-02-19` (84 ngày nữa từ 27/11/2024)

Cần update để test:
```sql
-- Chạy trong MySQL:
UPDATE HopDong 
SET NgayHetHan = DATE_ADD(CURDATE(), INTERVAL 15 DAY)
WHERE MaHopDong = 'BIC-HN-2024-002';
```

---

### ✅ Test:

#### **Option 1: Chờ Cron job tự chạy (6:00 AM)**
```
Để backend chạy qua đêm
Sáng hôm sau 6:00 AM, Cron job sẽ tự trigger
```

#### **Option 2: Trigger manually (recommended)**
```bash
# Vào backend folder
cd backend

# Tạo file test-cron.js:
```

**File `backend/test-cron.js`:**
```javascript
require('dotenv').config();
const cron = require('node-cron');
const db = require('./config/db');

async function testCronJob() {
  try {
    console.log('🔄 Testing Cron Job: Check Expiring Contracts...');
    
    // Lấy HĐ sắp hết hạn (30 ngày)
    const [contracts] = await db.query(`
      SELECT hd.*, hs.ID_CoHoi, co.ID_NhanVien, kh.TenKhachHang, kh.TenDoanhNghiep
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      WHERE hd.NgayHetHan BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `);

    console.log(`✅ Found ${contracts.length} expiring contracts`);

    for (let contract of contracts) {
      const customerName = contract.TenKhachHang || contract.TenDoanhNghiep;
      const message = `Hợp đồng ${contract.MaHopDong} của KH ${customerName} sẽ hết hạn vào ${new Date(contract.NgayHetHan).toLocaleDateString('vi-VN')}`;

      await db.query(
        `INSERT INTO ThongBao (ID_NhanVien, LoaiThongBao, NoiDung, TrangThai) 
         VALUES (?, 'Tái tục', ?, 'Chưa đọc')`,
        [contract.ID_NhanVien, message]
      );

      console.log(`📧 Notification sent to NV ${contract.ID_NhanVien}: ${message}`);
    }

    console.log('✅ Cron Job completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cron Job error:', error);
    process.exit(1);
  }
}

testCronJob();
```

**Chạy:**
```bash
node test-cron.js
```

---

### ✅ Kỳ vọng:

```
Console output:
🔄 Testing Cron Job: Check Expiring Contracts...
✅ Found 1 expiring contracts
📧 Notification sent to NV 4: Hợp đồng BIC-HN-2024-002 của KH Lê Thị Mai sẽ hết hạn vào 19/02/2025
✅ Cron Job completed successfully!
```

**Verify trong database:**
```sql
SELECT * FROM ThongBao WHERE LoaiThongBao = 'Tái tục' ORDER BY NgayTao DESC LIMIT 5;
```

**Kỳ vọng:**
- ✅ INSERT mới vào `ThongBao` với `LoaiThongBao='Tái tục'`
- ✅ Socket.IO emit 'notification' đến `nhanvien2` (ID=4)

---

### ✅ Test Frontend:

```
Login: nhanvien2

Kiểm tra:
1. Badge đỏ ở icon chuông (số thông báo chưa đọc)
2. Click vào icon chuông
3. Thấy thông báo: "Hợp đồng BIC-HN-2024-002 của KH Lê Thị Mai sẽ hết hạn..."
4. Click vào thông báo → Đánh dấu đã đọc
5. Badge giảm xuống
```

---

## 🎯 FLOW TEST 7: RBAC - Phân quyền

**Mục tiêu:** Test quyền hạn từng role

### 📋 Ma trận phân quyền:

| Action                          | nhanvien1 (ID=3) | manager1 (ID=2) | admin (ID=1) |
|---------------------------------|------------------|-----------------|--------------|
| View KH của người khác          | ❌ 403           | ✅ 200          | ✅ 200       |
| Edit KH của người khác          | ❌ 403           | ✅ 200          | ✅ 200       |
| Delete KH của người khác        | ❌ 403           | ✅ 200          | ✅ 200       |
| Duyệt hồ sơ                     | ❌ 403           | ✅ 200          | ✅ 200       |
| Tạo nhân viên mới               | ❌ 403           | ✅ 200          | ✅ 200       |
| Xem báo cáo Top NV              | ❌ 403           | ✅ 200          | ✅ 200       |
| Xem báo cáo Doanh thu           | ❌ 403           | ✅ 200          | ✅ 200       |
| View Cơ hội của người khác      | ❌ 403           | ✅ 200          | ✅ 200       |
| View Lịch hẹn của người khác    | ❌ 403           | ✅ 200          | ✅ 200       |

---

### ✅ Test Cases:

#### **Test 1: Nhân viên xem KH của người khác**
```
Login: nhanvien1

Vào: Khách hàng
Lọc tất cả: Chỉ thấy KH của nhanvien1 (ID=3)
- ✅ Thấy: Nguyễn Thị Lan, Trần Văn Hùng, Công ty ABC
- ❌ KHÔNG thấy: Lê Thị Mai, Phạm Đức Thắng (của nhanvien2)
```

**Backend API Test:**
```bash
# Get token của nhanvien1
curl -X GET http://localhost:5000/api/khachhang/4 \
  -H "Authorization: Bearer <token_nhanvien1>"

# Expected: 403 Forbidden
{
  "success": false,
  "message": "Bạn không có quyền xem khách hàng này"
}
```

---

#### **Test 2: Quản lý xem toàn bộ KH**
```
Login: manager1

Vào: Khách hàng
Lọc tất cả: Thấy TẤT CẢ 8 khách hàng (của cả 3 nhân viên)
```

**Backend API Test:**
```bash
curl -X GET http://localhost:5000/api/khachhang/4 \
  -H "Authorization: Bearer <token_manager1>"

# Expected: 200 OK
{
  "success": true,
  "data": {
    "ID": 4,
    "TenKhachHang": "Lê Thị Mai",
    ...
  }
}
```

---

#### **Test 3: Nhân viên duyệt hồ sơ**
```
Login: nhanvien1

Vào: Quản lý
→ Kỳ vọng: KHÔNG có menu "Quản lý" trong sidebar
```

**Backend API Test:**
```bash
curl -X POST http://localhost:5000/api/quanly/hoso/3/duyet \
  -H "Authorization: Bearer <token_nhanvien1>"

# Expected: 403 Forbidden
{
  "success": false,
  "message": "Chỉ Quản lý và Ban giám đốc mới có quyền duyệt hồ sơ"
}
```

---

#### **Test 4: Quản lý duyệt hồ sơ**
```
Login: manager1

Vào: Quản lý → Tab "Hồ sơ chờ duyệt"
Click "Duyệt" → ✅ Success
```

---

#### **Test 5: Nhân viên xem Báo cáo**
```
Login: nhanvien1

Vào: Menu
→ Kỳ vọng: KHÔNG có menu "Báo cáo"
```

**Backend API Test:**
```bash
curl -X GET http://localhost:5000/api/baocao/doanhthu \
  -H "Authorization: Bearer <token_nhanvien1>"

# Expected: 403 Forbidden
```

---

#### **Test 6: Admin xem mọi thứ**
```
Login: admin

Vào: Tất cả menu (Dashboard, KH, Cơ hội, Lịch hẹn, Hồ sơ, HĐ, Quản lý, Báo cáo)
→ Kỳ vọng: ✅ Xem được toàn bộ data
```

---

### ✅ Automation Test Script (Optional):

**File `backend/test-rbac.js`:**
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function login(username, password) {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password });
  return res.data.data.token;
}

async function testRBAC() {
  console.log('🔐 Testing RBAC...\n');

  // Get tokens
  const tokenNV1 = await login('nhanvien1', '123456');
  const tokenManager = await login('manager1', '123456');

  // Test 1: NV xem KH của người khác
  try {
    await axios.get(`${API_URL}/khachhang/4`, {
      headers: { Authorization: `Bearer ${tokenNV1}` }
    });
    console.log('❌ FAIL: NV should not see other KH');
  } catch (err) {
    if (err.response.status === 403) {
      console.log('✅ PASS: NV cannot see other KH (403)');
    }
  }

  // Test 2: Manager xem KH của người khác
  try {
    const res = await axios.get(`${API_URL}/khachhang/4`, {
      headers: { Authorization: `Bearer ${tokenManager}` }
    });
    if (res.status === 200) {
      console.log('✅ PASS: Manager can see all KH (200)');
    }
  } catch (err) {
    console.log('❌ FAIL: Manager should see all KH');
  }

  // Test 3: NV duyệt hồ sơ
  try {
    await axios.post(`${API_URL}/quanly/hoso/3/duyet`, {}, {
      headers: { Authorization: `Bearer ${tokenNV1}` }
    });
    console.log('❌ FAIL: NV should not approve hồ sơ');
  } catch (err) {
    if (err.response.status === 403) {
      console.log('✅ PASS: NV cannot approve hồ sơ (403)');
    }
  }

  console.log('\n✅ RBAC Testing completed!');
}

testRBAC().catch(console.error);
```

**Chạy:**
```bash
npm install axios
node test-rbac.js
```

---

## 📋 CHECKLIST TESTING TỔNG HỢP

### ✅ Functional Tests

- [ ] **Flow 1: Happy Path (1-27)** - Thành công toàn bộ
  - [ ] Tạo KH → Trạng thái "Tiềm năng"
  - [ ] Tạo Cơ hội → KH chuyển "Đang chăm sóc"
  - [ ] Tạo Lịch hẹn → Cơ hội chuyển "Chờ xử lý"
  - [ ] Hoàn thành lịch hẹn thành công → Kết quả hiển thị
  - [ ] Upload hồ sơ → Trạng thái "Chờ duyệt"
  - [ ] Quản lý duyệt → Trạng thái "Đã duyệt" + notification
  - [ ] Tạo hợp đồng → Cơ hội + KH chuyển "Thành công"
  - [ ] Báo cáo cập nhật doanh thu + KPI

- [ ] **Flow 2: Unhappy Path** - Hủy lịch hẹn
  - [ ] Hủy lịch hẹn → Cơ hội chuyển "Thất bại"
  - [ ] KH vẫn "Đang chăm sóc" (không auto chuyển)

- [ ] **Flow 3: Churn CASE 1** - KH rời bỏ
  - [ ] KH cũ có HĐ hết hạn + cơ hội thất bại → "Rời bỏ"
  - [ ] Logic check HopDong expiration hoạt động

- [ ] **Flow 4: Churn CASE 2** - KH không tiềm năng
  - [ ] KH mới chưa mua + không còn cơ hội → "Không tiềm năng"
  - [ ] Logic check CoHoi còn active hoạt động

- [ ] **Flow 5: Từ chối hồ sơ**
  - [ ] Quản lý từ chối → Trạng thái "Bổ sung"
  - [ ] Nhân viên re-upload → Trạng thái "Chờ duyệt" lại
  - [ ] Quản lý duyệt lần 2 → "Đã duyệt"

- [ ] **Flow 6: Cron Job tái tục**
  - [ ] Cron job tìm HĐ sắp hết hạn (30 ngày)
  - [ ] Tạo thông báo tự động
  - [ ] Socket.IO notification realtime

- [ ] **Flow 7: RBAC**
  - [ ] Nhân viên chỉ xem data của mình (403 với data khác)
  - [ ] Quản lý xem toàn bộ data (200)
  - [ ] Admin full access
  - [ ] Nhân viên không duyệt hồ sơ (403)
  - [ ] Nhân viên không xem báo cáo (403)

### ✅ UI/UX Tests

- [ ] Dashboard hiển thị đúng KPI realtime
- [ ] Notification badge cập nhật realtime (Socket.IO)
- [ ] File upload hiển thị progress bar
- [ ] Form validation hiển thị error message
- [ ] Modal đóng sau khi submit thành công
- [ ] Table pagination hoạt động
- [ ] Filter/Search hoạt động
- [ ] Responsive design (mobile/tablet)

### ✅ Data Integrity Tests

- [ ] Không cho phép xóa KH có Cơ hội
- [ ] Không cho phép xóa Cơ hội có Hồ sơ
- [ ] Không cho phép xóa Hồ sơ có Hợp đồng
- [ ] Upload file sai định dạng → 400 Bad Request
- [ ] Upload file > 10MB → 413 Payload Too Large
- [ ] Ngày hết hạn < Ngày hiệu lực → Validation error

### ✅ Performance Tests

- [ ] Dashboard load < 3s với 1000+ records
- [ ] API response time < 500ms (query có index)
- [ ] File upload 5MB < 10s
- [ ] Socket.IO notification latency < 100ms

### ✅ Security Tests

- [ ] JWT token expires sau 24h
- [ ] Refresh token rotation
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize input)
- [ ] CORS whitelist
- [ ] File upload validation (mime type + extension)
- [ ] Rate limiting (100 req/15min)

---

## 🛠 TOOLS HỖ TRỢ TEST

### 1. **Postman Collection**
```
File: CRM_BIC_API.postman_collection.json
Import vào Postman để test API
```

**Các endpoint cần test:**
- POST `/api/auth/login`
- GET `/api/khachhang`
- POST `/api/khachhang`
- PUT `/api/khachhang/:id`
- GET `/api/cohoi`
- POST `/api/lichhen`
- PUT `/api/lichhen/:id/complete`
- POST `/api/hoso` (multipart/form-data)
- POST `/api/quanly/hoso/:id/duyet`
- GET `/api/baocao/doanhthu`

---

### 2. **MySQL Workbench**

**Queries hữu ích:**

```sql
-- 1. Kiểm tra trạng thái KH sau mỗi action
SELECT ID, TenKhachHang, TrangThaiKhachHang, NgayTao 
FROM KhachHang 
ORDER BY NgayTao DESC 
LIMIT 10;

-- 2. Kiểm tra logic chuyển trạng thái Cơ hội
SELECT co.ID, co.TenCoHoi, co.TrangThaiCoHoi, kh.TrangThaiKhachHang
FROM CoHoi co
JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
ORDER BY co.NgayTao DESC;

-- 3. Kiểm tra Churn Prediction CASE 1 (Rời bỏ)
SELECT kh.ID, kh.TenKhachHang, kh.TrangThaiKhachHang,
       COUNT(hd.ID) as SoHopDong,
       MAX(hd.NgayHetHan) as HopDongMoiNhat
FROM KhachHang kh
LEFT JOIN CoHoi co ON kh.ID = co.ID_KhachHang
LEFT JOIN HoSo hs ON co.ID = hs.ID_CoHoi
LEFT JOIN HopDong hd ON hs.ID = hd.ID_HoSo
GROUP BY kh.ID
HAVING MAX(hd.NgayHetHan) < CURDATE();

-- 4. Kiểm tra Churn Prediction CASE 2 (Không tiềm năng)
SELECT kh.ID, kh.TenKhachHang, kh.TrangThaiKhachHang,
       COUNT(co.ID) as SoCoHoi,
       SUM(CASE WHEN co.TrangThaiCoHoi IN ('Mới', 'Chờ xử lý') THEN 1 ELSE 0 END) as CoHoiActive
FROM KhachHang kh
LEFT JOIN CoHoi co ON kh.ID = co.ID_KhachHang
LEFT JOIN HoSo hs ON co.ID = hs.ID_CoHoi
LEFT JOIN HopDong hd ON hs.ID = hd.ID_HoSo
WHERE hd.ID IS NULL
GROUP BY kh.ID
HAVING CoHoiActive = 0;

-- 5. Kiểm tra HĐ sắp hết hạn (Cron job)
SELECT hd.MaHopDong, hd.NgayHetHan, 
       DATEDIFF(hd.NgayHetHan, CURDATE()) as SoNgayConLai,
       kh.TenKhachHang, nv.TenNhanVien
FROM HopDong hd
JOIN HoSo hs ON hd.ID_HoSo = hs.ID
JOIN CoHoi co ON hs.ID_CoHoi = co.ID
JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
WHERE hd.NgayHetHan BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);

-- 6. Kiểm tra thông báo realtime
SELECT * FROM ThongBao 
WHERE NgayTao >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY NgayTao DESC;

-- 7. Verify file uploads
SELECT ID, TenHoSo, FileHoSo, TrangThaiHoSo, NgayUpload, NgayDuyet
FROM HoSo
ORDER BY NgayUpload DESC;

-- 8. Kiểm tra KPI nhân viên
SELECT nv.TenNhanVien,
       COUNT(DISTINCT kh.ID) as TongKH,
       COUNT(DISTINCT CASE WHEN co.TrangThaiCoHoi = 'Thành công' THEN co.ID END) as CoHoiThanhCong,
       SUM(CASE WHEN co.TrangThaiCoHoi = 'Thành công' THEN hd.GiaTri ELSE 0 END) as TongDoanhThu
FROM NhanVien nv
LEFT JOIN KhachHang kh ON nv.ID = kh.ID_NhanVien
LEFT JOIN CoHoi co ON kh.ID = co.ID_KhachHang
LEFT JOIN HoSo hs ON co.ID = hs.ID_CoHoi
LEFT JOIN HopDong hd ON hs.ID = hd.ID_HoSo
WHERE nv.ID_Role = 1
GROUP BY nv.ID
ORDER BY TongDoanhThu DESC;
```

---

### 3. **Browser DevTools**

#### **Network Tab:**
```
1. Mở F12 → Network
2. Thực hiện action (create KH, upload file, etc.)
3. Kiểm tra:
   - Status code: 200, 201, 400, 403, 500
   - Response time: < 500ms
   - Payload size
   - Headers: Authorization Bearer token
```

#### **Application Tab:**
```
1. Local Storage:
   - Kiểm tra JWT token lưu đúng key
   - Token format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
2. Session Storage:
   - User info (userId, role, username)
```

#### **Console Tab:**
```
1. Check Socket.IO connection:
   socket.on('connect', () => console.log('Connected'))
2. Log notification events:
   socket.on('notification', (data) => console.log(data))
3. Check errors: No red errors in console
```

---

### 4. **React DevTools**

```
1. Install extension: React Developer Tools (Chrome/Firefox)
2. Mở F12 → Components tab
3. Inspect state:
   - AuthStore: user, token, isAuthenticated
   - QueryClient: cached data (khachhang, cohoi, lichhen)
4. Inspect props:
   - Dashboard: KPI data
   - LichHen: appointments, today's appointments
```

---

### 5. **Logs Monitoring**

#### **Backend Console:**
```bash
cd backend
npm run dev

# Watch for:
✅ Socket.IO connection: "New client connected: <socket_id>"
✅ API calls: "POST /api/khachhang 201 - 45ms"
✅ Cron job: "Cron job running: Check expiring contracts"
❌ Errors: "Error creating customer: ..."
```

#### **Frontend Console:**
```bash
cd frontend
npm run dev

# Watch for:
✅ API success: "Customer created successfully"
✅ Socket events: "Notification received: ..."
❌ Errors: "Failed to fetch customers"
```

---

## 🚀 QUICK START TESTING

### **Bước 1: Import seed data**
```bash
mysql -u root -p crm_bic < backend/seed.sql
```

### **Bước 2: Start servers**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### **Bước 3: Begin testing**
```
1. Mở browser: http://localhost:5173
2. Login: nhanvien1 / 123456
3. Bắt đầu Flow 1: Happy Path
4. Theo dõi từng bước trong doc này
5. Check off ✅ trong checklist
```

---

## 📞 TROUBLESHOOTING

### **Lỗi thường gặp:**

#### **1. Login failed - Wrong password**
```
❌ Error: "Sai tên đăng nhập hoặc mật khẩu"
✅ Fix: Kiểm tra password hash trong database
       SELECT Username, MatKhau FROM NhanVien;
       Hash phải là: $2a$10$yFoYdBEOa/FWHMJKgyuWquFUxvWAltp68mwy4NoV7JUBkZ3bMxCem
```

#### **2. 500 Error - SQL syntax**
```
❌ Error: "Unknown column 'NgayKyKet'"
✅ Fix: Đã fix tất cả queries dùng NgayHieuLuc/NgayHetHan
       Restart backend server
```

#### **3. 403 Forbidden - RBAC**
```
❌ Error: "Bạn không có quyền xem khách hàng này"
✅ Fix: Đúng! Nhân viên chỉ xem data của mình
       Login manager1 để xem toàn bộ
```

#### **4. File upload failed**
```
❌ Error: "File upload error"
✅ Fix: 
   1. Check folder exists: backend/uploads/hoso/
   2. Check file size < 10MB
   3. Check file type: .pdf, .jpg, .png, .doc, .docx
```

#### **5. Notification không hiện**
```
❌ Socket.IO connection failed
✅ Fix:
   1. Check backend: io.on('connection') log
   2. Check frontend: socket.on('connect') log
   3. Check CORS: origin: 'http://localhost:5173'
```

---

## 📊 TEST REPORT TEMPLATE

**File: `TEST_REPORT_[DATE].md`**

```markdown
# TEST REPORT - CRM BIC HANOI
Date: 27/11/2024
Tester: [Your Name]

## Summary
- Total Tests: 50
- Passed: 48 ✅
- Failed: 2 ❌
- Skipped: 0

## Flow Results

### Flow 1: Happy Path ✅
- [x] Tạo KH
- [x] Tạo Cơ hội
- [x] Tạo Lịch hẹn
- [x] Hoàn thành lịch hẹn
- [x] Upload hồ sơ
- [x] Duyệt hồ sơ
- [x] Tạo hợp đồng
- [x] Báo cáo cập nhật

### Flow 2: Unhappy Path ✅
- [x] Hủy lịch hẹn
- [x] Cơ hội chuyển "Thất bại"

### Flow 3: Churn CASE 1 ❌
- [x] Tạo cơ hội tái tục
- [ ] KH chuyển "Rời bỏ" (Bug: Logic không chạy)

### Flow 4: Churn CASE 2 ✅
- [x] KH chuyển "Không tiềm năng"

### Flow 5: Từ chối hồ sơ ✅
- [x] Từ chối
- [x] Re-upload
- [x] Duyệt lại

### Flow 6: Cron Job ❌
- [ ] Cron job không chạy (Fix: Check cron syntax)

### Flow 7: RBAC ✅
- [x] NV 403 với data khác
- [x] Manager 200 toàn bộ
- [x] Admin full access

## Bugs Found
1. **Churn CASE 1 logic không hoạt động**
   - File: lichhenController.js line 390
   - Fix: Add SQL query check HopDong expiration

2. **Cron job không chạy**
   - File: server.js
   - Fix: Uncomment cron schedule

## Performance
- Dashboard load time: 1.2s ✅
- API response time: 320ms avg ✅
- File upload 5MB: 6s ✅

## Recommendations
1. Add unit tests với Jest
2. Add E2E tests với Playwright
3. Add CI/CD với GitHub Actions
```

---

**🎉 HAPPY TESTING! 🚀**
