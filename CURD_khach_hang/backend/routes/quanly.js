const express = require('express');
const router = express.Router();
const quanlyController = require('../controllers/quanlyController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// All routes require authentication and manager role ONLY (Role 2)
// Ban giám đốc (Role 3) chỉ xem báo cáo, không quản lý nhân viên
router.use(authMiddleware);
router.use(roleMiddleware([2]));

// Employee management
router.get('/nhanvien', quanlyController.getAllNhanVien);
router.get('/nhanvien/:id', quanlyController.getNhanVienById);
router.post('/nhanvien', quanlyController.createNhanVien);
router.put('/nhanvien/:id', quanlyController.updateNhanVien);
router.delete('/nhanvien/:id', quanlyController.deleteNhanVien);

// Pending documents
router.get('/hoso/pending', quanlyController.getPendingHoSo);

// Overdue appointments
router.get('/lichhen/overdue', quanlyController.getOverdueLichHen);

module.exports = router;
