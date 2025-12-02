import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KhachHang from './pages/KhachHang';
import KhachHangDetail from './pages/KhachHangDetail';
import CoHoi from './pages/CoHoi';
import LichHen from './pages/LichHen';
import HoSo from './pages/HoSo';
import HopDong from './pages/HopDong';
import BaoCao from './pages/BaoCao';
import QuanLy from './pages/QuanLy';
import ThongBao from './pages/ThongBao';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Role-based Route Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();
  
  if (!allowedRoles.includes(user?.roleId)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard - All roles */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Báo cáo - All roles (but different views) */}
          <Route path="baocao" element={<BaoCao />} />
          
          {/* Thông báo - All roles */}
          <Route path="thongbao" element={<ThongBao />} />
          
          {/* CRUD Routes - Nhân viên (1) & Quản lý (2) ONLY */}
          <Route 
            path="khachhang" 
            element={
              <RoleRoute allowedRoles={[1, 2]}>
                <KhachHang />
              </RoleRoute>
            } 
          />
          <Route 
            path="khachhang/:id" 
            element={
              <RoleRoute allowedRoles={[1, 2]}>
                <KhachHangDetail />
              </RoleRoute>
            } 
          />
          <Route 
            path="cohoi" 
            element={
              <RoleRoute allowedRoles={[1, 2]}>
                <CoHoi />
              </RoleRoute>
            } 
          />
          <Route 
            path="lichhen" 
            element={
              <RoleRoute allowedRoles={[1, 2]}>
                <LichHen />
              </RoleRoute>
            } 
          />
          <Route 
            path="hoso" 
            element={
              <RoleRoute allowedRoles={[1, 2]}>
                <HoSo />
              </RoleRoute>
            } 
          />
          <Route 
            path="hopdong" 
            element={
              <RoleRoute allowedRoles={[1, 2]}>
                <HopDong />
              </RoleRoute>
            } 
          />
          
          {/* Manager only routes (Role 2) */}
          <Route 
            path="quanly" 
            element={
              <RoleRoute allowedRoles={[2]}>
                <QuanLy />
              </RoleRoute>
            } 
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
