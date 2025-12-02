import { useAuthStore } from '../store/authStore';
import DashboardNhanVien from './DashboardNhanVien';
import DashboardQuanLy from './DashboardQuanLy';
import DashboardAdmin from './DashboardAdmin';

export default function Dashboard() {
  const { user } = useAuthStore();

  // Route to appropriate dashboard based on role
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Role-based dashboard routing
  switch (user.roleId) {
    case 1: // Nhân viên
      return <DashboardNhanVien />;
    case 2: // Quản lý
      return <DashboardQuanLy />;
    case 3: // Admin/BGĐ
      return <DashboardAdmin />;
    default:
      return <DashboardNhanVien />; // Fallback
  }
}


