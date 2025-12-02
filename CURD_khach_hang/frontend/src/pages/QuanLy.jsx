import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Edit, Lock, Unlock, Trash2, 
  Search, Filter, CheckCircle, XCircle 
} from 'lucide-react';
import { quanlyAPI } from '../lib/api';

export default function QuanLy() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    TenNhanVien: '',
    Username: '',
    MatKhau: '',
    Email: '',
    CCCD: '',
    ID_Role: '1',
    TrangThaiNhanVien: 'Hoạt động'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await quanlyAPI.getAllNhanVien();
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      TenNhanVien: '',
      Username: '',
      MatKhau: '',
      Email: '',
      CCCD: '',
      ID_Role: '1',
      TrangThaiNhanVien: 'Hoạt động'
    });
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      TenNhanVien: employee.TenNhanVien,
      Username: employee.Username,
      MatKhau: '', // Không hiển thị mật khẩu cũ
      Email: employee.Email || '',
      CCCD: employee.CCCD || '',
      ID_Role: employee.ID_Role.toString(),
      TrangThaiNhanVien: employee.TrangThaiNhanVien
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        // Update
        const updateData = { ...formData };
        if (!updateData.MatKhau) delete updateData.MatKhau; // Không gửi mật khẩu nếu để trống
        
        await quanlyAPI.updateNhanVien(editingEmployee.ID, updateData);
        alert('Cập nhật nhân viên thành công!');
      } else {
        // Create
        await quanlyAPI.createNhanVien(formData);
        alert('Thêm nhân viên thành công!');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Hoạt động' ? 'Khóa' : 'Hoạt động';
    if (confirm(`Bạn có chắc muốn ${newStatus === 'Khóa' ? 'khóa' : 'kích hoạt'} tài khoản này?`)) {
      try {
        await quanlyAPI.updateNhanVien(id, { TrangThaiNhanVien: newStatus });
        alert(`${newStatus === 'Khóa' ? 'Khóa' : 'Kích hoạt'} tài khoản thành công!`);
        fetchEmployees();
      } catch (error) {
        alert('Có lỗi xảy ra!');
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc muốn xóa nhân viên này? Hành động này không thể hoàn tác!')) {
      try {
        await quanlyAPI.deleteNhanVien(id);
        alert('Xóa nhân viên thành công!');
        fetchEmployees();
      } catch (error) {
        alert(error.response?.data?.message || 'Có lỗi xảy ra!');
      }
    }
  };

  const getRoleName = (roleId) => {
    const roles = { 1: 'Nhân viên', 2: 'Quản lý', 3: 'Ban giám đốc' };
    return roles[roleId] || 'Không xác định';
  };

  const getRoleBadge = (roleId) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-purple-100 text-purple-800',
      3: 'bg-red-100 text-red-800'
    };
    return colors[roleId] || 'bg-gray-100 text-gray-800';
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.TenNhanVien.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       emp.Username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = !filterRole || emp.ID_Role.toString() === filterRole;
    const matchStatus = !filterStatus || emp.TrangThaiNhanVien === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
        <button
          onClick={handleAdd}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả vai trò</option>
            <option value="1">Nhân viên</option>
            <option value="2">Quản lý</option>
            <option value="3">Ban giám đốc</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Khóa">Khóa</option>
          </select>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Không tìm thấy nhân viên nào</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên nhân viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CCCD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEmployees.map((emp) => (
                <tr key={emp.ID} className="hover:bg-gray-50">
                  <td className="px-6 py-4">#{emp.ID}</td>
                  <td className="px-6 py-4 font-medium">{emp.TenNhanVien}</td>
                  <td className="px-6 py-4">{emp.Username}</td>
                  <td className="px-6 py-4">{emp.Email || '-'}</td>
                  <td className="px-6 py-4">{emp.CCCD || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadge(emp.ID_Role)}`}>
                      {getRoleName(emp.ID_Role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs ${
                      emp.TrangThaiNhanVien === 'Hoạt động' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {emp.TrangThaiNhanVien === 'Hoạt động' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {emp.TrangThaiNhanVien}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp.ID, emp.TrangThaiNhanVien)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title={emp.TrangThaiNhanVien === 'Hoạt động' ? 'Khóa' : 'Kích hoạt'}
                      >
                        {emp.TrangThaiNhanVien === 'Hoạt động' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(emp.ID)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên nhân viên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.TenNhanVien}
                  onChange={(e) => setFormData({ ...formData, TenNhanVien: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.Username}
                  onChange={(e) => setFormData({ ...formData, Username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mật khẩu {editingEmployee ? '(để trống nếu không đổi)' : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingEmployee}
                  value={formData.MatKhau}
                  onChange={(e) => setFormData({ ...formData, MatKhau: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CCCD</label>
                <input
                  type="text"
                  value={formData.CCCD}
                  onChange={(e) => setFormData({ ...formData, CCCD: e.target.value })}
                  placeholder="Số căn cước công dân"
                  maxLength="20"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vai trò <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.ID_Role}
                  onChange={(e) => setFormData({ ...formData, ID_Role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1">Nhân viên</option>
                  <option value="2">Quản lý</option>
                  <option value="3">Ban giám đốc</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.TrangThaiNhanVien}
                  onChange={(e) => setFormData({ ...formData, TrangThaiNhanVien: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Khóa">Khóa</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                >
                  {editingEmployee ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
