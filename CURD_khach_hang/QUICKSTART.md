# 🚀 Quick Start Guide - CRM BIC Hà Nội

## Prerequisites

✅ Node.js v18+ installed  
✅ MySQL 8.0+ installed and running  
✅ Git installed

## Step 1: Setup Database

### Option A: MySQL Command Line (Recommended)

```bash
# Login to MySQL
mysql -u root -p
# Enter password: 210506

# Execute database script
source D:/An/CURD_khach_hang/backend/database.sql;

# Exit MySQL
exit;
```

### Option B: MySQL Workbench

1. Open MySQL Workbench
2. Connect to localhost (password: 210506)
3. File → Open SQL Script → Select `backend/database.sql`
4. Execute (⚡ icon)

### Create Admin Account

```bash
cd backend
node setup-database.js
```

**Default credentials:**
- Username: `admin`
- Password: `admin123`

## Step 2: Start Backend

```bash
cd backend

# Install dependencies (if not done)
npm install

# Start server
npm start
```

✅ Backend running at: http://localhost:5000

## Step 3: Start Frontend

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

✅ Frontend running at: http://localhost:3000

## Step 4: Login

1. Open browser: http://localhost:3000
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. **Change password immediately!**

## 🎯 Test API Endpoints

### Using Browser

- Health check: http://localhost:5000/api/health

### Using Postman

**1. Login**
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "username": "admin",
  "password": "admin123"
}
```

Copy the `token` from response.

**2. Test Protected Endpoint**
```
GET http://localhost:5000/api/khachhang
Headers:
Authorization: Bearer {your_token_here}
```

## 📊 Available Features

### All Users
- ✅ Dashboard overview
- ✅ Customer management (CRUD)
- ✅ Opportunity management (state machine)
- ✅ Appointment scheduling (Socket.IO notifications)
- ✅ Document upload & tracking
- ✅ Contract management
- ✅ Personal KPI reports
- ✅ Realtime notifications

### Managers Only (roleId: 2, 3)
- ✅ Approve/reject documents
- ✅ View all employees' data
- ✅ User management
- ✅ System reports (revenue, top employees)
- ✅ Export to Excel/PDF
- ✅ Pending documents queue
- ✅ Overdue appointments tracking

## 🔧 Troubleshooting

### Database connection failed
```
Error: ER_ACCESS_DENIED_ERROR
```
**Solution:** Check MySQL password in `backend/.env` (should be 210506)

### Port already in use
```
Error: EADDRINUSE :::5000
```
**Solution:** Change PORT in `backend/.env` or kill process using port 5000

### Frontend can't connect to backend
**Solution:** 
1. Ensure backend is running (http://localhost:5000)
2. Check CORS settings in `backend/server.js`
3. Verify `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`

### Socket.IO not connecting
**Solution:**
1. Check JWT token in localStorage
2. Verify backend Socket.IO server is running
3. Check browser console for errors

## 📚 Documentation

- **Full Docs:** `PROJECT_DOCUMENTATION.md`
- **API Reference:** `README.md` (48 endpoints)
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Frontend Docs:** `frontend/README.md`

## 🎯 Next Steps

1. ✅ Login and explore the dashboard
2. ✅ Create your first customer
3. ✅ Add an opportunity
4. ✅ Schedule an appointment (check Socket.IO notification)
5. ✅ Upload a document
6. ✅ Create a contract (after document approved)
7. ✅ Check reports & KPI

## 💡 Tips

- Use Chrome DevTools to see Socket.IO events (Network → WS)
- Check `backend/uploads/` for uploaded files
- MySQL logs are in backend console
- Frontend hot-reload works automatically with Vite

## 🆘 Need Help?

- Check `README.md` for detailed setup
- See `PROJECT_DOCUMENTATION.md` for business logic
- Review `IMPLEMENTATION_SUMMARY.md` for technical details

---

**Happy Coding! 🎉**
