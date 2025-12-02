import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { thongbaoAPI } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { Bell, BellOff, CheckCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ThongBao() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();
  const [filter, setFilter] = useState('');

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['thongbao', filter],
    queryFn: () => thongbaoAPI.getAll({ trangThai: filter }),
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => thongbaoAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['thongbao']);
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => thongbaoAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['thongbao']);
    },
  });

  // Listen to Socket.IO for new notifications
  useEffect(() => {
    const handleNewNotification = () => {
      queryClient.invalidateQueries(['thongbao']);
    };

    on('new-appointment', handleNewNotification);
    on('notification', handleNewNotification);
    on('hoso-approved', handleNewNotification);

    return () => {
      off('new-appointment', handleNewNotification);
      off('notification', handleNewNotification);
      off('hoso-approved', handleNewNotification);
    };
  }, [on, off, queryClient]);

  const notifications = data?.data?.data || [];
  const unreadCount = data?.data?.unread || 0;

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'Lịch hẹn mới': return <Calendar className="text-blue-600" size={20} />;
      case 'Hồ sơ duyệt': return <FileCheck className="text-green-600" size={20} />;
      case 'Tái tục': return <Clock className="text-orange-600" size={20} />;
      default: return <Bell className="text-gray-600" size={20} />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-600 mt-1">
            Bạn có <strong>{unreadCount}</strong> thông báo chưa đọc
          </p>
        </div>
        <button
          onClick={() => markAllReadMutation.mutate()}
          disabled={unreadCount === 0 || markAllReadMutation.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <CheckCheck size={20} />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg ${filter === '' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('Chưa đọc')}
            className={`px-4 py-2 rounded-lg ${filter === 'Chưa đọc' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('Đã đọc')}
            className={`px-4 py-2 rounded-lg ${filter === 'Đã đọc' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
          >
            Đã đọc
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="card text-center py-8">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-8">
            <BellOff size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.ID}
              onClick={() => notification.TrangThaiThongBao === 'Chưa đọc' && markReadMutation.mutate(notification.ID)}
              className={`card cursor-pointer transition-colors ${
                notification.TrangThaiThongBao === 'Chưa đọc' 
                  ? 'bg-blue-50 border-l-4 border-primary-600' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getNotificationIcon(notification.LoaiThongBao)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{notification.LoaiThongBao}</h3>
                    <span className="text-xs text-gray-500">
                      {format(new Date(notification.NgayTao), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-gray-700">{notification.NoiDung}</p>
                  {notification.TrangThaiThongBao === 'Chưa đọc' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                        <Bell size={12} className="mr-1" />
                        Mới
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Missing import fix
import { Calendar, FileCheck } from 'lucide-react';
