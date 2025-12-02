import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Crown, TrendingUp, DollarSign, Users, FileText, Target, Award, Activity } from 'lucide-react';
import api from '../lib/api';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    tongDoanhThu: 0,
    tongHopDong: 0,
    tongKhachHang: 0,
    tongNhanVien: 0,
    tyLeChuyenDoi: 0
  });
  const [doanhThuTheoThang, setDoanhThuTheoThang] = useState([]);
  const [topNhanVien, setTopNhanVien] = useState([]);
  const [coHoiTheoTrangThai, setCoHoiTheoTrangThai] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // BGĐ (Role 3) GỌI API TỔNG HỢP - CHÍNH XÁC 100%
      const [tongHopRes, baocaoRes, topNVRes] = await Promise.all([
        api.get('/baocao/tonghop'),
        api.get('/baocao/doanhthu'),
        api.get('/baocao/top-nhanvien')
      ]);

      // Lấy stats CHÍNH XÁC từ API tổng hợp (COUNT DISTINCT)
      const statsData = tongHopRes.data.data;
      
      setStats({
        tongDoanhThu: parseFloat(statsData.tongDoanhThu) || 0,
        tongHopDong: parseInt(statsData.tongHopDong) || 0,
        tongKhachHang: parseInt(statsData.tongKhachHang) || 0,
        tongNhanVien: parseInt(statsData.tongNhanVien) || 0,
        tyLeChuyenDoi: parseInt(statsData.tyLeChuyenDoi) || 0
      });

      // Cơ hội theo trạng thái
      const tongCoHoi = parseInt(statsData.tongCoHoi) || 0;
      const coHoiThanhCong = parseInt(statsData.coHoiThanhCong) || 0;
      
      setCoHoiTheoTrangThai([
        { name: 'Thành công', value: coHoiThanhCong },
        { name: 'Mới/Chờ xử lý', value: Math.max(0, tongCoHoi - coHoiThanhCong) }
      ]);

      // Format doanh thu theo tháng
      const monthlyData = baocaoRes.data.data?.map(item => ({
        thang: `T${item.thang}/${item.nam}`,
        doanhThu: item.tongDoanhThu || 0,
        soHopDong: item.soHopDong || 0
      })) || [];
      setDoanhThuTheoThang(monthlyData.slice(-6)); // Last 6 months

      setTopNhanVien(topNVRes.data.data?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Crown className="w-10 h-10 text-red-600" />
          Dashboard Giám Đốc
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Tổng quan hiệu quả kinh doanh toàn hệ thống</p>
      </div>

      {/* Stats Cards - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCardLarge
          icon={<DollarSign className="w-8 h-8" />}
          title="Tổng doanh thu"
          value={new Intl.NumberFormat('vi-VN').format(stats.tongDoanhThu)}
          subtitle="VNĐ"
          color="red"
          trend="+12%"
        />
        <StatCardLarge
          icon={<FileText className="w-8 h-8" />}
          title="Tổng hợp đồng"
          value={stats.tongHopDong}
          subtitle="hợp đồng"
          color="orange"
        />
        <StatCardLarge
          icon={<Users className="w-8 h-8" />}
          title="Nhân viên"
          value={stats.tongNhanVien}
          subtitle="người"
          color="blue"
        />
        <StatCardLarge
          icon={<Target className="w-8 h-8" />}
          title="Tỷ lệ chuyển đổi"
          value={`${stats.tyLeChuyenDoi}%`}
          subtitle="cơ hội → hợp đồng"
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Doanh thu theo tháng - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Doanh thu 6 tháng gần nhất
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doanhThuTheoThang}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="thang" />
              <YAxis />
              <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'} />
              <Legend />
              <Bar dataKey="doanhThu" fill="#EF4444" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cơ hội theo trạng thái - 1/3 width */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-orange-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Cơ hội theo trạng thái
          </h2>
          {coHoiTheoTrangThai.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={coHoiTheoTrangThai}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {coHoiTheoTrangThai.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Top Performers & KPI Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Nhân viên xuất sắc */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Top 5 Nhân viên xuất sắc
          </h2>
          {topNhanVien.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topNhanVien.map((nv, index) => (
                <div key={nv.ID} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                    'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{nv.TenNhanVien}</p>
                    <p className="text-sm text-gray-600">{nv.SoHopDong || 0} hợp đồng • {nv.SoKhachHang || 0} khách hàng</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-red-600">
                      {new Intl.NumberFormat('vi-VN').format(nv.TongDoanhThu || 0)}
                    </p>
                    <p className="text-xs text-gray-500">VNĐ</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KPI Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Chỉ số KPI tổng quan
          </h2>
          <div className="space-y-4">
            <KPIBar label="Tỷ lệ chuyển đổi" value={stats.tyLeChuyenDoi} target={80} color="green" />
            <KPIBar label="Doanh thu (% mục tiêu)" value={65} target={100} color="blue" />
            <KPIBar label="Hợp đồng mới (% mục tiêu)" value={75} target={100} color="purple" />
            <KPIBar label="Khách hàng mới (% mục tiêu)" value={85} target={100} color="orange" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCardLarge({ icon, title, value, subtitle, color, trend }) {
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-b-4 border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white shadow-md`}>
          {icon}
        </div>
        {trend && (
          <span className="text-green-600 text-sm font-semibold bg-green-100 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function KPIBar({ label, value, target, color }) {
  const percent = Math.round((value / target) * 100);
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-800">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${colorClasses[color]} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}
