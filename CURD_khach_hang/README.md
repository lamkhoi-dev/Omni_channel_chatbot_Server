# CRM BIC HÀ NỘI - Installation Guide

## 📋 Prerequisites

- Node.js v18+ ([Download](https://nodejs.org/))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- Git
- VS Code (recommended)

## 🚀 Quick Start (Cách mới - Khuyến nghị)

### 1. Setup Database - ALL IN ONE

**Chỉ cần 1 lệnh duy nhất để setup toàn bộ:**

```bash
cd backend
node setup-complete-database.js
```

✅ **Script này sẽ tự động:**
- Xóa database cũ (nếu có)
- Tạo database `crm_bic` mới
- Tạo đầy đủ 8 bảng với quan hệ
- **Thêm các trường mới**: CCCD, NgaySinh (Cá nhân) và MaSoThue, NgayThanhLap (Doanh nghiệp)
- Import dữ liệu mẫu: 5 nhân viên, 8 khách hàng, 8 cơ hội, 12 lịch hẹn, 4 hồ sơ, 2 hợp đồng

📊 **Tài khoản test:**

| Username | Password | Vai trò |
|----------|----------|---------|
| `admin` | 123456 | Ban giám đốc |
| `manager1` | 123456 | Quản lý |
| `nhanvien1` | 123456 | Nhân viên |
| `nhanvien2` | 123456 | Nhân viên |
| `nhanvien3` | 123456 | Nhân viên |

⚠️ **Lưu ý:** Script này sẽ XÓA toàn bộ dữ liệu cũ. Chỉ chạy khi setup lần đầu hoặc muốn reset database.

📚 **Xem hướng dẫn chi tiết:** `backend/SETUP_DATABASE_README.md`

### 2. Setup Backend

```bash
cd backend

# Install dependencies (đã install rồi)
npm install

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

Server chạy tại: http://localhost:5000

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend chạy tại: http://localhost:3000

**Thông tin đăng nhập:**
- Username: `admin`
- Password: `admin123`
# npm install

# Start server (development mode)
npm run dev

# Hoặc production mode
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

### 3. Test Backend

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### 4. Setup Frontend (Coming soon)

```bash
cd frontend
npm install
npm start
```

## 📁 Project Structure

```
CURD_khach_hang/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── controllers/
│   │   └── authController.js     # Auth logic
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── role.js               # RBAC authorization
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── khachhang.js          # Customer endpoints
│   │   ├── cohoi.js              # Opportunity endpoints
│   │   ├── lichhen.js            # Appointment endpoints
│   │   ├── hoso.js               # Document endpoints
│   │   ├── hopdong.js            # Contract endpoints
│   │   ├── baocao.js             # Report endpoints
│   │   ├── quanly.js             # Management endpoints
│   │   └── thongbao.js           # Notification endpoints
│   ├── uploads/
│   │   ├── hoso/                 # Uploaded documents
│   │   └── hopdong/              # Uploaded contracts
│   ├── .env                      # Environment variables
│   ├── .gitignore
│   ├── database.sql              # Database schema
│   ├── package.json
│   ├── server.js                 # Main server file
│   └── setup-database.js         # Database setup script
├── frontend/                      # React app (coming soon)
└── PROJECT_DOCUMENTATION.md       # Full documentation

```

## 🔧 Environment Variables

File `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=210506
DB_NAME=crm_bic
JWT_SECRET=crm_bic_hanoi_2024_super_secret_key_32_chars_minimum_length
PORT=5000
NODE_ENV=development
```

## 📊 Database Schema

**8 Tables:**
1. `Role` - User roles (Nhân viên, Quản lý, Ban giám đốc)
2. `NhanVien` - Employees/Users
3. `KhachHang` - Customers
4. `CoHoi` - Sales opportunities
5. `LichHen` - Appointments
6. `HoSo` - Documents
7. `HopDong` - Contracts
8. `ThongBao` - Notifications

## 🎯 Features Implemented

### Backend (Complete ✅)
✅ JWT Authentication  
✅ Role-Based Access Control (RBAC)  
✅ Socket.IO Realtime Notifications  
✅ Cron Job for Contract Renewal Reminders (6:00 AM daily)  
✅ File Upload System (Multer)  
✅ Database Connection Pool  
✅ 48 API Endpoints  
✅ State Machine Validation  
✅ Churn Prediction Algorithm  
✅ Excel/PDF Export  

### Frontend (In Progress ⏳)
✅ React 18 + Vite  
✅ TailwindCSS Styling  
✅ Authentication Flow  
✅ Dashboard Layout with Sidebar  
✅ Socket.IO Client Integration  
✅ Zustand State Management  
⏳ CRUD Features (in development)  

## 🔐 User Roles & Permissions

| Role | ID | Permissions |
|------|-------|-------------|
| Nhân viên | 1 | CRUD own customers/opportunities, view own KPI |
| Quản lý | 2 | View/Edit all data, approve documents, manage users |
| Ban giám đốc | 3 | Full access + special reports |

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password (protected)

### Customers (`/api/khachhang`)
- `GET /` - List customers (pagination, search, role filtering)
- `GET /:id` - Get customer with opportunities & appointments history
- `POST /` - Create customer (auto status: Tiềm năng)
- `PUT /:id` - Update customer
- `DELETE /:id` - Delete customer

### Opportunities (`/api/cohoi`)
- `GET /` - List opportunities (role filtering)
- `GET /:id` - Get opportunity details
- `POST /` - Create opportunity (auto update customer status → Đang chăm sóc)
- `PUT /:id` - Update opportunity
- `PUT /:id/status` - Update status (state machine validation, Churn Prediction)
- `DELETE /:id` - Delete opportunity

### Appointments (`/api/lichhen`)
- `GET /today` - Get today's appointments
- `GET /` - List appointments (role filtering)
- `GET /:id` - Get appointment details
- `POST /` - Create appointment (Socket.IO notification, update opportunity status)
- `PUT /:id` - Update appointment
- `PUT /:id/complete` - Complete appointment (with success flag, Churn Prediction)
- `PUT /:id/cancel` - Cancel appointment (update opportunity, Churn Prediction)
- `DELETE /:id` - Delete appointment

### Documents (`/api/hoso`)
- `GET /` - List documents (role filtering)
- `GET /:id` - Get document details
- `POST /` - Upload document (Multer, auto status: Chờ duyệt)
- `PUT /:id/approve` - Approve document (Manager only, Socket.IO notification)
- `PUT /:id/reject` - Reject document (Manager only, status → Bổ sung)
- `GET /:id/download` - Download document
- `DELETE /:id` - Delete document

### Contracts (`/api/hopdong`)
- `GET /` - List contracts (role filtering)
- `GET /expiring` - Get expiring contracts (for cron job, within 30 days)
- `GET /:id` - Get contract details
- `POST /` - Create contract (requires approved HoSo, auto update opportunity & customer → Thành công)
- `PUT /:id` - Update contract
- `DELETE /:id` - Delete contract (Manager only)

### Reports (`/api/baocao`)
- `GET /doanhthu` - Revenue report (monthly/yearly)
- `GET /kpi/:id` - KPI report (targets: 10 customers, 5 opportunities, 100M VND/month)
- `GET /top-nhanvien` - Top employees ranking (Manager only)
- `GET /export/excel` - Export report to Excel (Manager only)
- `GET /export/pdf` - Export report to PDF (Manager only)

### Management (`/api/quanly`) - Manager only
- `GET /nhanvien` - List employees
- `GET /nhanvien/:id` - Get employee details
- `POST /nhanvien` - Create employee (bcrypt password)
- `PUT /nhanvien/:id` - Update employee
- `DELETE /nhanvien/:id` - Delete employee
- `GET /hoso/pending` - Get pending documents (TrangThaiHoSo = 'Chờ duyệt')
- `GET /lichhen/overdue` - Get overdue appointments

### Notifications (`/api/thongbao`)
- `GET /` - List notifications for current user (with unread count)
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all` - Mark all notifications as read

**Total: 48 API endpoints**

## 🐛 Troubleshooting

### Database connection error
```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```
**Solution:** 
- Kiểm tra password MySQL trong file `.env`
- Đảm bảo MySQL service đang chạy
- Test connection: `mysql -u root -p`

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
- Thay đổi PORT trong file `.env`
- Hoặc kill process đang dùng port 5000

## 📚 Next Steps

1. ✅ Complete backend API (48 endpoints)
2. ✅ Implement state machines (KhachHang, CoHoi, HoSo, LichHen)
3. ✅ Churn Prediction logic
4. ✅ Socket.IO realtime notifications
5. ✅ File upload system
6. ✅ Reports & exports (Excel/PDF)
7. ⏳ Build React Frontend (next step)
8. ⏳ E2E Testing

## 🎯 Backend Status: COMPLETE ✅

**All backend modules implemented:**
- ✅ Authentication & Authorization
- ✅ CRUD operations (6 modules)
- ✅ State machine validation
- ✅ Churn Prediction algorithm
- ✅ Socket.IO realtime
- ✅ Cron job (contract renewal)
- ✅ File upload (Multer)
- ✅ Reports (Excel/PDF export)
- ✅ Management features

## 📞 Support

For issues or questions, check `PROJECT_DOCUMENTATION.md` for detailed specifications.

---

**Last Updated:** November 27, 2025  
**Version:** 1.0.0
