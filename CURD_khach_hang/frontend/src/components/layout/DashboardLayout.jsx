import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Target,
  Calendar,
  FileText,
  FileCheck,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Unified color scheme for all roles
const getStyles = () => {
  return {
    badge: 'bg-primary-100 text-primary-700 border-primary-300',
    accent: 'bg-primary-50 border-l-4 border-primary-500'
  };
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isConnected, on, off } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const [docsDropdownOpen, setDocsDropdownOpen] = useState(false);
  const styles = getStyles();

  // Listen to Socket.IO notifications
  useEffect(() => {
    const handleNotification = () => {
      setNotifications(prev => prev + 1);
    };

    on('new-appointment', handleNotification);
    on('notification', handleNotification);
    on('hoso-approved', handleNotification);

    return () => {
      off('new-appointment', handleNotification);
      off('notification', handleNotification);
      off('hoso-approved', handleNotification);
    };
  }, [on, off]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items optimized for each role's workflow
  const getMenuItems = (roleId) => {
    const allItems = {
      // Nhân viên (1) - Focus: Bán hàng, quản lý cá nhân
      1: [
        { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/khachhang', label: 'Khách hàng', icon: Users },
        { path: '/cohoi', label: 'Cơ hội', icon: Target },
        { path: '/lichhen', label: 'Lịch hẹn', icon: Calendar },
        { 
          type: 'dropdown', 
          label: 'Quản lý tài liệu', 
          icon: FileText,
          children: [
            { path: '/hoso', label: 'Hồ sơ khách hàng', icon: FileText },
            { path: '/hopdong', label: 'Hợp đồng khách hàng', icon: FileCheck }
          ]
        },
        { path: '/baocao', label: 'Báo cáo', icon: BarChart3 },
      ],
      // Quản lý (2) - Focus: Giám sát, duyệt
      2: [
        { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/quanly', label: 'Quản lý', icon: Settings }, // Priority action
        { path: '/baocao', label: 'Báo cáo', icon: BarChart3 },
        { path: '/khachhang', label: 'Khách hàng', icon: Users },
        { path: '/cohoi', label: 'Cơ hội', icon: Target },
        { path: '/lichhen', label: 'Lịch hẹn', icon: Calendar },
        { 
          type: 'dropdown', 
          label: 'Quản lý tài liệu', 
          icon: FileText,
          children: [
            { path: '/hoso', label: 'Hồ sơ khách hàng', icon: FileText },
            { path: '/hopdong', label: 'Hợp đồng khách hàng', icon: FileCheck }
          ]
        },
      ],
      // Admin/BGĐ (3) - CHỈ XEM BÁO CÁO & THỐNG KÊ, KHÔNG CRUD
      3: [
        { path: '/dashboard', label: 'Dashboard BGĐ', icon: LayoutDashboard },
        { path: '/baocao', label: 'Báo cáo & KPI', icon: BarChart3 },
      ]
    };

    return allItems[roleId] || allItems[1];
  };

  const menuItems = getMenuItems(user?.roleId);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo & Toggle */}
        <div className="h-24 flex items-center justify-between px-4 bg-white border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center justify-center flex-1">
              <img src="/logo.png" alt="BIC Logo" className="h-20 w-auto object-contain" />
            </div>
          ) : (
            <img src="/logo.png" alt="BIC Logo" className="h-16 w-16 object-contain mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            
            // Dropdown menu item
            if (item.type === 'dropdown') {
              return (
                <div key={index}>
                  <button
                    onClick={() => setDocsDropdownOpen(!docsDropdownOpen)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 mx-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </div>
                    {sidebarOpen && (
                      docsDropdownOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                    )}
                  </button>
                  {sidebarOpen && docsDropdownOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors text-sm ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`
                            }
                          >
                            <ChildIcon size={18} />
                            <span>{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular menu item
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.tenNhanVien}</p>
                <p className="text-gray-500">{user?.email}</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full border ${styles.badge}`}>
                  {user?.roleName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b-4 border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Xin chào, {user?.tenNhanVien}
            </h2>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border-2 ${styles.badge}`}>
              {user?.roleName}
            </span>
            {isConnected && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                ● Online
              </span>
            )}
          </div>

          <button
            onClick={() => navigate('/thongbao')}
            className="relative p-2 hover:bg-gray-100 rounded-lg"
          >
            <Bell size={24} />
            {notifications > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
