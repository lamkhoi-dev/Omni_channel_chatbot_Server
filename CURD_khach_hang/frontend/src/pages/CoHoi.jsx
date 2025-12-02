import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cohoiAPI, khachhangAPI } from '../lib/api';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, X, TrendingUp, CheckCircle, XCircle, Download } from 'lucide-react';

export default function CoHoi() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCoHoi, setSelectedCoHoi] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const { register: registerStatus, handleSubmit: handleSubmitStatus, reset: resetStatus } = useForm();

  // Fetch opportunities
  const { data, isLoading } = useQuery({
    queryKey: ['cohoi', page, search, trangThai],
    queryFn: () => cohoiAPI.getAll({ page, limit: 20, search, trangThai }),
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['khachhang-all'],
    queryFn: () => khachhangAPI.getAll({ limit: 1000 }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data) => editingId 
      ? cohoiAPI.update(editingId, data)
      : cohoiAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cohoi']);
      queryClient.invalidateQueries(['khachhang']);
      setShowModal(false);
      reset();
      setEditingId(null);
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, ...data }) => cohoiAPI.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cohoi']);
      queryClient.invalidateQueries(['khachhang']);
      setShowStatusModal(false);
      resetStatus();
      setSelectedCoHoi(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => cohoiAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['cohoi']);
    },
  });

  const handleEdit = async (cohoi) => {
    setEditingId(cohoi.ID);
    Object.keys(cohoi).forEach(key => setValue(key, cohoi[key]));
    setShowModal(true);
  };

  const handleStatusChange = (cohoi) => {
    setSelectedCoHoi(cohoi);
    setShowStatusModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa cơ hội này?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (formData) => {
    saveMutation.mutate(formData);
  };

  const onSubmitStatus = (formData) => {
    statusMutation.mutate({ id: selectedCoHoi.ID, ...formData });
  };

  const handleExportExcel = async () => {
    try {
      const response = await cohoiAPI.exportExcel({ search, trangThai });
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `CoHoi_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Có lỗi khi xuất file Excel');
    }
  };

  const opportunities = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};
  const customers = customersData?.data?.data || [];

  // State machine validation
  const getAvailableStatuses = (currentStatus) => {
    const transitions = {
      'Mới': ['Chờ xử lý', 'Thất bại'],
      'Chờ xử lý': ['Thành công', 'Thất bại'],
      'Thành công': [],
      'Thất bại': []
    };
    return transitions[currentStatus] || [];
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Mới': return 'bg-blue-100 text-blue-800';
      case 'Chờ xử lý': return 'bg-yellow-100 text-yellow-800';
      case 'Thành công': return 'bg-green-100 text-green-800';
      case 'Thất bại': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Cơ hội</h1>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Tải xuống
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Thêm cơ hội
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={trangThai} onChange={(e) => setTrangThai(e.target.value)} className="input-field">
            <option value="">Tất cả trạng thái</option>
            <option value="Mới">Mới</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Thành công">Thành công</option>
            <option value="Thất bại">Thất bại</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên cơ hội</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {opportunities.map((cohoi) => (
                    <tr key={cohoi.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-primary-600" />
                          <span className="font-medium">{cohoi.TenCoHoi}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{cohoi.TenKhachHang || cohoi.TenDoanhNghiep}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {cohoi.GiaTri ? Number(cohoi.GiaTri).toLocaleString('vi-VN') + 'đ' : '0đ'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {cohoi.NgayTao ? new Date(cohoi.NgayTao).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusChange(cohoi)}
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cohoi.TrangThaiCoHoi)}`}
                        >
                          {cohoi.TrangThaiCoHoi}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(cohoi)} className="text-primary-600 hover:text-primary-900 mr-3">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(cohoi.ID)} className="text-red-600 hover:text-red-900">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-700">
                Trang {pagination.page} / {pagination.totalPages} - Tổng: {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? 'Sửa' : 'Thêm'} cơ hội</h2>
              <button onClick={() => { setShowModal(false); reset(); setEditingId(null); }} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Khách hàng <span className="text-red-500">*</span></label>
                <select {...register('ID_KhachHang', { required: true })} className="input-field">
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(kh => (
                    <option key={kh.ID} value={kh.ID}>
                      {kh.TenKhachHang || kh.TenDoanhNghiep} - {kh.SoDienThoai}
                    </option>
                  ))}
                </select>
                {errors.ID_KhachHang && <p className="text-red-500 text-sm mt-1">Vui lòng chọn khách hàng</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tên cơ hội <span className="text-red-500">*</span></label>
                <input
                  {...register('TenCoHoi', { required: true })}
                  className="input-field"
                  placeholder="VD: Bảo hiểm xe ô tô"
                />
                {errors.TenCoHoi && <p className="text-red-500 text-sm mt-1">Vui lòng nhập tên cơ hội</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Giá trị dự kiến (VND) <span className="text-red-500">*</span></label>
                <input
                  {...register('GiaTri', { required: true })}
                  type="number"
                  className="input-field"
                  placeholder="10000000"
                />
                {errors.GiaTri && <p className="text-red-500 text-sm mt-1">Vui lòng nhập giá trị</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  {...register('GhiChu')}
                  className="input-field"
                  rows={3}
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedCoHoi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Cập nhật trạng thái</h2>
              <button onClick={() => { setShowStatusModal(false); resetStatus(); }} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitStatus(onSubmitStatus)} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Cơ hội: <strong>{selectedCoHoi.TenCoHoi}</strong></p>
                <p className="text-sm text-gray-600 mb-4">Trạng thái hiện tại: <strong>{selectedCoHoi.TrangThaiCoHoi}</strong></p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Trạng thái mới <span className="text-red-500">*</span></label>
                <select {...registerStatus('TrangThai', { required: true })} className="input-field">
                  <option value="">-- Chọn trạng thái --</option>
                  {getAvailableStatuses(selectedCoHoi.TrangThaiCoHoi).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  {...registerStatus('GhiChu')}
                  className="input-field"
                  rows={3}
                  placeholder="Lý do thay đổi trạng thái..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowStatusModal(false); resetStatus(); }} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={statusMutation.isPending}>
                  {statusMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
