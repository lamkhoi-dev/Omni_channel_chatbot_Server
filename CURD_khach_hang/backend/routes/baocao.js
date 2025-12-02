const express = require('express');
const router = express.Router();
const baocaoController = require('../controllers/baocaoController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// All routes require authentication
router.use(authMiddleware);

// Get revenue report
router.get('/doanhthu', baocaoController.getDoanhThu);

// Get KPI report
router.get('/kpi/:id', baocaoController.getKPI);

// Get top employees (Manager only)
router.get('/top-nhanvien', roleMiddleware([2, 3]), baocaoController.getTopNhanVien);

// Get system-wide statistics (for Dashboard)
router.get('/tonghop', baocaoController.getTongHop);

// Export Excel (All authenticated users - employees can export their own data)
router.get('/export/excel', baocaoController.exportExcel);

// Export PDF (All authenticated users - employees can export their own data)
router.get('/export/pdf', baocaoController.exportPDF);

// Export báo cáo tỷ lệ chuyển đổi
router.get('/export/ty-le-chuyen-doi', baocaoController.exportTyLeChuyenDoi);

// Export báo cáo hợp đồng gần hết hạn
router.get('/export/hop-dong-gan-het-han', baocaoController.exportHopDongGanHetHan);

module.exports = router;
