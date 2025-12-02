# CRM BIC Frontend

React + Vite + TailwindCSS frontend for CRM system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **TanStack Query** - Server state
- **Socket.IO Client** - Realtime
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Lucide React** - Icons

## 🔧 Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       └── DashboardLayout.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── KhachHang.jsx
│   ├── CoHoi.jsx
│   ├── LichHen.jsx
│   ├── HoSo.jsx
│   ├── HopDong.jsx
│   ├── BaoCao.jsx
│   ├── QuanLy.jsx
│   └── ThongBao.jsx
├── store/
│   └── authStore.js
├── hooks/
│   └── useSocket.js
├── lib/
│   └── api.js
├── App.jsx
├── main.jsx
└── index.css
```

## ✨ Features

- ✅ JWT Authentication
- ✅ Role-based routing
- ✅ Socket.IO realtime notifications
- ✅ Responsive sidebar layout
- ✅ TailwindCSS styling
- ⏳ CRUD pages (in development)

## 🔐 Default Login

- Username: `admin`
- Password: `admin123`

## 📝 Development Status

- ✅ Project setup
- ✅ Authentication flow
- ✅ Dashboard layout
- ✅ Routing & navigation
- ⏳ CRUD features (next step)

---

**Port:** 3000  
**API:** http://localhost:5000/api
