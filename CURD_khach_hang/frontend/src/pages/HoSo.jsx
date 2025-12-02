import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { FileText, Upload, CheckCircle, XCircle, Clock, Download, AlertCircle } from 'lucide-react';

export default function HoSo() {
  const { user } = useAuthStore();
  const [hoSos, setHoSos] = useState([]);
  const [coHois, setCoHois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [selectedHoSo, setSelectedHoSo] = useState(null);
  const [formData, setFormData] = useState({
    ID_CoHoi: '',
    TenHoSo: '',
    file: null
  });
  const [reuploadData, setReuploadData] = useState({
    TenHoSo: '',
    file: null,
    GhiChu: ''
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hosoRes, cohoiRes] = await Promise.all([
        api.get('/hoso'),
        api.get('/cohoi')
      ]);
      setHoSos(hosoRes.data.data || []);
      setCoHois(cohoiRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.ID_CoHoi || !formData.TenHoSo || !formData.file) {
      alert('Vui lòng điền đầy đủ thông tin và chọn file');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('ID_CoHoi', formData.ID_CoHoi);
    formDataToSend.append('TenHoSo', formData.TenHoSo);
    formDataToSend.append('file', formData.file);

    try {
      await api.post('/hoso', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Upload hồ sơ thành công!');
      setShowUploadModal(false);
      setFormData({ ID_CoHoi: '', TenHoSo: '', file: null });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi upload hồ sơ');
    }
  };

  const handleReupload = async (e) => {
    e.preventDefault();
    if (!reuploadData.file) {
      alert('Vui lòng chọn file để re-upload');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('TenHoSo', reuploadData.TenHoSo || selectedHoSo.TenHoSo);
    formDataToSend.append('file', reuploadData.file);
    if (reuploadData.GhiChu) {
      formDataToSend.append('GhiChu', reuploadData.GhiChu);
    }

    try {
      await api.put(`/hoso/${selectedHoSo.ID}/reupload`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Re-upload hồ sơ thành công!');
      setShowReuploadModal(false);
      setSelectedHoSo(null);
      setReuploadData({ TenHoSo: '', file: null, GhiChu: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi re-upload hồ sơ');
    }
  };

  const openReuploadModal = (hoSo) => {
    setSelectedHoSo(hoSo);
    setReuploadData({ TenHoSo: hoSo.TenHoSo, file: null, GhiChu: '' });
    setShowReuploadModal(true);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận duyệt hồ sơ này?')) return;
    try {
      await api.put(`/hoso/${id}/approve`);
      alert('Đã duyệt hồ sơ thành công!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi duyệt hồ sơ');
    }
  };

  const handleReject = async (id) => {
    const ghiChu = prompt('Nhập lý do từ chối:');
    if (!ghiChu) return;
    try {
      await api.put(`/hoso/${id}/reject`, { GhiChu: ghiChu });
      alert('Đã từ chối hồ sơ');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi từ chối hồ sơ');
    }
  };

  const handleDownload = async (id, tenHoSo) => {
    try {
      const response = await api.get(`/hoso/${id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', tenHoSo);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Lỗi khi tải file');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Chờ duyệt': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'Đã duyệt': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'Bổ sung': { color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    const badge = badges[status] || badges['Chờ duyệt'];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon size={16} />
        {status}
      </span>
    );
  };

  const filteredHoSos = hoSos.filter(hs => {
    if (filter === 'all') return true;
    return hs.TrangThaiHoSo === filter;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Hồ sơ</h1>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={20} />
          Upload Hồ sơ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-700">
                {hoSos.filter(h => h.TrangThaiHoSo === 'Chờ duyệt').length}
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-700">
                {hoSos.filter(h => h.TrangThaiHoSo === 'Đã duyệt').length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Bổ sung</p>
              <p className="text-2xl font-bold text-red-700">
                {hoSos.filter(h => h.TrangThaiHoSo === 'Bổ sung').length}
              </p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Tổng hồ sơ</p>
              <p className="text-2xl font-bold text-blue-700">{hoSos.length}</p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex gap-2 border-b pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả ({hoSos.length})
          </button>
          <button
            onClick={() => setFilter('Chờ duyệt')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'Chờ duyệt' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Chờ duyệt ({hoSos.filter(h => h.TrangThaiHoSo === 'Chờ duyệt').length})
          </button>
          <button
            onClick={() => setFilter('Đã duyệt')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'Đã duyệt' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Đã duyệt ({hoSos.filter(h => h.TrangThaiHoSo === 'Đã duyệt').length})
          </button>
          <button
            onClick={() => setFilter('Bổ sung')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'Bổ sung' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bổ sung ({hoSos.filter(h => h.TrangThaiHoSo === 'Bổ sung').length})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên hồ sơ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cơ hội</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày upload</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày duyệt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHoSos.map((hoSo) => (
                <tr key={hoSo.ID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{hoSo.ID}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{hoSo.TenHoSo}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coHois.find(c => c.ID === hoSo.ID_CoHoi)?.TenCoHoi || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(hoSo.TrangThaiHoSo)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(hoSo.NgayUpload).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {hoSo.NgayDuyet ? new Date(hoSo.NgayDuyet).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {hoSo.GhiChu || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(hoSo.ID, hoSo.FileHoSo)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Tải xuống"
                      >
                        <Download size={18} />
                      </button>
                      {user?.roleId >= 2 && hoSo.TrangThaiHoSo === 'Chờ duyệt' && (
                        <>
                          <button
                            onClick={() => handleApprove(hoSo.ID)}
                            className="text-green-600 hover:text-green-800"
                            title="Duyệt"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(hoSo.ID)}
                            className="text-red-600 hover:text-red-800"
                            title="Từ chối"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {hoSo.TrangThaiHoSo === 'Bổ sung' && (
                        <button
                          onClick={() => openReuploadModal(hoSo)}
                          className="text-orange-600 hover:text-orange-800 font-medium"
                          title="Re-upload hồ sơ"
                        >
                          <Upload size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHoSos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Không có hồ sơ nào
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Upload Hồ sơ bảo hiểm</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFormData({ ID_CoHoi: '', TenHoSo: '', file: null });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cơ hội <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ID_CoHoi}
                  onChange={(e) => setFormData({ ...formData, ID_CoHoi: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Chọn cơ hội --</option>
                  {coHois
                    .filter(c => c.TrangThaiCoHoi === 'Chờ xử lý' || c.TrangThaiCoHoi === 'Mới')
                    .map(coHoi => (
                      <option key={coHoi.ID} value={coHoi.ID}>
                        {coHoi.TenCoHoi} ({coHoi.TrangThaiCoHoi})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên hồ sơ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.TenHoSo}
                  onChange={(e) => setFormData({ ...formData, TenHoSo: e.target.value })}
                  className="input-field"
                  placeholder="VD: Hồ sơ bảo hiểm nhân thọ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File đính kèm <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="input-field"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hỗ trợ: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Re-upload Modal */}
      {showReuploadModal && selectedHoSo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Re-upload Hồ sơ</h2>
              <button
                onClick={() => {
                  setShowReuploadModal(false);
                  setSelectedHoSo(null);
                  setReuploadData({ TenHoSo: '', file: null, GhiChu: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleReupload} className="p-6 space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-700">
                  <strong>Lý do từ chối:</strong> {selectedHoSo.GhiChu || 'Không có'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên hồ sơ
                </label>
                <input
                  type="text"
                  value={reuploadData.TenHoSo}
                  onChange={(e) => setReuploadData({ ...reuploadData, TenHoSo: e.target.value })}
                  className="input-field"
                  placeholder={selectedHoSo.TenHoSo}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu giữ nguyên tên: "{selectedHoSo.TenHoSo}"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File đính kèm mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setReuploadData({ ...reuploadData, file: e.target.files[0] })}
                  className="input-field"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hỗ trợ: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={reuploadData.GhiChu}
                  onChange={(e) => setReuploadData({ ...reuploadData, GhiChu: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Ghi chú về việc re-upload..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  Re-upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
