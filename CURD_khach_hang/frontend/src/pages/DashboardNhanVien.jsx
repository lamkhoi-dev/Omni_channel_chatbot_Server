import { useState, useEffect } from 'react';
import { Home, Users, Target, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function DashboardNhanVien() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    khachHangCuaToi: 0,
    coHoiDangXuLy: 0,
    lichHenHomNay: 0,
    kpiThang: { actual: 0, target: 5 }
  });
  const [lichHenGanNhat, setLichHenGanNhat] = useState([]);
  const [coHoiMoi, setCoHoiMoi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [khResponse, cohoiResponse, lichhenResponse] = await Promise.all([
        api.get('/khachhang?limit=1000'),
        api.get('/cohoi?limit=1000'),
        api.get('/lichhen/today')
      ]);

      // Get all opportunities
      const allCoHoi = cohoiResponse.data.data || [];
      
      // Count successful opportunities
      const coHoiThanhCong = allCoHoi.filter(c => c.TrangThaiCoHoi === 'Thành công').length;
      const tongCoHoi = cohoiResponse.data.pagination?.total || 0;
      
      // Filter opportunities for "đang xử lý"
      const coHoiDangXuLy = allCoHoi.filter(
        c => c.TrangThaiCoHoi === 'Mới' || c.TrangThaiCoHoi === 'Chờ xử lý'
      );

      setStats({
        khachHangCuaToi: khResponse.data.pagination?.total || 0,
        coHoiDangXuLy: coHoiDangXuLy.length,
        lichHenHomNay: lichhenResponse.data.data?.length || 0,
        kpiThang: {
          actual: coHoiThanhCong,
          target: tongCoHoi > 0 ? tongCoHoi : 1
        }
      });

      setLichHenGanNhat(lichhenResponse.data.data?.slice(0, 5) || []);
      setCoHoiMoi(coHoiDangXuLy.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiPercent = Math.round((stats.kpiThang.actual / stats.kpiThang.target) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Home className="w-8 h-8 text-blue-600" />
          Dashboard Nhân Viên
        </h1>
        <p className="text-gray-600 mt-2">Quản lý công việc và KPI của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Khách hàng của tôi"
          value={stats.khachHangCuaToi}
          color="blue"
        />
        <StatCard
          icon={<Target className="w-6 h-6" />}
          title="Cơ hội đang xử lý"
          value={stats.coHoiDangXuLy}
          color="green"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          title="Lịch hẹn hôm nay"
          value={stats.lichHenHomNay}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Tỷ lệ chuyển đổi"
          value={`${kpiPercent}%`}
          subtitle={`${stats.kpiThang.actual}/${stats.kpiThang.target} cơ hội thành công`}
          color="orange"
        />
      </div>

      {/* KPI Progress */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Tỷ lệ chuyển đổi cơ hội
        </h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Cơ hội thành công</span>
              <span className="text-sm font-semibold text-blue-600">{kpiPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(kpiPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lịch hẹn hôm nay */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Lịch hẹn hôm nay
          </h2>
          {lichHenGanNhat.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Không có lịch hẹn nào hôm nay</p>
          ) : (
            <div className="space-y-3">
              {lichHenGanNhat.map((lichhen) => (
                <div key={lichhen.ID} className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded">
                  <p className="font-medium text-gray-800">{lichhen.NoiDung}</p>
                  <p className="text-sm text-gray-600">{lichhen.DiaDiem}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(lichhen.ThoiGianHen).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cơ hội cần xử lý */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-green-600" />
            Cơ hội cần xử lý
          </h2>
          {coHoiMoi.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Không có cơ hội nào đang chờ</p>
          ) : (
            <div className="space-y-3">
              {coHoiMoi.map((cohoi) => (
                <div key={cohoi.ID} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded">
                  <p className="font-medium text-gray-800">{cohoi.TenCoHoi}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      cohoi.TrangThaiCoHoi === 'Mới' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cohoi.TrangThaiCoHoi}
                    </span>
                    {cohoi.GiaTri && (
                      <span className="text-sm font-semibold text-green-600">
                        {new Intl.NumberFormat('vi-VN').format(cohoi.GiaTri)} VNĐ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
