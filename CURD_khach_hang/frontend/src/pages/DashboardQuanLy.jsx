import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, FileCheck, AlertTriangle, TrendingUp, Award } from 'lucide-react';
import api from '../lib/api';

export default function DashboardQuanLy() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    tongNhanVien: 0,
    hoSoChoDuyet: 0,
    coHoiDangXuLy: 0,
    doanhThuThang: 0
  });
  const [hoSoPending, setHoSoPending] = useState([]);
  const [topNhanVien, setTopNhanVien] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current month/year for revenue
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const [nhanvienRes, hosoRes, cohoiRes, doanhThuRes, topNVRes] = await Promise.all([
        api.get('/quanly/nhanvien'),
        api.get('/quanly/hoso/pending'),
        api.get('/cohoi?limit=1000'),
        api.get('/baocao/doanhthu'),
        api.get('/baocao/top-nhanvien')
      ]);

      const coHoiDangXuLy = cohoiRes.data.data?.filter(
        c => c.TrangThaiCoHoi === 'Mới' || c.TrangThaiCoHoi === 'Chờ xử lý'
      ).length || 0;

      // Calculate this month's revenue
      const thisMonthRevenue = doanhThuRes.data.data?.find(
        item => item.thang === month && item.nam === year
      )?.tongDoanhThu || 0;

      setStats({
        tongNhanVien: nhanvienRes.data.data?.length || 0,
        hoSoChoDuyet: hosoRes.data.data?.length || 0,
        coHoiDangXuLy,
        doanhThuThang: thisMonthRevenue
      });

      setHoSoPending(hosoRes.data.data?.slice(0, 5) || []);
      setTopNhanVien(topNVRes.data.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-orange-600" />
          Dashboard Quản Lý
        </h1>
        <p className="text-gray-600 mt-2">Giám sát hoạt động và hiệu suất team</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Tổng nhân viên"
          value={stats.tongNhanVien}
          color="orange"
        />
        <StatCard
          icon={<FileCheck className="w-6 h-6" />}
          title="Hồ sơ chờ duyệt"
          value={stats.hoSoChoDuyet}
          color="red"
          highlight={stats.hoSoChoDuyet > 0}
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          title="Cơ hội đang xử lý"
          value={stats.coHoiDangXuLy}
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Doanh thu tháng"
          value={new Intl.NumberFormat('vi-VN').format(stats.doanhThuThang)}
          subtitle="VNĐ"
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hồ sơ chờ duyệt - Priority */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-orange-600" />
            Hồ sơ chờ duyệt
            {stats.hoSoChoDuyet > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {stats.hoSoChoDuyet}
              </span>
            )}
          </h2>
          {hoSoPending.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Không có hồ sơ nào chờ duyệt</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hoSoPending.map((hoso) => (
                <div key={hoso.ID} className="border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-orange-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{hoso.TenHoSo}</p>
                      <p className="text-sm text-gray-600 mt-1">Nhân viên: {hoso.TenNhanVien || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload: {new Date(hoso.NgayUpload).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/hoso')}
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                      title="Đi đến trang duyệt hồ sơ"
                    >
                      Duyệt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Nhân viên xuất sắc
          </h2>
          {topNhanVien.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topNhanVien.map((nv, index) => (
                <div key={nv.ID} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{nv.TenNhanVien}</p>
                    <p className="text-sm text-gray-600">{nv.SoHopDong || 0} hợp đồng</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {new Intl.NumberFormat('vi-VN').format(nv.TongDoanhThu || 0)}
                    </p>
                    <p className="text-xs text-gray-500">VNĐ</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton label="Duyệt hồ sơ" icon={<FileCheck />} count={stats.hoSoChoDuyet} onClick={() => navigate('/hoso')} />
          <QuickActionButton label="Quản lý nhân viên" icon={<Users />} onClick={() => navigate('/quanly')} />
          <QuickActionButton label="Xem báo cáo" icon={<BarChart3 />} onClick={() => navigate('/baocao')} />
          <QuickActionButton label="Lịch hẹn team" icon={<AlertTriangle />} onClick={() => navigate('/lichhen')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color, highlight }) {
  const colorClasses = {
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    green: 'bg-green-500 text-white'
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
      highlight ? 'ring-2 ring-red-400 animate-pulse' : ''
    }`}>
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

function QuickActionButton({ label, icon, count, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all">
      <div className="relative">
        <div className="text-orange-600">{icon}</div>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}
