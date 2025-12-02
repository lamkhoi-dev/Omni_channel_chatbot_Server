import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { khachhangAPI } from '../lib/api';
import { useForm, useWatch } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, X, User, Building2, Eye, Download } from 'lucide-react';

export default function KhachHang() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [loai, setLoai] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      LoaiKhachHang: 'Cá nhân'
    }
  });

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['khachhang', page, search, trangThai, loai],
    queryFn: () => khachhangAPI.getAll({ page, limit: 20, search, trangThai, loai }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data) => editingId 
      ? khachhangAPI.update(editingId, data)
      : khachhangAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['khachhang']);
      setShowModal(false);
      reset();
      setEditingId(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => khachhangAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['khachhang']);
    },
  });

  // Handle edit from detail page
  useEffect(() => {
    const editCustomerId = location.state?.editCustomerId;
    if (editCustomerId) {
      // Load customer data and open modal
      khachhangAPI.getById(editCustomerId).then(response => {
        if (response.data.success) {
          const customer = response.data.data;
          handleEdit(customer);
        }
      }).catch(error => {
        console.error('Error loading customer for edit:', error);
      });
      
      // Clear state after loading
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleEdit = async (customer) => {
    setEditingId(customer.ID);
    Object.keys(customer).forEach(key => setValue(key, customer[key]));
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khách hàng này?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (formData) => {
    saveMutation.mutate(formData);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
    setEditingId(null);
  };

  const handleExportExcel = async () => {
    try {
      const response = await khachhangAPI.exportExcel({ search, trangThai, loai });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KhachHang_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Lỗi xuất file Excel');
    }
  };

  const customers = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Khách hàng</h1>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2">
            <Download size={20} />
            Xuất Excel
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <select value={loai} onChange={(e) => setLoai(e.target.value)} className="input-field">
            <option value="">Tất cả loại</option>
            <option value="Cá nhân">Cá nhân</option>
            <option value="Doanh nghiệp">Doanh nghiệp</option>
          </select>
          <select value={trangThai} onChange={(e) => setTrangThai(e.target.value)} className="input-field">
            <option value="">Tất cả trạng thái</option>
            <option value="Tiềm năng">Tiềm năng</option>
            <option value="Đang chăm sóc">Đang chăm sóc</option>
            <option value="Thành công">Thành công</option>
            <option value="Rời bỏ">Rời bỏ</option>
            <option value="Không tiềm năng">Không tiềm năng</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {customer.LoaiKhachHang === 'Cá nhân' ? <User size={16} /> : <Building2 size={16} />}
                          <span className="font-medium">{customer.TenKhachHang || customer.TenDoanhNghiep}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.LoaiKhachHang}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.SoDienThoai}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.Email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          customer.TrangThaiKhachHang === 'Thành công' ? 'bg-green-100 text-green-800' :
                          customer.TrangThaiKhachHang === 'Đang chăm sóc' ? 'bg-blue-100 text-blue-800' :
                          customer.TrangThaiKhachHang === 'Tiềm năng' ? 'bg-yellow-100 text-yellow-800' :
                          customer.TrangThaiKhachHang === 'Rời bỏ' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.TrangThaiKhachHang}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/khachhang/${customer.ID}`)} 
                          className="text-emerald-600 hover:text-emerald-900 mr-3"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleEdit(customer)} className="text-primary-600 hover:text-primary-900 mr-3">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(customer.ID)} className="text-red-600 hover:text-red-900">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? 'Sửa' : 'Thêm'} khách hàng</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <ModalFormContent 
                register={register} 
                control={control}
                handleCloseModal={handleCloseModal}
                saveMutation={saveMutation}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component for form fields with conditional rendering
function ModalFormContent({ register, control, handleCloseModal, saveMutation }) {
  const loaiKhachHang = useWatch({
    control,
    name: 'LoaiKhachHang',
    defaultValue: 'Cá nhân'
  });

  const isCaNhan = loaiKhachHang === 'Cá nhân';

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-2">Loại khách hàng <span className="text-red-500">*</span></label>
        <select {...register('LoaiKhachHang', { required: true })} className="input-field">
          <option value="Cá nhân">Cá nhân</option>
          <option value="Doanh nghiệp">Doanh nghiệp</option>
        </select>
      </div>

      {isCaNhan ? (
        // Fields for Cá nhân
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Tên khách hàng <span className="text-red-500">*</span></label>
            <input
              {...register('TenKhachHang', { required: isCaNhan })}
              className="input-field"
              placeholder="Nhập họ và tên"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CCCD</label>
              <input
                {...register('CCCD')}
                className="input-field"
                placeholder="Số căn cước công dân"
                maxLength="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ngày sinh</label>
              <input
                {...register('NgaySinh')}
                type="date"
                className="input-field"
              />
            </div>
          </div>
        </>
      ) : (
        // Fields for Doanh nghiệp
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Tên doanh nghiệp <span className="text-red-500">*</span></label>
            <input
              {...register('TenDoanhNghiep', { required: !isCaNhan })}
              className="input-field"
              placeholder="Nhập tên doanh nghiệp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mã số thuế</label>
              <input
                {...register('MaSoThue')}
                className="input-field"
                placeholder="Mã số thuế doanh nghiệp"
                maxLength="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ngày thành lập</label>
              <input
                {...register('NgayThanhLap')}
                type="date"
                className="input-field"
              />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Số điện thoại <span className="text-red-500">*</span></label>
          <input
            {...register('SoDienThoai', { required: true })}
            className="input-field"
            placeholder="0987654321"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            {...register('Email')}
            type="email"
            className="input-field"
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Địa chỉ</label>
        <input
          {...register('DiaChi')}
          className="input-field"
          placeholder="Nhập địa chỉ"
        />
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
        <button type="button" onClick={handleCloseModal} className="btn-secondary">
          Hủy
        </button>
        <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </>
  );
}
