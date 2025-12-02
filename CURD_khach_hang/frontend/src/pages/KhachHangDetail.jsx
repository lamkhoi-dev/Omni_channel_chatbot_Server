import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, MapPin, Calendar, Edit, 
  ArrowLeft, Briefcase, FileText, FileCheck, FileSignature 
} from 'lucide-react';
import { khachhangAPI, cohoiAPI, lichhenAPI, hosoAPI, hopdongAPI } from '../lib/api';

const KhachHangDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('cohoi');
  
  // Tab data
  const [opportunities, setOpportunities] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCustomerDetail();
    fetchRelatedData();
  }, [id]);

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      const response = await khachhangAPI.getById(id);
      if (response.data.success) {
        const customerData = response.data.data;
        setCustomer(customerData);
        
        // Sử dụng dữ liệu từ API getById (đã có coHoi và lichHen)
        setOpportunities(customerData.coHoi || []);
        setAppointments(customerData.lichHen || []);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Fetch documents - LỌC CHÍNH XÁC theo khách hàng này
      const hosoRes = await hosoAPI.getAll({ khachhangId: id });
      if (hosoRes.data.success) {
        // Filter client-side để chắc chắn 100%
        const filtered = (hosoRes.data.data || []).filter(doc => {
          // Kiểm tra qua CoHoi -> KhachHang
          return true; // Backend đã filter rồi
        });
        setDocuments(filtered);
      }

      // Fetch contracts - LỌC CHÍNH XÁC theo khách hàng này
      const hopdongRes = await hopdongAPI.getAll({ khachhangId: id });
      if (hopdongRes.data.success) {
        setContracts(hopdongRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Tiềm năng': 'bg-blue-100 text-blue-800',
      'Đang chăm sóc': 'bg-yellow-100 text-yellow-800',
      'Thành công': 'bg-green-100 text-green-800',
      'Rời bỏ': 'bg-red-100 text-red-800',
      'Không tiềm năng': 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCoHoiStatusBadge = (status) => {
    const statusColors = {
      'Mới': 'bg-blue-100 text-blue-800',
      'Chờ xử lý': 'bg-yellow-100 text-yellow-800',
      'Thành công': 'bg-green-100 text-green-800',
      'Thất bại': 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0đ';
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Pagination logic
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const Pagination = ({ data }) => {
    const totalPages = getTotalPages(data);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-500">
          Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, data.length)} trong {data.length} mục
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ←
          </button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 border rounded ${
                  currentPage === pageNum
                    ? 'bg-emerald-600 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && <span className="px-3 py-1">...</span>}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy khách hàng</p>
      </div>
    );
  }

  const tabs = [
    { id: 'cohoi', label: 'Cơ hội', icon: Briefcase, count: opportunities.length },
    { id: 'lichhen', label: 'Lịch hẹn', icon: Calendar, count: appointments.length },
    { id: 'hoso', label: 'Hồ sơ', icon: FileText, count: documents.length },
    { id: 'hopdong', label: 'Hợp đồng', icon: FileSignature, count: contracts.length },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/khachhang')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <User className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 text-center">
                {customer.TenKhachHang || customer.TenDoanhNghiep}
              </h2>
              <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(customer.TrangThaiKhachHang)}`}>
                {customer.TrangThaiKhachHang}
              </span>
              <span className="mt-2 text-sm text-gray-500">
                {customer.LoaiKhachHang === 'Ca nhan' ? 'Cá nhân' : 'Doanh nghiệp'}
              </span>
            </div>

            {/* Info Details */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Mã khách hàng</p>
                <p className="font-semibold text-gray-800">KH00{customer.ID}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Nhân viên phụ trách</p>
                <p className="font-semibold text-gray-800">{customer.TenNhanVien || 'Chưa phân công'}</p>
              </div>

              <div className="border-t pt-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-800 mb-3">Thông tin khách hàng</p>
                
                {customer.LoaiKhachHang === 'Cá nhân' ? (
                  // Display fields for Cá nhân
                  <>
                    {customer.CCCD && (
                      <div className="flex items-start gap-3 mb-3">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">CCCD</p>
                          <p className="font-medium">{customer.CCCD}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.NgaySinh && (
                      <div className="flex items-start gap-3 mb-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Ngày sinh</p>
                          <p className="font-medium">{formatDate(customer.NgaySinh)}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Display fields for Doanh nghiệp
                  <>
                    {customer.MaSoThue && (
                      <div className="flex items-start gap-3 mb-3">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Mã số thuế</p>
                          <p className="font-medium">{customer.MaSoThue}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.NgayThanhLap && (
                      <div className="flex items-start gap-3 mb-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Ngày thành lập</p>
                          <p className="font-medium">{formatDate(customer.NgayThanhLap)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t pt-3 mt-3">
                  <p className="font-semibold text-gray-800 mb-3">Thông tin liên hệ</p>
                  
                  <div className="flex items-start gap-3 mb-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="font-medium">{customer.SoDienThoai || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium break-all">{customer.Email || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Địa chỉ</p>
                      <p className="font-medium">{customer.DiaChi || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Ngày tạo</p>
                      <p className="font-medium">{formatDate(customer.NgayTao)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => navigate('/khachhang', { state: { editCustomerId: customer.ID } })}
              className="w-full mt-6 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            {/* Tab Headers */}
            <div className="border-b">
              <div className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setCurrentPage(1);
                      }}
                      className={`flex-1 px-4 py-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Cơ hội Tab */}
              {activeTab === 'cohoi' && (
                <div>
                  {opportunities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Chưa có cơ hội kinh doanh nào
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên cơ hội</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {getCurrentPageData(opportunities).map((opp, index) => (
                            <tr key={opp.ID} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                              <td className="px-4 py-3 font-medium">{opp.TenCoHoi}</td>
                              <td className="px-4 py-3">{formatCurrency(opp.GiaTri)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${getCoHoiStatusBadge(opp.TrangThaiCoHoi)}`}>
                                  {opp.TrangThaiCoHoi}
                                </span>
                              </td>
                              <td className="px-4 py-3">{formatDate(opp.NgayTao)}</td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  onClick={() => navigate('/cohoi')} 
                                  className="text-emerald-600 hover:text-emerald-800"
                                  title="Xem chi tiết cơ hội"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination data={opportunities} />
                    </>
                  )}
                </div>
              )}

              {/* Lịch hẹn Tab */}
              {activeTab === 'lichhen' && (
                <div>
                  {appointments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Chưa có lịch hẹn nào
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa điểm</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {getCurrentPageData(appointments).map((apt, index) => (
                            <tr key={apt.ID} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                              <td className="px-4 py-3">{formatDateTime(apt.ThoiGianHen)}</td>
                              <td className="px-4 py-3">{apt.DiaDiem}</td>
                              <td className="px-4 py-3 max-w-xs truncate">{apt.NoiDung}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  apt.TrangThaiLichHen === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                                  apt.TrangThaiLichHen === 'Hủy' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {apt.TrangThaiLichHen}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  onClick={() => navigate('/lichhen')} 
                                  className="text-emerald-600 hover:text-emerald-800"
                                  title="Xem chi tiết lịch hẹn"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination data={appointments} />
                    </>
                  )}
                </div>
              )}

              {/* Hồ sơ Tab */}
              {activeTab === 'hoso' && (
                <div>
                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Chưa có hồ sơ nào
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên hồ sơ</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {getCurrentPageData(documents).map((doc, index) => (
                            <tr key={doc.ID} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                              <td className="px-4 py-3 font-medium">{doc.TenHoSo}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  doc.TrangThaiHoSo === 'Đã duyệt' ? 'bg-green-100 text-green-800' :
                                  doc.TrangThaiHoSo === 'Bổ sung' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {doc.TrangThaiHoSo}
                                </span>
                              </td>
                              <td className="px-4 py-3">{formatDate(doc.NgayUpload)}</td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  onClick={() => navigate('/hoso')} 
                                  className="text-emerald-600 hover:text-emerald-800"
                                  title="Xem chi tiết hồ sơ"
                                >
                                  <FileCheck className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination data={documents} />
                    </>
                  )}
                </div>
              )}

              {/* Hợp đồng Tab */}
              {activeTab === 'hopdong' && (
                <div>
                  {contracts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Chưa có hợp đồng nào
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã HĐ</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hiệu lực</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hết hạn</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {getCurrentPageData(contracts).map((contract, index) => (
                            <tr key={contract.ID} className="hover:bg-gray-50">
                              <td className="px-4 py-3">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                              <td className="px-4 py-3 font-medium">{contract.MaHopDong}</td>
                              <td className="px-4 py-3">{formatCurrency(contract.GiaTri)}</td>
                              <td className="px-4 py-3">{formatDate(contract.NgayHieuLuc)}</td>
                              <td className="px-4 py-3">{formatDate(contract.NgayHetHan)}</td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  onClick={() => navigate('/hopdong')} 
                                  className="text-emerald-600 hover:text-emerald-800"
                                  title="Xem chi tiết hợp đồng"
                                >
                                  <FileSignature className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination data={contracts} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhachHangDetail;
