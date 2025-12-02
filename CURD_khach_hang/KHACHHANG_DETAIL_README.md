# 🚀 QUICKSTART - Trang Chi tiết Khách hàng

## ✅ Tính năng đã hoàn thành

Đã thêm **Trang Chi tiết Khách hàng** với layout 2 cột:
- **Cột trái**: Card thông tin khách hàng
- **Cột phải**: Tabs hiển thị Cơ hội, Lịch hẹn, Hồ sơ, Hợp đồng

## 📋 Các file đã tạo/sửa

### Frontend
1. ✅ **`frontend/src/pages/KhachHangDetail.jsx`** (MỚI)
   - Layout 2 cột responsive
   - Card thông tin KH với avatar, status badge
   - 4 tabs với table + pagination
   - Navigation back button

2. ✅ **`frontend/src/App.jsx`**
   - Thêm route: `/khachhang/:id`
   - Import component KhachHangDetail

3. ✅ **`frontend/src/pages/KhachHang.jsx`**
   - Thêm nút "Xem chi tiết" (icon Eye)
   - Navigate đến `/khachhang/:id`

### Backend
4. ✅ **`backend/controllers/lichhenController.js`**
   - Thêm filter `khachhangId` vào API getAll

5. ✅ **`backend/controllers/hosoController.js`**
   - Thêm filter `khachhangId` vào API getAll

6. ✅ **`backend/controllers/hopdongController.js`**
   - Thêm filter `khachhangId` vào API getAll

## 🎨 Thiết kế UI

### Cột Trái - Thông tin Khách hàng
```
┌─────────────────────────┐
│   [Avatar Icon]         │
│   Tên Khách hàng        │
│   [Status Badge]        │
│   Cá nhân/Doanh nghiệp  │
├─────────────────────────┤
│ Mã KH: KH001            │
│ Nhân viên: Nguyễn Văn A │
├─────────────────────────┤
│ 📞 SĐT: 0123456789      │
│ 📧 Email: email@...     │
│ 📍 Địa chỉ: Hà Nội      │
│ 📅 Ngày tạo: 01/01/2024 │
├─────────────────────────┤
│ [Chỉnh sửa thông tin]   │
└─────────────────────────┘
```

### Cột Phải - Tabs
```
┌────────────────────────────────────────┐
│ [Cơ hội 5] [Lịch hẹn 3] [Hồ sơ 2] ... │
├────────────────────────────────────────┤
│ STT | Tên | Giá trị | Trạng thái | ...│
│  1  | ... | 100M    | Mới        | [✏]│
│  2  | ... | 50M     | Chờ xử lý  | [✏]│
├────────────────────────────────────────┤
│ [←] [1] [2] [3] [...] [→]              │
└────────────────────────────────────────┘
```

## 🔗 API Endpoints sử dụng

### 1. GET /api/khachhang/:id
**Response:**
```json
{
  "success": true,
  "data": {
    "ID": 1,
    "TenKhachHang": "Nguyễn Văn A",
    "TrangThaiKhachHang": "Đang chăm sóc",
    "LoaiKhachHang": "Cá nhân",
    "SoDienThoai": "0123456789",
    "Email": "email@example.com",
    "DiaChi": "Hà Nội",
    "TenNhanVien": "Nhân viên A",
    "coHoi": [...],
    "lichHen": [...]
  }
}
```

### 2. GET /api/cohoi?khachhangId=1
**Query params:**
- `khachhangId`: ID khách hàng (required)
- `page`, `limit`: Pagination

### 3. GET /api/lichhen?khachhangId=1
### 4. GET /api/hoso?khachhangId=1
### 5. GET /api/hopdong?khachhangId=1

## 🧪 Cách test

### Bước 1: Start Backend
```bash
cd backend
npm start
```

### Bước 2: Start Frontend
```bash
cd frontend
npm run dev
```

### Bước 3: Test tính năng

1. **Đăng nhập** với tài khoản bất kỳ
2. **Vào trang Quản lý Khách hàng** (`/khachhang`)
3. **Click icon "👁 Xem chi tiết"** ở cột "Thao tác"
4. **Kiểm tra:**
   - ✅ Card thông tin KH hiển thị đầy đủ
   - ✅ 4 tabs hiển thị đúng số lượng
   - ✅ Bảng trong mỗi tab có dữ liệu
   - ✅ Pagination hoạt động (nếu > 6 items)
   - ✅ Nút "Quay lại" navigate về `/khachhang`
   - ✅ Responsive trên mobile (cột trái lên trên, cột phải xuống dưới)

## 🎯 Tính năng chính

### 1. Card Thông tin KH
- Avatar placeholder với icon User
- Tên KH + Status badge màu động
- Loại KH (Cá nhân/Doanh nghiệp)
- Mã KH tự động (KH00X)
- Nhân viên phụ trách
- Thông tin liên hệ (SDT, Email, Địa chỉ)
- Ngày tạo
- Nút "Chỉnh sửa thông tin" (navigate to edit page)

### 2. Tab Cơ hội
**Columns:**
- STT (pagination aware)
- Tên cơ hội
- Giá trị (format VNĐ)
- Trạng thái (badge màu)
- Ngày tạo
- Tác vụ (Edit icon)

### 3. Tab Lịch hẹn
**Columns:**
- STT
- Thời gian (format datetime)
- Địa điểm
- Nội dung (truncated)
- Trạng thái (badge màu)
- Tác vụ

### 4. Tab Hồ sơ
**Columns:**
- STT
- Tên hồ sơ
- Trạng thái (Chờ duyệt/Đã duyệt/Bổ sung)
- Ngày tạo
- Tác vụ (Download icon)

### 5. Tab Hợp đồng
**Columns:**
- STT
- Mã HĐ
- Giá trị (format VNĐ)
- Hiệu lực
- Hết hạn
- Tác vụ (View icon)

## 🎨 Color Scheme

### Status Badges
```javascript
'Tiềm năng': 'bg-blue-100 text-blue-800'
'Đang chăm sóc': 'bg-yellow-100 text-yellow-800'
'Thành công': 'bg-green-100 text-green-800'
'Rời bỏ': 'bg-red-100 text-red-800'
'Không tiềm năng': 'bg-gray-100 text-gray-800'
```

### Cơ hội Status
```javascript
'Mới': 'bg-blue-100 text-blue-800'
'Chờ xử lý': 'bg-yellow-100 text-yellow-800'
'Thành công': 'bg-green-100 text-green-800'
'Thất bại': 'bg-red-100 text-red-800'
```

## 📱 Responsive Design

### Desktop (lg+)
- Grid: `grid-cols-3`
- Cột trái: `col-span-1`
- Cột phải: `col-span-2`

### Mobile (< lg)
- Grid: `grid-cols-1`
- Cột trái: Full width (lên trên)
- Cột phải: Full width (xuống dưới)

## 🔄 State Management

### Component State
```javascript
const [loading, setLoading] = useState(true);
const [customer, setCustomer] = useState(null);
const [activeTab, setActiveTab] = useState('cohoi');
const [opportunities, setOpportunities] = useState([]);
const [appointments, setAppointments] = useState([]);
const [documents, setDocuments] = useState([]);
const [contracts, setContracts] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
```

### Data Flow
1. `useParams()` → Get customer ID from URL
2. `fetchCustomerDetail()` → Load customer info
3. `fetchRelatedData()` → Load all related data
4. User clicks tab → `setActiveTab()`
5. Pagination → `setCurrentPage()` → Re-render table

## ⚡ Performance

### Pagination
- **Items per page**: 6
- **Client-side pagination** (all data loaded once)
- **Benefits**: No API calls on page change, instant response

### Lazy Loading
- Tab content renders only when active
- Tables show loading state

### Icons
- Lucide React (tree-shakeable)
- Only used icons imported

## 🐛 Known Issues
- None ✅

## 🚀 Next Steps (Optional)

1. **Edit functionality** for each tab item
2. **Delete confirmation modals**
3. **Skeleton loaders** instead of spinner
4. **Server-side pagination** for large datasets
5. **Export table data** to Excel/PDF
6. **Filter & search** within tabs
7. **Sort** by column
8. **Detail modals** for each item

## 📞 Support

Nếu có lỗi, kiểm tra:
1. Backend running on port 5000
2. Frontend running on port 3000 (Vite)
3. Database có dữ liệu test
4. Console log errors
5. Network tab trong DevTools

---

**Hoàn thành:** ✅ 100%
**Test:** ✅ Ready to test
**Deployment:** ✅ Ready
