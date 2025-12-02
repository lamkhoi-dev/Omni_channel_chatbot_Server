import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    // Đọc token từ Zustand persist storage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Chỉ redirect về login nếu:
    // 1. Lỗi 401 (Unauthorized)
    // 2. Đã có token trong localStorage (đã đăng nhập trước đó)
    // 3. Không phải đang ở trang login
    if (error.response?.status === 401) {
      const authStorage = localStorage.getItem('auth-storage');
      const isLoginPage = window.location.pathname === '/login';
      
      // Chỉ redirect nếu đã đăng nhập và không phải trang login
      // (tức là token hết hạn trong khi đang dùng app)
      if (authStorage && !isLoginPage) {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Customer API
export const khachhangAPI = {
  getAll: (params) => api.get('/khachhang', { params }),
  getById: (id) => api.get(`/khachhang/${id}`),
  create: (data) => api.post('/khachhang', data),
  update: (id, data) => api.put(`/khachhang/${id}`, data),
  delete: (id) => api.delete(`/khachhang/${id}`),
  exportExcel: (params) => api.get('/khachhang/export/excel', { params, responseType: 'blob' }),
};

// Opportunity API
export const cohoiAPI = {
  getAll: (params) => api.get('/cohoi', { params }),
  getById: (id) => api.get(`/cohoi/${id}`),
  create: (data) => api.post('/cohoi', data),
  update: (id, data) => api.put(`/cohoi/${id}`, data),
  updateStatus: (id, data) => api.put(`/cohoi/${id}/status`, data),
  delete: (id) => api.delete(`/cohoi/${id}`),
  exportExcel: (params) => api.get('/cohoi/export/excel', { params, responseType: 'blob' }),
};

// Appointment API
export const lichhenAPI = {
  getAll: (params) => api.get('/lichhen', { params }),
  getToday: () => api.get('/lichhen/today'),
  getById: (id) => api.get(`/lichhen/${id}`),
  create: (data) => api.post('/lichhen', data),
  update: (id, data) => api.put(`/lichhen/${id}`, data),
  complete: (id, data) => api.put(`/lichhen/${id}/complete`, data),
  cancel: (id, data) => api.put(`/lichhen/${id}/cancel`, data),
  delete: (id) => api.delete(`/lichhen/${id}`),
};

// Document API
export const hosoAPI = {
  getAll: (params) => api.get('/hoso', { params }),
  getById: (id) => api.get(`/hoso/${id}`),
  upload: (formData) => api.post('/hoso', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approve: (id, data) => api.put(`/hoso/${id}/approve`, data),
  reject: (id, data) => api.put(`/hoso/${id}/reject`, data),
  download: (id) => api.get(`/hoso/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/hoso/${id}`),
};

// Contract API
export const hopdongAPI = {
  getAll: (params) => api.get('/hopdong', { params }),
  getExpiring: (params) => api.get('/hopdong/expiring', { params }),
  getById: (id) => api.get(`/hopdong/${id}`),
  create: (formData) => api.post('/hopdong', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/hopdong/${id}`, data),
  delete: (id) => api.delete(`/hopdong/${id}`),
};

// Report API
export const baocaoAPI = {
  getDoanhThu: (params) => api.get('/baocao/doanhthu', { params }),
  getKPI: (id, params) => api.get(`/baocao/kpi/${id}`, { params }),
  getTopNhanVien: (params) => api.get('/baocao/top-nhanvien', { params }),
  getTongHop: () => api.get('/baocao/tonghop'),
  exportExcel: (params) => api.get('/baocao/export/excel', { 
    params, 
    responseType: 'blob' 
  }),
  exportPDF: (params) => api.get('/baocao/export/pdf', { 
    params, 
    responseType: 'blob' 
  }),
};

// Management API
export const quanlyAPI = {
  getAllNhanVien: (params) => api.get('/quanly/nhanvien', { params }),
  getNhanVienById: (id) => api.get(`/quanly/nhanvien/${id}`),
  createNhanVien: (data) => api.post('/quanly/nhanvien', data),
  updateNhanVien: (id, data) => api.put(`/quanly/nhanvien/${id}`, data),
  deleteNhanVien: (id) => api.delete(`/quanly/nhanvien/${id}`),
  getPendingHoSo: (params) => api.get('/quanly/hoso/pending', { params }),
  getOverdueLichHen: (params) => api.get('/quanly/lichhen/overdue', { params }),
};

// Notification API
export const thongbaoAPI = {
  getAll: (params) => api.get('/thongbao', { params }),
  markAsRead: (id) => api.put(`/thongbao/${id}/read`),
  markAllAsRead: () => api.put('/thongbao/read-all'),
};

export default api;
