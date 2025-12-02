# ROLE-BASED DASHBOARD - HƯỚNG DẪN SỬ DỤNG

## 🎨 Tổng quan

Hệ thống CRM giờ đã có **3 dashboard chuyên biệt** cho từng vai trò với:
- ✅ Nội dung tùy chỉnh theo nhu cầu công việc
- ✅ Màu sắc riêng biệt để dễ phân biệt
- ✅ Thứ tự menu tối ưu cho workflow
- ✅ Role badge hiển thị rõ ràng

---

## 🔵 NHÂN VIÊN (Role 1) - Màu XANH DƯƠNG

### Đặc điểm giao diện
- **Màu chủ đạo**: Xanh dương (#3B82F6)
- **Header gradient**: Xanh dương
- **Role badge**: Badge xanh "Nhân viên"

### Dashboard riêng: DashboardNhanVien.jsx
**Focus**: Quản lý công việc bán hàng cá nhân

**Widgets chính:**
1. **KPI Cards (4 cards)**
   - Khách hàng của tôi (màu xanh)
   - Cơ hội đang xử lý (màu xanh lá)
   - Lịch hẹn hôm nay (màu tím)
   - KPI tháng này - % hoàn thành (màu cam)

2. **KPI Progress Bar**
   - Tiến độ cơ hội thành công/target
   - Visual bar chart

3. **Lịch hẹn hôm nay** (Left panel)
   - Danh sách lịch hẹn trong ngày
   - Thời gian, địa điểm, nội dung
   - Border màu tím

4. **Cơ hội cần xử lý** (Right panel)
   - Cơ hội trạng thái "Mới" và "Chờ xử lý"
   - Giá trị cơ hội
   - Border màu xanh lá

### Thứ tự menu (ưu tiên workflow bán hàng)
1. 📊 Tổng quan
2. 📅 **Lịch hẹn** ← Priority
3. 👥 Khách hàng
4. 🎯 Cơ hội
5. 📄 Hồ sơ
6. ✅ Hợp đồng
7. 📈 KPI của tôi

---

## 🟠 QUẢN LÝ (Role 2) - Màu CAM

### Đặc điểm giao diện
- **Màu chủ đạo**: Cam (#F59E0B)
- **Header gradient**: Cam
- **Role badge**: Badge cam "Quản lý"
- **Background**: Gradient cam nhạt

### Dashboard riêng: DashboardQuanLy.jsx
**Focus**: Giám sát team và duyệt hồ sơ

**Widgets chính:**
1. **KPI Cards (4 cards)**
   - Tổng nhân viên (màu cam)
   - **Hồ sơ chờ duyệt** (màu đỏ, có highlight nếu > 0)
   - Cơ hội đang xử lý (màu vàng)
   - Doanh thu tháng (màu xanh lá)

2. **Hồ sơ chờ duyệt** (Left panel - PRIORITY)
   - Border cam đậm
   - Badge đếm số hồ sơ chờ
   - Nút "Duyệt" nhanh
   - Animation pulse nếu có hồ sơ mới

3. **Top Performers** (Right panel)
   - Bảng xếp hạng nhân viên
   - Medal icons (🥇🥈🥉)
   - Doanh thu + số hợp đồng

4. **Quick Actions**
   - 4 nút thao tác nhanh
   - Badge count cho actions cần xử lý

### Thứ tự menu (ưu tiên giám sát)
1. 📊 Tổng quan
2. ⚙️ **Quản lý** ← Priority (duyệt hồ sơ, quản lý NV)
3. 📈 Báo cáo
4. 👥 Khách hàng
5. 🎯 Cơ hội
6. 📅 Lịch hẹn
7. 📄 Hồ sơ
8. ✅ Hợp đồng

---

## 🔴 ADMIN/BAN GIÁM ĐỐC (Role 3) - Màu ĐỎ

### Đặc điểm giao diện
- **Màu chủ đạo**: Đỏ (#EF4444)
- **Header gradient**: Đỏ
- **Role badge**: Badge đỏ "Ban giám đốc"
- **Background**: Gradient đỏ-cam-vàng
- **Icon đặc biệt**: 👑 Crown

### Dashboard riêng: DashboardAdmin.jsx
**Focus**: Chiến lược và báo cáo tổng thể

**Widgets chính:**
1. **KPI Cards (4 cards) - Enhanced**
   - 💰 Tổng doanh thu (đỏ, có trend %)
   - 📄 Tổng hợp đồng (cam)
   - 👥 Nhân viên (xanh dương)
   - 🎯 Tỷ lệ chuyển đổi (xanh lá)

2. **Biểu đồ Doanh thu 6 tháng** (2/3 width)
   - Bar chart với Recharts
   - Hiển thị trend doanh thu
   - Border đỏ top

3. **Pie Chart Cơ hội** (1/3 width)
   - Phân bố cơ hội theo trạng thái
   - Multi-color pie
   - Border cam top

4. **Top 5 Nhân viên xuất sắc** (Left panel)
   - Gradient background vàng-cam
   - Medal với gradient
   - Chi tiết: Doanh thu + số HĐ + số KH

5. **KPI Overview** (Right panel)
   - 4 progress bars cho KPI tổng thể
   - Tỷ lệ chuyển đổi
   - Doanh thu vs target
   - Hợp đồng mới vs target
   - Khách hàng mới vs target

### Thứ tự menu (ưu tiên chiến lược)
1. 👑 **Dashboard BGĐ** ← Title đặc biệt
2. 📈 **Báo cáo** ← Top priority
3. ⚙️ Quản trị
4. ✅ Hợp đồng
5. 🎯 Cơ hội
6. 👥 Khách hàng
7. 📅 Lịch hẹn
8. 📄 Hồ sơ

---

## 🎨 Visual Indicators - Phân biệt Role

### 1. Header Gradient (Sidebar)
```
Nhân viên:  Blue gradient   (#3B82F6 → #2563EB)
Quản lý:    Orange gradient (#F59E0B → #EA580C)
Admin:      Red gradient    (#EF4444 → #DC2626)
```

### 2. Role Badge
**Vị trí**: 
- Sidebar bottom (user info)
- Header top (bên cạnh tên user)

**Styles**:
```
Nhân viên:  bg-blue-100 text-blue-700 border-blue-300
Quản lý:    bg-orange-100 text-orange-700 border-orange-300
Admin:      bg-red-100 text-red-700 border-red-300
```

### 3. Background Theme
```
Nhân viên:  bg-gray-50 (neutral)
Quản lý:    bg-gradient-to-br from-orange-50 to-yellow-50
Admin:      bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50
```

---

## 📋 Files Created/Modified

### New Files
1. **frontend/src/pages/DashboardNhanVien.jsx** (152 lines)
   - Dashboard chuyên cho nhân viên
   - Focus: KPI cá nhân, lịch hẹn, cơ hội

2. **frontend/src/pages/DashboardQuanLy.jsx** (186 lines)
   - Dashboard chuyên cho quản lý
   - Focus: Giám sát, duyệt hồ sơ, top performers

3. **frontend/src/pages/DashboardAdmin.jsx** (225 lines)
   - Dashboard chuyên cho BGĐ
   - Focus: Báo cáo tổng thể, biểu đồ, chiến lược
   - Uses: Recharts library

### Modified Files
1. **frontend/src/pages/Dashboard.jsx**
   - Thêm role-based routing
   - Switch case theo roleId
   - Import 3 dashboard components

2. **frontend/src/components/layout/DashboardLayout.jsx**
   - Thêm `getRoleStyles()` function
   - Gradient header theo role
   - Role badge ở 2 vị trí
   - Menu items riêng biệt cho từng role với `getMenuItems()`
   - Visual indicators (colors, borders)

---

## 🚀 Cách Test

### 1. Chạy setup-database.js (nếu chưa)
```bash
cd backend
node setup-database.js
```

Tạo 3 accounts:
- **admin** / admin123 (Role 3 - BGĐ)
- **nhanvien1** / nhanvien123 (Role 1 - Nhân viên)
- **quanly1** / quanly123 (Role 2 - Quản lý)

### 2. Restart backend
```bash
cd backend
npm run dev
```

### 3. Start frontend (nếu chưa chạy)
```bash
cd frontend
npm run dev
```

### 4. Test từng role

**Test Nhân viên:**
1. Login: nhanvien1 / nhanvien123
2. Kiểm tra:
   - ✅ Header gradient XANH
   - ✅ Badge "Nhân viên" màu xanh
   - ✅ Dashboard có: KPI cá nhân, Lịch hẹn hôm nay, Cơ hội cần xử lý
   - ✅ Menu: Lịch hẹn ở vị trí thứ 2 (priority)
   - ✅ KHÔNG thấy menu "Quản lý"

**Test Quản lý:**
1. Login: quanly1 / quanly123
2. Kiểm tra:
   - ✅ Header gradient CAM
   - ✅ Badge "Quản lý" màu cam
   - ✅ Dashboard có: Hồ sơ chờ duyệt (highlight), Top performers
   - ✅ Menu: "Quản lý" ở vị trí thứ 2 (priority)
   - ✅ Background gradient cam nhạt

**Test Admin:**
1. Login: admin / admin123
2. Kiểm tra:
   - ✅ Header gradient ĐỎ
   - ✅ Badge "Ban giám đốc" màu đỏ
   - ✅ Dashboard có: Biểu đồ doanh thu, Pie chart, Top 5 NV, KPI overview
   - ✅ Menu: "Dashboard BGĐ", "Báo cáo" ở top
   - ✅ Background gradient đỏ-cam-vàng
   - ✅ Icon Crown 👑

---

## 💡 Lợi ích của thiết kế mới

### 1. **User Experience**
- Dễ nhận biết đang dùng account nào
- Workflow tối ưu cho từng vai trò
- Thông tin ưu tiên hiển thị ngay

### 2. **Productivity**
- Nhân viên: Focus vào lịch hẹn và KPI
- Quản lý: Duyệt hồ sơ nhanh, giám sát team
- Admin: Nhìn overview toàn bộ hệ thống

### 3. **Visual Clarity**
- Màu sắc phân biệt rõ ràng
- Badge role hiển thị 2 nơi
- Gradient theme nhất quán

### 4. **Scalability**
- Dễ thêm widget mới cho từng role
- Logic menu tách biệt
- Component tái sử dụng (StatCard, KPIBar)

---

## 📊 Next Steps (Tùy chọn nâng cao)

1. **Fetch real data cho dashboards**
   - Kết nối API thực tế
   - Replace mock data

2. **Add more charts**
   - Line chart cho trend
   - Radar chart cho KPI comparison

3. **Interactive filters**
   - Date range picker
   - Dropdown filter theo nhân viên

4. **Export reports**
   - PDF/Excel export
   - Scheduled reports

5. **Real-time updates**
   - Socket.IO cho dashboard realtime
   - Auto-refresh stats

---

**Version**: 1.0  
**Last Updated**: November 27, 2025  
**Dependencies**: recharts ^2.x  
**Tested**: ✅ All 3 roles working
