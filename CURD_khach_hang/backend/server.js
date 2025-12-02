const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

// Import config
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const khachhangRoutes = require('./routes/khachhang');
const cohoiRoutes = require('./routes/cohoi');
const lichhenRoutes = require('./routes/lichhen');
const hosoRoutes = require('./routes/hoso');
const hopdongRoutes = require('./routes/hopdong');
const baocaoRoutes = require('./routes/baocao');
const quanlyRoutes = require('./routes/quanly');
const thongbaoRoutes = require('./routes/thongbao');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Make io accessible in routes
app.set('io', io);

// Socket.IO authentication middleware
const jwt = require('jsonwebtoken');
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.roleId = decoded.roleId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`✅ User ${socket.userId} connected`);
  
  // Join user's room
  socket.join(`user_${socket.userId}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.userId} disconnected`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/khachhang', khachhangRoutes);
app.use('/api/cohoi', cohoiRoutes);
app.use('/api/lichhen', lichhenRoutes);
app.use('/api/hoso', hosoRoutes);
app.use('/api/hopdong', hopdongRoutes);
app.use('/api/baocao', baocaoRoutes);
app.use('/api/quanly', quanlyRoutes);
app.use('/api/thongbao', thongbaoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM BIC Server is running' });
});

// Cron job: Nhắc tái tục hợp đồng (6:00 AM daily)
cron.schedule('0 6 * * *', async () => {
  console.log('🔔 Running contract renewal reminder job...');
  try {
    const [contracts] = await db.query(`
      SELECT hd.*, co.ID_NhanVien, kh.TenKhachHang, kh.TenDoanhNghiep
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      WHERE DATEDIFF(hd.NgayHetHan, CURDATE()) <= 30
        AND DATEDIFF(hd.NgayHetHan, CURDATE()) >= 0
    `);

    for (const contract of contracts) {
      const tenKH = contract.TenKhachHang || contract.TenDoanhNghiep;
      const soNgayConLai = Math.ceil((new Date(contract.NgayHetHan) - new Date()) / (1000 * 60 * 60 * 24));
      
      // Insert notification
      await db.query(`
        INSERT INTO ThongBao (ID_NhanVien, LoaiThongBao, NoiDung)
        VALUES (?, 'Tái tục', ?)
      `, [
        contract.ID_NhanVien,
        `Hợp đồng ${contract.MaHopDong} của khách hàng "${tenKH}" sẽ hết hạn trong ${soNgayConLai} ngày`
      ]);

      // Emit Socket.IO notification
      io.to(`user_${contract.ID_NhanVien}`).emit('notification', {
        type: 'Tái tục',
        message: `Hợp đồng ${contract.MaHopDong} sắp hết hạn`,
        contract: contract
      });
    }

    console.log(`✅ Sent ${contracts.length} renewal reminders`);
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
