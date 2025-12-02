import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Target, Users, Award, Calendar, Download } from 'lucide-react';

export default function BaoCao() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [doanhThuData, setDoanhThuData] = useState([]);
  const [topNhanVien, setTopNhanVien] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [coHoiStats, setCoHoiStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleExportExcel = async (type = 'doanhthu') => {
    try {
      const response = await api.get(`/baocao/export/excel`, {
        params: {
          type,
          year: new Date(dateRange.startDate).getFullYear(),
          month: new Date(dateRange.startDate).getMonth() + 1
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Lỗi xuất file Excel');
    }
  };

  const handleExportPDF = async (type = 'doanhthu') => {
    try {
      const response = await api.get(`/baocao/export/pdf`, {
        params: {
          type,
          year: new Date(dateRange.startDate).getFullYear(),
          month: new Date(dateRange.startDate).getMonth() + 1
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Lỗi xuất file PDF');
    }
  };

  const handleExportTyLeChuyenDoi = async () => {
    try {
      const response = await api.get('/baocao/export/ty-le-chuyen-doi', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_TyLeChuyenDoi_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export conversion rate error:', error);
      alert('Lỗi xuất báo cáo tỷ lệ chuyển đổi');
    }
  };

  const handleExportHopDongGanHetHan = async () => {
    try {
      const response = await api.get('/baocao/export/hop-dong-gan-het-han', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_HopDongGanHetHan_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export expiring contracts error:', error);
      alert('Lỗi xuất báo cáo hợp đồng gần hết hạn');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [
        api.get(`/baocao/doanhthu?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/baocao/kpi/${user.id}`),
        api.get('/cohoi')
      ];

      if (user.roleId >= 2) {
        promises.push(api.get(`/baocao/top-nhanvien?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`));
      }

      const responses = await Promise.all(promises);
      
      setDoanhThuData(responses[0].data.data || []);
      
      // Map backend KPI structure to frontend format
      const backendKpi = responses[1].data.data;
      if (backendKpi) {
        setKpiData({
          khMoi: {
            actual: backendKpi.ThucTe.SoKhachHang,
            target: backendKpi.ChiTieu.SoKhachHang
          },
          coHoiThanhCong: {
            actual: backendKpi.ThucTe.SoCoHoiThanhCong,
            target: backendKpi.ChiTieu.SoCoHoi
          },
          doanhThu: {
            actual: backendKpi.ThucTe.DoanhThu,
            target: backendKpi.ChiTieu.DoanhThu
          }
        });
      }
      
      const coHois = responses[2].data.data || [];
      const stats = [
        { name: 'Mới', value: coHois.filter(c => c.TrangThaiCoHoi === 'Mới').length, color: '#3B82F6' },
        { name: 'Chờ xử lý', value: coHois.filter(c => c.TrangThaiCoHoi === 'Chờ xử lý').length, color: '#F59E0B' },
        { name: 'Thành công', value: coHois.filter(c => c.TrangThaiCoHoi === 'Thành công').length, color: '#10B981' },
        { name: 'Thất bại', value: coHois.filter(c => c.TrangThaiCoHoi === 'Thất bại').length, color: '#EF4444' }
      ];
      setCoHoiStats(stats);

      if (user.roleId >= 2 && responses[3]) {
        setTopNhanVien(responses[3].data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getKPIColor = (percent) => {
    if (percent >= 100) return 'text-green-600';
    if (percent >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getKPIBgColor = (percent) => {
    if (percent >= 100) return 'bg-green-100';
    if (percent >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getMedalIcon = (rank) => {
    const medals = {
      1: '🥇',
      2: '🥈',
      3: '🥉'
    };
    return medals[rank] || `#${rank}`;
  };

  const totalRevenue = doanhThuData.reduce((sum, item) => sum + parseFloat(item.tongDoanhThu || 0), 0);
  const totalContracts = doanhThuData.reduce((sum, item) => sum + parseInt(item.soHopDong || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
          <p className="text-gray-600 mt-1">Phân tích doanh thu, KPI và hiệu suất kinh doanh</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => handleExportExcel('doanhthu')} 
            className="btn-secondary flex items-center gap-2"
            title="Xuất báo cáo doanh thu"
          >
            <Download size={18} />
            Doanh thu Excel
          </button>
          <button 
            onClick={() => handleExportPDF('doanhthu')} 
            className="btn-secondary flex items-center gap-2"
            title="Xuất báo cáo doanh thu PDF"
          >
            <Download size={18} />
            Doanh thu PDF
          </button>
          <button 
            onClick={handleExportTyLeChuyenDoi} 
            className="btn-primary flex items-center gap-2"
            title="Xuất báo cáo tỷ lệ chuyển đổi cơ hội"
          >
            <Download size={18} />
            Tỷ lệ chuyển đổi
          </button>
          <button 
            onClick={handleExportHopDongGanHetHan} 
            className="btn-primary flex items-center gap-2"
            title="Xuất báo cáo hợp đồng gần đến hạn"
          >
            <Download size={18} />
            HĐ gần hết hạn
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex items-center gap-4">
          <Calendar className="text-gray-500" size={20} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="input max-w-xs"
              max={dateRange.endDate}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="input max-w-xs"
              min={dateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button 
            onClick={fetchData} 
            className="btn-primary"
            disabled={!dateRange.startDate || !dateRange.endDate}
          >
            Áp dụng
          </button>
          <button
            onClick={() => {
              const newRange = {
                startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              };
              setDateRange(newRange);
            }}
            className="btn-secondary"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign className="text-green-500" size={36} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Hợp đồng</p>
              <p className="text-2xl font-bold text-blue-700">{totalContracts}</p>
            </div>
            <TrendingUp className="text-blue-500" size={36} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Tỷ lệ chuyển đổi</p>
              <p className="text-2xl font-bold text-orange-700">
                {coHoiStats.length > 0 
                  ? Math.round((coHoiStats.find(s => s.name === 'Thành công')?.value || 0) / 
                      coHoiStats.reduce((sum, s) => sum + s.value, 0) * 100) 
                  : 0}%
              </p>
            </div>
            <Award className="text-orange-500" size={36} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doanhThuData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="thang" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Tháng ${label}`}
              />
              <Legend />
              <Bar dataKey="tongDoanhThu" fill="#10B981" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Opportunity Status Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Tỷ lệ cơ hội theo trạng thái</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={coHoiStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {coHoiStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI Progress - Only for Manager and above */}
      {kpiData && user.roleId >= 2 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">KPI cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Khách hàng mới */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Khách hàng mới</span>
                <span className={`text-sm font-bold ${getKPIColor((kpiData.khMoi.actual / kpiData.khMoi.target) * 100)}`}>
                  {kpiData.khMoi.actual}/{kpiData.khMoi.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getKPIBgColor((kpiData.khMoi.actual / kpiData.khMoi.target) * 100)} transition-all`}
                  style={{ 
                    width: `${Math.min((kpiData.khMoi.actual / kpiData.khMoi.target) * 100, 100)}%`,
                    backgroundColor: (kpiData.khMoi.actual / kpiData.khMoi.target) * 100 >= 100 ? '#10B981' : 
                                      (kpiData.khMoi.actual / kpiData.khMoi.target) * 100 >= 70 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((kpiData.khMoi.actual / kpiData.khMoi.target) * 100)}% hoàn thành
              </p>
            </div>

            {/* Cơ hội thành công */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Cơ hội thành công</span>
                <span className={`text-sm font-bold ${getKPIColor((kpiData.coHoiThanhCong.actual / kpiData.coHoiThanhCong.target) * 100)}`}>
                  {kpiData.coHoiThanhCong.actual}/{kpiData.coHoiThanhCong.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min((kpiData.coHoiThanhCong.actual / kpiData.coHoiThanhCong.target) * 100, 100)}%`,
                    backgroundColor: (kpiData.coHoiThanhCong.actual / kpiData.coHoiThanhCong.target) * 100 >= 100 ? '#10B981' : 
                                      (kpiData.coHoiThanhCong.actual / kpiData.coHoiThanhCong.target) * 100 >= 70 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((kpiData.coHoiThanhCong.actual / kpiData.coHoiThanhCong.target) * 100)}% hoàn thành
              </p>
            </div>

            {/* Doanh thu */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Doanh thu</span>
                <span className={`text-sm font-bold ${getKPIColor((kpiData.doanhThu.actual / kpiData.doanhThu.target) * 100)}`}>
                  {formatCurrency(kpiData.doanhThu.actual)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min((kpiData.doanhThu.actual / kpiData.doanhThu.target) * 100, 100)}%`,
                    backgroundColor: (kpiData.doanhThu.actual / kpiData.doanhThu.target) * 100 >= 100 ? '#10B981' : 
                                      (kpiData.doanhThu.actual / kpiData.doanhThu.target) * 100 >= 70 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mục tiêu: {formatCurrency(kpiData.doanhThu.target)} ({Math.round((kpiData.doanhThu.actual / kpiData.doanhThu.target) * 100)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers (Manager/Admin only) */}
      {user.roleId >= 2 && topNhanVien.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-gray-700" size={24} />
            <h3 className="text-lg font-semibold">Top 10 Nhân viên xuất sắc</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hợp đồng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topNhanVien.map((nv, index) => (
                  <tr key={nv.ID} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">{getMedalIcon(index + 1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{nv.TenNhanVien}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">{formatCurrency(nv.TongDoanhThu || 0)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {nv.SoHopDong || 0} hợp đồng
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {nv.SoKhachHang || 0} khách hàng
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
