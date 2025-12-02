import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lichhenAPI, cohoiAPI } from '../lib/api';
import { useForm } from 'react-hook-form';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, XCircle, X } from 'lucide-react';
import { format } from 'date-fns';

export default function LichHen() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionType, setActionType] = useState(''); // 'complete' or 'cancel'

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerAction, handleSubmit: handleSubmitAction, reset: resetAction } = useForm();

  // Fetch today's appointments
  const { data: todayData } = useQuery({
    queryKey: ['lichhen-today'],
    queryFn: () => lichhenAPI.getToday(),
  });

  // Fetch all appointments
  const { data, isLoading } = useQuery({
    queryKey: ['lichhen'],
    queryFn: () => lichhenAPI.getAll({ limit: 100 }),
  });

  // Fetch opportunities for dropdown
  const { data: cohoiData } = useQuery({
    queryKey: ['cohoi-all'],
    queryFn: () => cohoiAPI.getAll({ limit: 1000 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => lichhenAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lichhen']);
      queryClient.invalidateQueries(['lichhen-today']);
      queryClient.invalidateQueries(['cohoi']);
      setShowModal(false);
      reset();
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, ...data }) => lichhenAPI.complete(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lichhen']);
      queryClient.invalidateQueries(['lichhen-today']);
      queryClient.invalidateQueries(['cohoi']);
      setShowActionModal(false);
      resetAction();
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, ...data }) => lichhenAPI.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lichhen']);
      queryClient.invalidateQueries(['lichhen-today']);
      queryClient.invalidateQueries(['cohoi']);
      setShowActionModal(false);
      resetAction();
    },
  });

  const handleComplete = (appointment) => {
    setSelectedAppointment(appointment);
    setActionType('complete');
    setShowActionModal(true);
  };

  const handleCancel = (appointment) => {
    setSelectedAppointment(appointment);
    setActionType('cancel');
    setShowActionModal(true);
  };

  const onSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  const onSubmitAction = (formData) => {
    if (actionType === 'complete') {
      completeMutation.mutate({ id: selectedAppointment.ID, ...formData });
    } else {
      cancelMutation.mutate({ id: selectedAppointment.ID, ...formData });
    }
  };

  const appointments = data?.data?.data || [];
  const todayAppointments = todayData?.data?.data || [];
  const opportunities = cohoiData?.data?.data || [];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Sắp diễn ra': return 'bg-blue-100 text-blue-800';
      case 'Hoàn thành': return 'bg-green-100 text-green-800';
      case 'Hủy': return 'bg-red-100 text-red-800';
      case 'Quá hạn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Lịch hẹn</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Tạo lịch hẹn
        </button>
      </div>

      {/* Today's Appointments */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CalendarIcon size={24} className="text-primary-600" />
          Lịch hẹn hôm nay ({todayAppointments.length})
        </h2>
        {todayAppointments.length === 0 ? (
          <p className="text-gray-500">Không có lịch hẹn nào hôm nay</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((app) => (
              <div key={app.ID} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-primary-600" />
                    <span className="font-medium">{format(new Date(app.ThoiGianHen), 'HH:mm')}</span>
                    <span className="text-gray-600">- {app.TenCoHoi}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    {app.DiaDiem}
                  </div>
                </div>
                <div className="flex gap-2">
                  {app.TrangThaiLichHen === 'Sắp diễn ra' && (
                    <>
                      <button onClick={() => handleComplete(app)} className="btn-primary flex items-center gap-1 text-sm">
                        <CheckCircle size={16} />
                        Hoàn thành
                      </button>
                      <button onClick={() => handleCancel(app)} className="btn-secondary flex items-center gap-1 text-sm">
                        <XCircle size={16} />
                        Hủy
                      </button>
                    </>
                  )}
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(app.TrangThaiLichHen)}`}>
                    {app.TrangThaiLichHen}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Appointments Table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Tất cả lịch hẹn</h2>
        {isLoading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cơ hội</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa điểm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((app) => (
                  <tr key={app.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(app.ThoiGianHen), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{app.TenCoHoi}</td>
                    <td className="px-6 py-4 text-sm">{app.DiaDiem}</td>
                    <td className="px-6 py-4 text-sm">{app.NoiDung}</td>
                    <td className="px-6 py-4 text-sm">
                      {app.KetQuaSauCuocHen ? (
                        <span className="text-gray-700">{app.KetQuaSauCuocHen}</span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(app.TrangThaiLichHen)}`}>
                        {app.TrangThaiLichHen}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {app.TrangThaiLichHen === 'Sắp diễn ra' && (
                        <>
                          <button onClick={() => handleComplete(app)} className="text-green-600 hover:text-green-900 mr-2">
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => handleCancel(app)} className="text-red-600 hover:text-red-900">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Tạo lịch hẹn</h2>
              <button onClick={() => { setShowModal(false); reset(); }} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cơ hội <span className="text-red-500">*</span></label>
                <select {...register('ID_CoHoi', { required: true })} className="input-field">
                  <option value="">-- Chọn cơ hội --</option>
                  {opportunities.map(co => (
                    <option key={co.ID} value={co.ID}>
                      {co.TenCoHoi} - {co.TenKhachHang || co.TenDoanhNghiep}
                    </option>
                  ))}
                </select>
                {errors.ID_CoHoi && <p className="text-red-500 text-sm mt-1">Vui lòng chọn cơ hội</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày hẹn <span className="text-red-500">*</span></label>
                  <input
                    {...register('ThoiGianHen', { required: true })}
                    type="datetime-local"
                    className="input-field"
                  />
                  {errors.ThoiGianHen && <p className="text-red-500 text-sm mt-1">Vui lòng chọn thời gian</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Địa điểm <span className="text-red-500">*</span></label>
                  <input
                    {...register('DiaDiem', { required: true })}
                    className="input-field"
                    placeholder="Văn phòng công ty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nội dung <span className="text-red-500">*</span></label>
                <textarea
                  {...register('NoiDung', { required: true })}
                  className="input-field"
                  rows={3}
                  placeholder="Nội dung cuộc hẹn..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo lịch hẹn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (Complete/Cancel) */}
      {showActionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">
                {actionType === 'complete' ? 'Hoàn thành' : 'Hủy'} lịch hẹn
              </h2>
              <button onClick={() => { setShowActionModal(false); resetAction(); }} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitAction(onSubmitAction)} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Lịch hẹn: <strong>{selectedAppointment.TenCoHoi}</strong></p>
                <p className="text-sm text-gray-600">Thời gian: {format(new Date(selectedAppointment.ThoiGianHen), 'dd/MM/yyyy HH:mm')}</p>
              </div>

              {actionType === 'complete' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Kết quả *</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input {...registerAction('isSuccess', { required: true })} type="radio" value="true" />
                      <span>Thành công</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input {...registerAction('isSuccess')} type="radio" value="false" />
                      <span>Không thành công</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {actionType === 'complete' ? 'Kết quả sau cuộc hẹn' : 'Lý do hủy'}
                </label>
                <textarea
                  {...registerAction(actionType === 'complete' ? 'KetQuaSauCuocHen' : 'GhiChu')}
                  className="input-field"
                  rows={3}
                  placeholder="Nhập ghi chú..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowActionModal(false); resetAction(); }} className="btn-secondary">
                  Đóng
                </button>
                <button 
                  type="submit" 
                  className={actionType === 'complete' ? 'btn-primary' : 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg'}
                  disabled={completeMutation.isPending || cancelMutation.isPending}
                >
                  {completeMutation.isPending || cancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
