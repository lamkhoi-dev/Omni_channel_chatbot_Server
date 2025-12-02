import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { FileText, Upload, Eye, Download, AlertTriangle, CheckCircle2, Calendar, Search } from 'lucide-react';

export default function HopDong() {
  const { user } = useAuthStore();
  const [hopDongs, setHopDongs] = useState([]);
  const [hoSos, setHoSos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHopDong, setSelectedHopDong] = useState(null);
  const [search, setSearch] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [formData, setFormData] = useState({
    ID_HoSo: '',
    MaHopDong: '',
    NgayHieuLuc: '',
    NgayHetHan: '',
    GiaTri: '',
    file: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hopDongRes, hoSoRes] = await Promise.all([
        api.get('/hopdong'),
        api.get('/hoso')
      ]);
      setHopDongs(hopDongRes.data.data || []);
      setHoSos(hoSoRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validation: Check HoSo đã duyệt
    const hoSo = hoSos.find(hs => hs.ID === parseInt(formData.ID_HoSo));
    if (!hoSo || hoSo.TrangThaiHoSo !== 'Đã duyệt') {
      alert('Hồ sơ chưa được duyệt! Không thể tạo hợp đồng.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('ID_HoSo', formData.ID_HoSo);
    formDataToSend.append('MaHopDong', formData.MaHopDong);
    formDataToSend.append('NgayHieuLuc', formData.NgayHieuLuc);
    formDataToSend.append('NgayHetHan', formData.NgayHetHan);
    formDataToSend.append('GiaTri', formData.GiaTri);
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }

    try {
      await api.post('/hopdong', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Tạo hợp đồng thành công! Cơ hội và Khách hàng đã được cập nhật trạng thái "Thành công"');
      setShowCreateModal(false);
      setFormData({
        ID_HoSo: '',
        MaHopDong: '',
        NgayHieuLuc: '',
        NgayHetHan: '',
        GiaTri: '',
        file: null
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi tạo hợp đồng');
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const response = await api.get(`/hopdong/${id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Lỗi khi tải file');
    }
  };

  const viewDetail = (hopDong) => {
    setSelectedHopDong(hopDong);
    setShowDetailModal(true);
  };

  const getContractStatus = (ngayHetHan) => {
    const today = new Date();
    const expiry = new Date(ngayHetHan);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { text: 'Đã hết hạn', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle };
    } else if (daysLeft <= 30) {
      return { text: `Còn ${daysLeft} ngày`, color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    } else if (daysLeft <= 90) {
      return { text: `Còn ${daysLeft} ngày`, color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    } else {
      return { text: 'Còn hiệu lực', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Apply filters
  const filteredHopDongs = hopDongs.filter(hd => {
    // Search filter
    if (search && !hd.MaHopDong.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Status filter
    if (trangThai) {
      const daysLeft = Math.ceil((new Date(hd.NgayHetHan) - new Date()) / (1000 * 60 * 60 * 24));
      if (trangThai === 'Còn hiệu lực' && daysLeft <= 90) return false;
      if (trangThai === 'Sắp hết hạn' && (daysLeft <= 0 || daysLeft > 90)) return false;
      if (trangThai === 'Đã hết hạn' && daysLeft >= 0) return false;
    }

    // Date range filter (filter by NgayHieuLuc)
    if (fromDate) {
      const hieuLuc = new Date(hd.NgayHieuLuc);
      const from = new Date(fromDate);
      if (hieuLuc < from) return false;
    }
    if (toDate) {
      const hieuLuc = new Date(hd.NgayHieuLuc);
      const to = new Date(toDate);
      if (hieuLuc > to) return false;
    }

    return true;
  });

  const expiringContracts = hopDongs.filter(hd => {
    const daysLeft = Math.ceil((new Date(hd.NgayHetHan) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  });

  const totalValue = filteredHopDongs.reduce((sum, hd) => sum + parseFloat(hd.GiaTri || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Hợp đồng</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={20} />
          Tạo Hợp đồng
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Tổng hợp đồng</p>
              <p className="text-2xl font-bold text-blue-700">{hopDongs.length}</p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Tổng giá trị</p>
              <p className="text-xl font-bold text-green-700">
                {(totalValue / 1000000).toFixed(1)}M
              </p>
            </div>
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Sắp hết hạn</p>
              <p className="text-2xl font-bold text-red-700">{expiringContracts.length}</p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Hồ sơ đã duyệt</p>
              <p className="text-2xl font-bold text-purple-700">
                {hoSos.filter(hs => hs.TrangThaiHoSo === 'Đã duyệt').length}
              </p>
            </div>
            <Calendar className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Warning for expiring contracts */}
      {expiringContracts.length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-red-900">Cảnh báo: {expiringContracts.length} hợp đồng sắp hết hạn!</h3>
              <p className="text-sm text-red-700 mt-1">
                Cần liên hệ khách hàng để tái tục hợp đồng. Hệ thống sẽ gửi thông báo tự động mỗi ngày lúc 6:00 AM.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm mã hợp đồng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={trangThai}
            onChange={(e) => setTrangThai(e.target.value)}
            className="input"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Còn hiệu lực">Còn hiệu lực</option>
            <option value="Sắp hết hạn">Sắp hết hạn (&le;90 ngày)</option>
            <option value="Đã hết hạn">Đã hết hạn</option>
          </select>

          {/* From Date */}
          <input
            type="date"
            placeholder="Từ ngày..."
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input"
          />

          {/* To Date */}
          <input
            type="date"
            placeholder="Đến ngày..."
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input"
            min={fromDate}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã HĐ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hồ sơ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày hiệu lực</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHopDongs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy hợp đồng nào
                  </td>
                </tr>
              ) : (
                filteredHopDongs.map((hopDong) => {
                const status = getContractStatus(hopDong.NgayHetHan);
                const StatusIcon = status.icon;
                return (
                  <tr key={hopDong.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{hopDong.MaHopDong}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {hoSos.find(hs => hs.ID === hopDong.ID_HoSo)?.TenHoSo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(hopDong.NgayHieuLuc).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(hopDong.NgayHetHan).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(hopDong.GiaTri)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        <StatusIcon size={16} />
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetail(hopDong)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {hopDong.FileHopDong && (
                          <button
                            onClick={() => handleDownload(hopDong.ID, hopDong.FileHopDong)}
                            className="text-green-600 hover:text-green-800"
                            title="Tải xuống"
                          >
                            <Download size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
          Hiển thị {filteredHopDongs.length} / {hopDongs.length} hợp đồng
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Tạo Hợp đồng mới</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hồ sơ (chỉ hiển thị hồ sơ đã duyệt) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ID_HoSo}
                    onChange={(e) => setFormData({ ...formData, ID_HoSo: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">-- Chọn hồ sơ --</option>
                    {hoSos
                      .filter(hs => hs.TrangThaiHoSo === 'Đã duyệt')
                      .map(hoSo => (
                        <option key={hoSo.ID} value={hoSo.ID}>
                          {hoSo.TenHoSo} (Đã duyệt: {new Date(hoSo.NgayDuyet).toLocaleDateString('vi-VN')})
                        </option>
                      ))}
                  </select>
                  {hoSos.filter(hs => hs.TrangThaiHoSo === 'Đã duyệt').length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Không có hồ sơ nào đã được duyệt. Vui lòng duyệt hồ sơ trước khi tạo hợp đồng.
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã hợp đồng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.MaHopDong}
                    onChange={(e) => setFormData({ ...formData, MaHopDong: e.target.value })}
                    className="input-field"
                    placeholder="VD: BH-2024-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày hiệu lực <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.NgayHieuLuc}
                    onChange={(e) => setFormData({ ...formData, NgayHieuLuc: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày hết hạn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.NgayHetHan}
                    onChange={(e) => setFormData({ ...formData, NgayHetHan: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị hợp đồng (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.GiaTri}
                    onChange={(e) => setFormData({ ...formData, GiaTri: e.target.value })}
                    className="input-field"
                    placeholder="VD: 50000000"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File hợp đồng (tùy chọn)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    className="input-field"
                    accept=".pdf,.doc,.docx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hỗ trợ: PDF, DOC, DOCX
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn-primary flex-1">
                  Tạo hợp đồng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      ID_HoSo: '',
                      MaHopDong: '',
                      NgayHieuLuc: '',
                      NgayHetHan: '',
                      GiaTri: '',
                      file: null
                    });
                  }}
                  className="btn-secondary flex-1"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedHopDong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Chi tiết Hợp đồng</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mã hợp đồng</p>
                  <p className="font-medium">{selectedHopDong.MaHopDong}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giá trị</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedHopDong.GiaTri)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày hiệu lực</p>
                  <p className="font-medium">{new Date(selectedHopDong.NgayHieuLuc).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày hết hạn</p>
                  <p className="font-medium">{new Date(selectedHopDong.NgayHetHan).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Hồ sơ liên quan</p>
                  <p className="font-medium">
                    {hoSos.find(hs => hs.ID === selectedHopDong.ID_HoSo)?.TenHoSo || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  {(() => {
                    const status = getContractStatus(selectedHopDong.NgayHetHan);
                    const StatusIcon = status.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        <StatusIcon size={16} />
                        {status.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4 mt-4 border-t">
              {selectedHopDong.FileHopDong && (
                <button
                  onClick={() => handleDownload(selectedHopDong.ID, selectedHopDong.FileHopDong)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download size={18} />
                  Tải file hợp đồng
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary flex-1"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
