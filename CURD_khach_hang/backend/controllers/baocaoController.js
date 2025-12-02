const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

// Get revenue report
exports.getDoanhThu = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const roleId = req.user.roleId;
    const userId = req.user.userId;

    let whereClause = '';
    let params = [];

    // Build date filter
    if (startDate && endDate) {
      whereClause = 'WHERE hd.NgayHieuLuc BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      // Default to current year if no dates provided
      whereClause = 'WHERE YEAR(hd.NgayHieuLuc) = YEAR(CURDATE())';
    }

    // Add role filter
    if (roleId === 1) {
      whereClause += whereClause ? ' AND co.ID_NhanVien = ?' : 'WHERE co.ID_NhanVien = ?';
      params.push(userId);
    }

    // Revenue by month with date filter
    const query = `
      SELECT 
        MONTH(hd.NgayHieuLuc) as thang,
        YEAR(hd.NgayHieuLuc) as nam,
        SUM(hd.GiaTri) as tongDoanhThu,
        COUNT(DISTINCT hd.ID) as soHopDong,
        COUNT(DISTINCT co.ID_KhachHang) as SoKhachHang
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      ${whereClause}
      GROUP BY YEAR(hd.NgayHieuLuc), MONTH(hd.NgayHieuLuc)
      ORDER BY nam, thang
    `;

    const [result] = await db.query(query, params);

    // Convert tongDoanhThu to number for proper calculation
    const formattedResult = result.map(row => ({
      ...row,
      tongDoanhThu: parseFloat(row.tongDoanhThu) || 0
    }));

    res.json({
      success: true,
      data: formattedResult
    });

  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy báo cáo doanh thu',
      error: error.message
    });
  }
};

// Get KPI report
exports.getKPI = async (req, res) => {
  try {
    const { id } = req.params;
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const roleId = req.user.roleId;
    const userId = req.user.userId;

    // Authorization: Can only view own KPI unless manager
    if (roleId === 1 && parseInt(id) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có quyền xem KPI của chính mình'
      });
    }

    // Get employee info
    const [employees] = await db.query('SELECT * FROM NhanVien WHERE ID = ?', [id]);
    
    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Get actual performance using separate subqueries to avoid Cartesian product
    const [performance] = await db.query(
      `SELECT 
         (SELECT COUNT(DISTINCT kh2.ID) 
          FROM KhachHang kh2 
          WHERE kh2.ID_NhanVien = ?
          AND MONTH(kh2.NgayTao) = ? AND YEAR(kh2.NgayTao) = ?) as SoKhachHang,
         
         (SELECT COUNT(DISTINCT co2.ID) 
          FROM CoHoi co2 
          WHERE co2.ID_NhanVien = ?
          AND MONTH(co2.NgayTao) = ? AND YEAR(co2.NgayTao) = ?) as SoCoHoi,
         
         (SELECT COUNT(DISTINCT co3.ID) 
          FROM CoHoi co3 
          WHERE co3.ID_NhanVien = ?
          AND co3.TrangThaiCoHoi = 'Thành công'
          AND MONTH(co3.NgayTao) = ? AND YEAR(co3.NgayTao) = ?) as SoCoHoiThanhCong,
         
         (SELECT COALESCE(SUM(hd2.GiaTri), 0)
          FROM CoHoi co4
          LEFT JOIN HoSo hs2 ON co4.ID = hs2.ID_CoHoi
          LEFT JOIN HopDong hd2 ON hs2.ID = hd2.ID_HoSo
          WHERE co4.ID_NhanVien = ?
          AND MONTH(hd2.NgayHieuLuc) = ? AND YEAR(hd2.NgayHieuLuc) = ?) as TongDoanhThu,
         
         (SELECT COUNT(DISTINCT hd3.ID)
          FROM CoHoi co5
          LEFT JOIN HoSo hs3 ON co5.ID = hs3.ID_CoHoi
          LEFT JOIN HopDong hd3 ON hs3.ID = hd3.ID_HoSo
          WHERE co5.ID_NhanVien = ?
          AND MONTH(hd3.NgayHieuLuc) = ? AND YEAR(hd3.NgayHieuLuc) = ?) as SoHopDong`,
      [id, month, year, id, month, year, id, month, year, id, month, year, id, month, year]
    );

    // Define KPI targets from requirements
    const kpiTargets = {
      SoKhachHang: 10,
      SoCoHoi: 5,
      DoanhThu: 100000000 // 100M VND
    };

    const actual = performance[0];
    const kpiResult = {
      NhanVien: employees[0],
      Thang: parseInt(month),
      Nam: parseInt(year),
      ChiTieu: kpiTargets,
      ThucTe: {
        SoKhachHang: actual.SoKhachHang,
        SoCoHoi: actual.SoCoHoi,
        SoCoHoiThanhCong: actual.SoCoHoiThanhCong,
        DoanhThu: parseFloat(actual.TongDoanhThu),
        SoHopDong: actual.SoHopDong
      },
      DatChiTieu: {
        KhachHang: actual.SoKhachHang >= kpiTargets.SoKhachHang,
        CoHoi: actual.SoCoHoi >= kpiTargets.SoCoHoi,
        DoanhThu: parseFloat(actual.TongDoanhThu) >= kpiTargets.DoanhThu
      },
      TyLe: {
        KhachHang: Math.round((actual.SoKhachHang / kpiTargets.SoKhachHang) * 100),
        CoHoi: Math.round((actual.SoCoHoi / kpiTargets.SoCoHoi) * 100),
        DoanhThu: Math.round((parseFloat(actual.TongDoanhThu) / kpiTargets.DoanhThu) * 100)
      }
    };

    res.json({
      success: true,
      data: kpiResult
    });

  } catch (error) {
    console.error('Get KPI error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy báo cáo KPI',
      error: error.message
    });
  }
};

// Get top employees
exports.getTopNhanVien = async (req, res) => {
  try {
    const { month, year, limit = 10, startDate, endDate } = req.query;
    const roleId = req.user.roleId;

    // Only manager can view top employees
    if (![2, 3].includes(roleId)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản lý mới có quyền xem bảng xếp hạng nhân viên'
      });
    }

    // Build query based on filter type
    let query, params;
    
    if (startDate && endDate) {
      // Filter by date range
      query = `SELECT 
         nv.ID,
         nv.TenNhanVien,
         nv.Email,
         (SELECT COUNT(DISTINCT kh2.ID) 
          FROM KhachHang kh2 
          WHERE kh2.ID_NhanVien = nv.ID 
          AND kh2.NgayTao BETWEEN ? AND ?) as SoKhachHang,
         (SELECT COUNT(DISTINCT co2.ID) 
          FROM CoHoi co2 
          WHERE co2.ID_NhanVien = nv.ID 
          AND co2.NgayTao BETWEEN ? AND ?) as SoCoHoi,
         (SELECT COUNT(DISTINCT co3.ID) 
          FROM CoHoi co3 
          WHERE co3.ID_NhanVien = nv.ID 
          AND co3.TrangThaiCoHoi = 'Thành công'
          AND co3.NgayTao BETWEEN ? AND ?) as SoCoHoiThanhCong,
         (SELECT COALESCE(SUM(hd2.GiaTri), 0) 
          FROM CoHoi co2 
          LEFT JOIN HoSo hs2 ON co2.ID = hs2.ID_CoHoi
          LEFT JOIN HopDong hd2 ON hs2.ID = hd2.ID_HoSo
          WHERE co2.ID_NhanVien = nv.ID
          AND hd2.NgayHieuLuc BETWEEN ? AND ?) as TongDoanhThu,
         (SELECT COUNT(DISTINCT hd3.ID)
          FROM CoHoi co3
          LEFT JOIN HoSo hs3 ON co3.ID = hs3.ID_CoHoi
          LEFT JOIN HopDong hd3 ON hs3.ID = hd3.ID_HoSo
          WHERE co3.ID_NhanVien = nv.ID
          AND hd3.NgayHieuLuc BETWEEN ? AND ?) as SoHopDong
       FROM NhanVien nv
       WHERE nv.ID_Role = 1
       ORDER BY TongDoanhThu DESC, SoHopDong DESC
       LIMIT ?`;
      params = [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, parseInt(limit)];
    } else if (month && year) {
      // Filter by specific month/year
      query = `SELECT 
         nv.ID,
         nv.TenNhanVien,
         nv.Email,
         COUNT(DISTINCT kh.ID) as SoKhachHang,
         COUNT(DISTINCT co.ID) as SoCoHoi,
         COUNT(DISTINCT CASE WHEN co.TrangThaiCoHoi = 'Thành công' THEN co.ID END) as SoCoHoiThanhCong,
         COALESCE(SUM(hd.GiaTri), 0) as TongDoanhThu,
         COUNT(DISTINCT hd.ID) as SoHopDong
       FROM NhanVien nv
       LEFT JOIN KhachHang kh ON nv.ID = kh.ID_NhanVien 
         AND MONTH(kh.NgayTao) = ? AND YEAR(kh.NgayTao) = ?
       LEFT JOIN CoHoi co ON nv.ID = co.ID_NhanVien 
         AND MONTH(co.NgayTao) = ? AND YEAR(co.NgayTao) = ?
       LEFT JOIN HoSo hs ON co.ID = hs.ID_CoHoi
       LEFT JOIN HopDong hd ON hs.ID = hd.ID_HoSo 
         AND MONTH(hd.NgayHieuLuc) = ? AND YEAR(hd.NgayHieuLuc) = ?
       WHERE nv.ID_Role = 1
       GROUP BY nv.ID, nv.TenNhanVien, nv.Email
       ORDER BY TongDoanhThu DESC, SoHopDong DESC
       LIMIT ?`;
      params = [month, year, month, year, month, year, parseInt(limit)];
    } else {
      // All-time data (no filter)
      query = `SELECT 
         nv.ID,
         nv.TenNhanVien,
         nv.Email,
         COUNT(DISTINCT kh.ID) as SoKhachHang,
         COUNT(DISTINCT co.ID) as SoCoHoi,
         COUNT(DISTINCT CASE WHEN co.TrangThaiCoHoi = 'Thành công' THEN co.ID END) as SoCoHoiThanhCong,
         (SELECT COALESCE(SUM(hd2.GiaTri), 0) 
          FROM CoHoi co2 
          LEFT JOIN HoSo hs2 ON co2.ID = hs2.ID_CoHoi
          LEFT JOIN HopDong hd2 ON hs2.ID = hd2.ID_HoSo
          WHERE co2.ID_NhanVien = nv.ID) as TongDoanhThu,
         (SELECT COUNT(DISTINCT hd3.ID)
          FROM CoHoi co3
          LEFT JOIN HoSo hs3 ON co3.ID = hs3.ID_CoHoi
          LEFT JOIN HopDong hd3 ON hs3.ID = hd3.ID_HoSo
          WHERE co3.ID_NhanVien = nv.ID) as SoHopDong
       FROM NhanVien nv
       LEFT JOIN KhachHang kh ON nv.ID = kh.ID_NhanVien
       LEFT JOIN CoHoi co ON nv.ID = co.ID_NhanVien
       WHERE nv.ID_Role = 1
       GROUP BY nv.ID, nv.TenNhanVien, nv.Email
       ORDER BY TongDoanhThu DESC, SoHopDong DESC
       LIMIT ?`;
      params = [parseInt(limit)];
    }

    const [topEmployees] = await db.query(query, params);

    console.log('Top employees query result:', topEmployees);

    // Convert TongDoanhThu to number for proper sorting and display
    const formattedEmployees = topEmployees.map(emp => ({
      ...emp,
      TongDoanhThu: parseFloat(emp.TongDoanhThu) || 0
    }));

    console.log('Formatted employees:', formattedEmployees);

    res.json({
      success: true,
      data: formattedEmployees
    });

  } catch (error) {
    console.error('Get top employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy bảng xếp hạng nhân viên',
      error: error.message
    });
  }
};

// Export report to Excel
exports.exportExcel = async (req, res) => {
  try {
    const { type = 'doanhthu', month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const roleId = req.user.roleId;
    const userId = req.user.userId;

    console.log('\n=== EXPORT EXCEL DEBUG ===');
    console.log('Type:', type);
    console.log('Year:', year, 'Month:', month);
    console.log('User Role:', roleId, 'User ID:', userId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CRM BIC Hà Nội';
    workbook.created = new Date();

    if (type === 'doanhthu') {
      const worksheet = workbook.addWorksheet('Doanh Thu');

      // Header
      worksheet.columns = [
        { header: 'Tháng', key: 'Thang', width: 10 },
        { header: 'Doanh Thu', key: 'DoanhThu', width: 20 },
        { header: 'Số Hợp Đồng', key: 'SoHopDong', width: 15 },
        { header: 'Số Khách Hàng', key: 'SoKhachHang', width: 15 }
      ];

      // Build query based on role (Employee sees only their data, Manager sees all)
      let whereClause = 'WHERE YEAR(hd.NgayHieuLuc) = ?';
      let params = [year];
      
      if (roleId === 1) {
        whereClause += ' AND co.ID_NhanVien = ?';
        params.push(userId);
      }

      console.log('Query WHERE clause:', whereClause);
      console.log('Query params:', params);

      // Get data
      const [data] = await db.query(
        `SELECT 
           MONTH(hd.NgayHieuLuc) as Thang,
           SUM(hd.GiaTri) as DoanhThu,
           COUNT(DISTINCT hd.ID) as SoHopDong,
           COUNT(DISTINCT co.ID_KhachHang) as SoKhachHang
         FROM HopDong hd
         JOIN HoSo hs ON hd.ID_HoSo = hs.ID
         JOIN CoHoi co ON hs.ID_CoHoi = co.ID
         ${whereClause}
         GROUP BY MONTH(hd.NgayHieuLuc)
         ORDER BY Thang`,
        params
      );

      console.log('Excel Export - Doanh Thu - Data retrieved:', data.length, 'rows');
      if (data.length > 0) {
        console.log('First row sample:', data[0]);
      } else {
        console.log('WARNING: No data found for year', year);
      }

      data.forEach(row => {
        worksheet.addRow(row);
      });

      // Style
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

    } else if (type === 'top-nhanvien') {
      const worksheet = workbook.addWorksheet('Top Nhân Viên');

      worksheet.columns = [
        { header: 'Họ Tên', key: 'TenNhanVien', width: 25 },
        { header: 'Email', key: 'Email', width: 25 },
        { header: 'Số Khách Hàng', key: 'SoKhachHang', width: 15 },
        { header: 'Số Cơ Hội', key: 'SoCoHoi', width: 12 },
        { header: 'Cơ Hội Thành Công', key: 'SoCoHoiThanhCong', width: 18 },
        { header: 'Tổng Doanh Thu', key: 'TongDoanhThu', width: 20 },
        { header: 'Số Hợp Đồng', key: 'SoHopDong', width: 15 }
      ];

      // Build WHERE clause based on role
      let whereClause = 'WHERE nv.ID_Role = 1';
      let params = [month, year, month, year, month, year];
      
      if (roleId === 1) {
        whereClause += ' AND nv.ID = ?';
        params.push(userId);
      }

      const [data] = await db.query(
        `SELECT 
           nv.TenNhanVien,
           nv.Email,
           COUNT(DISTINCT kh.ID) as SoKhachHang,
           COUNT(DISTINCT co.ID) as SoCoHoi,
           COUNT(DISTINCT CASE WHEN co.TrangThaiCoHoi = 'Thành công' THEN co.ID END) as SoCoHoiThanhCong,
           COALESCE(SUM(hd.GiaTri), 0) as TongDoanhThu,
           COUNT(DISTINCT hd.ID) as SoHopDong
         FROM NhanVien nv
         LEFT JOIN KhachHang kh ON nv.ID = kh.ID_NhanVien 
           AND MONTH(kh.NgayTao) = ? AND YEAR(kh.NgayTao) = ?
         LEFT JOIN CoHoi co ON nv.ID = co.ID_NhanVien 
           AND MONTH(co.NgayTao) = ? AND YEAR(co.NgayTao) = ?
         LEFT JOIN HoSo hs ON co.ID = hs.ID_CoHoi
         LEFT JOIN HopDong hd ON hs.ID = hd.ID_HoSo 
           AND MONTH(hd.NgayHieuLuc) = ? AND YEAR(hd.NgayHieuLuc) = ?
         ${whereClause}
         GROUP BY nv.ID, nv.TenNhanVien, nv.Email
         ORDER BY TongDoanhThu DESC`,
        params
      );

      console.log('Excel Export - Data retrieved:', data.length, 'rows');
      console.log('First row sample:', data[0]);
      
      data.forEach(row => {
        worksheet.addRow(row);
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
    }

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=BaoCao_${type}_${year}_${month}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xuất báo cáo Excel',
      error: error.message
    });
  }
};

// Export report to PDF
exports.exportPDF = async (req, res) => {
  try {
    const { type = 'doanhthu', month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const roleId = req.user.roleId;
    const userId = req.user.userId;

    console.log('\n=== EXPORT PDF DEBUG ===');
    console.log('Type:', type);
    console.log('Year:', year, 'Month:', month);
    console.log('User Role:', roleId, 'User ID:', userId);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BaoCao_${type}_${year}_${month}.pdf`);

    doc.pipe(res);

    // Register font for Vietnamese (use default font)
    doc.fontSize(20).text('BAO CAO CRM BIC HA NOI', { align: 'center' });
    doc.moveDown();

    if (type === 'doanhthu') {
      doc.fontSize(14).text(`Bao cao Doanh Thu - Nam ${year}`, { align: 'center' });
      doc.moveDown();

      // Build query based on role (Employee sees only their data, Manager sees all)
      let whereClause = 'WHERE YEAR(hd.NgayHieuLuc) = ?';
      let params = [year];
      
      if (roleId === 1) {
        whereClause += ' AND co.ID_NhanVien = ?';
        params.push(userId);
      }

      console.log('Query WHERE clause:', whereClause);
      console.log('Query params:', params);

      const [data] = await db.query(
        `SELECT 
           MONTH(hd.NgayHieuLuc) as Thang,
           SUM(hd.GiaTri) as DoanhThu,
           COUNT(DISTINCT hd.ID) as SoHopDong,
           COUNT(DISTINCT co.ID_KhachHang) as SoKhachHang
         FROM HopDong hd
         JOIN HoSo hs ON hd.ID_HoSo = hs.ID
         JOIN CoHoi co ON hs.ID_CoHoi = co.ID
         ${whereClause}
         GROUP BY MONTH(hd.NgayHieuLuc)
         ORDER BY Thang`,
        params
      );

      console.log('PDF Export - Doanh Thu - Data retrieved:', data.length, 'rows');
      if (data.length > 0) {
        console.log('First row sample:', data[0]);
      } else {
        console.log('WARNING: No data found for year', year);
      }

      doc.fontSize(10);
      data.forEach(row => {
        doc.text(`Thang ${row.Thang}: ${row.DoanhThu.toLocaleString()} VND - ${row.SoHopDong} hop dong - ${row.SoKhachHang} khach hang`);
      });

    } else if (type === 'top-nhanvien') {
      doc.fontSize(14).text(`Top Nhan Vien - Thang ${month}/${year}`, { align: 'center' });
      doc.moveDown();

      // Build WHERE clause based on role
      let whereClause = 'WHERE nv.ID_Role = 1';
      let params = [month, year];
      
      if (roleId === 1) {
        whereClause += ' AND nv.ID = ?';
        params.push(userId);
      }

      const [data] = await db.query(
        `SELECT 
           nv.TenNhanVien,
           COALESCE(SUM(hd.GiaTri), 0) as TongDoanhThu,
           COUNT(DISTINCT hd.ID) as SoHopDong
         FROM NhanVien nv
         LEFT JOIN CoHoi co ON nv.ID = co.ID_NhanVien
         LEFT JOIN HoSo hs ON co.ID = hs.ID_CoHoi 
         LEFT JOIN HopDong hd ON hs.ID = hd.ID_HoSo 
           AND MONTH(hd.NgayHieuLuc) = ? AND YEAR(hd.NgayHieuLuc) = ?
         ${whereClause}
         GROUP BY nv.ID, nv.TenNhanVien
         ORDER BY TongDoanhThu DESC
         LIMIT 10`,
        params
      );

      console.log('PDF Export - Data retrieved:', data.length, 'rows');
      console.log('First row sample:', data[0]);
      
      doc.fontSize(10);
      data.forEach((row, index) => {
        doc.text(`${index + 1}. ${row.TenNhanVien}: ${row.TongDoanhThu.toLocaleString()} VND - ${row.SoHopDong} hop dong`);
      });
    }

    doc.end();

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xuất báo cáo PDF',
      error: error.message
    });
  }
};

// Get system-wide statistics (for Admin Dashboard)
exports.getTongHop = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    const userId = req.user.userId;

    // Build where clause based on role
    let whereClause = '';
    let params = [];

    if (roleId === 1) {
      // Nhân viên chỉ xem own data
      whereClause = 'WHERE kh.ID_NhanVien = ?';
      params.push(userId);
    }
    // Role 2, 3 xem tất cả (no filter)

    // Query tổng hợp TOÀN HỆ THỐNG với COUNT DISTINCT
    const query = `
      SELECT 
        (SELECT COUNT(DISTINCT ID) FROM KhachHang ${whereClause}) as tongKhachHang,
        (SELECT COUNT(DISTINCT co.ID) FROM CoHoi co 
         ${roleId === 1 ? 'WHERE co.ID_NhanVien = ?' : ''}) as tongCoHoi,
        (SELECT COUNT(DISTINCT co.ID) FROM CoHoi co 
         WHERE co.TrangThaiCoHoi = 'Thành công' 
         ${roleId === 1 ? 'AND co.ID_NhanVien = ?' : ''}) as coHoiThanhCong,
        (SELECT COUNT(DISTINCT hd.ID) FROM HopDong hd
         JOIN HoSo hs ON hd.ID_HoSo = hs.ID
         JOIN CoHoi co ON hs.ID_CoHoi = co.ID
         ${roleId === 1 ? 'WHERE co.ID_NhanVien = ?' : ''}) as tongHopDong,
        (SELECT COALESCE(SUM(hd.GiaTri), 0) FROM HopDong hd
         JOIN HoSo hs ON hd.ID_HoSo = hs.ID
         JOIN CoHoi co ON hs.ID_CoHoi = co.ID
         ${roleId === 1 ? 'WHERE co.ID_NhanVien = ?' : ''}) as tongDoanhThu,
        (SELECT COUNT(DISTINCT ID) FROM NhanVien WHERE ID_Role = 1 AND TrangThaiNhanVien = 'Hoạt động') as tongNhanVien
    `;

    // Add params cho từng subquery nếu là nhân viên
    if (roleId === 1) {
      params = [userId, userId, userId, userId, userId]; // 5 subqueries
    }

    const [result] = await db.query(query, params);
    const stats = result[0];

    // Tính tỷ lệ chuyển đổi
    const tyLeChuyenDoi = stats.tongCoHoi > 0 
      ? Math.round((stats.coHoiThanhCong / stats.tongCoHoi) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        tyLeChuyenDoi
      }
    });

  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê tổng hợp',
      error: error.message
    });
  }
};

// Export báo cáo tỷ lệ chuyển đổi cơ hội
exports.exportTyLeChuyenDoi = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    const userId = req.user.userId;

    // Get all opportunities with status
    let query = `
      SELECT 
        co.ID,
        co.TenCoHoi,
        kh.TenKhachHang,
        kh.TenDoanhNghiep,
        kh.LoaiKhachHang,
        co.GiaTri,
        co.TrangThaiCoHoi,
        nv.TenNhanVien,
        co.NgayTao
      FROM CoHoi co
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
      ${roleId === 1 ? 'WHERE co.ID_NhanVien = ?' : ''}
      ORDER BY co.NgayTao DESC
    `;

    const [opportunities] = await db.query(query, roleId === 1 ? [userId] : []);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tỷ lệ chuyển đổi cơ hội');

    // Add title
    worksheet.mergeCells('A1:I1');
    worksheet.getCell('A1').value = 'BÁO CÁO TỶ LỆ CHUYỂN ĐỔI CƠ HỘI';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Add summary statistics
    const totalOpps = opportunities.length;
    const successful = opportunities.filter(o => o.TrangThaiCoHoi === 'Thành công').length;
    const processing = opportunities.filter(o => o.TrangThaiCoHoi === 'Chờ xử lý').length;
    const failed = opportunities.filter(o => o.TrangThaiCoHoi === 'Thất bại').length;
    const newOpps = opportunities.filter(o => o.TrangThaiCoHoi === 'Mới').length;
    const conversionRate = totalOpps > 0 ? ((successful / totalOpps) * 100).toFixed(2) : 0;

    worksheet.mergeCells('A3:C3');
    worksheet.getCell('A3').value = `Tổng số cơ hội: ${totalOpps}`;
    worksheet.getCell('A3').font = { bold: true };

    worksheet.mergeCells('D3:F3');
    worksheet.getCell('D3').value = `Thành công: ${successful} (${conversionRate}%)`;
    worksheet.getCell('D3').font = { bold: true, color: { argb: 'FF10B981' } };

    worksheet.mergeCells('G3:I3');
    worksheet.getCell('G3').value = `Thất bại: ${failed}`;
    worksheet.getCell('G3').font = { bold: true, color: { argb: 'FFEF4444' } };

    worksheet.mergeCells('A4:C4');
    worksheet.getCell('A4').value = `Đang xử lý: ${processing}`;
    worksheet.getCell('A4').font = { bold: true, color: { argb: 'FFF59E0B' } };

    worksheet.mergeCells('D4:F4');
    worksheet.getCell('D4').value = `Mới: ${newOpps}`;
    worksheet.getCell('D4').font = { bold: true, color: { argb: 'FF3B82F6' } };

    // Add headers
    const headers = ['STT', 'Tên cơ hội', 'Khách hàng', 'Loại KH', 'Giá trị', 'Trạng thái', 'Nhân viên', 'Ngày tạo'];
    worksheet.getRow(6).values = headers;
    worksheet.getRow(6).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(6).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data
    opportunities.forEach((opp, index) => {
      const row = worksheet.addRow([
        index + 1,
        opp.TenCoHoi,
        opp.LoaiKhachHang === 'Cá nhân' ? opp.TenKhachHang : opp.TenDoanhNghiep,
        opp.LoaiKhachHang,
        Number(opp.GiaTri || 0).toLocaleString('vi-VN') + 'đ',
        opp.TrangThaiCoHoi,
        opp.TenNhanVien,
        new Date(opp.NgayTao).toLocaleDateString('vi-VN')
      ]);

      // Color code status
      const statusCell = row.getCell(6);
      if (opp.TrangThaiCoHoi === 'Thành công') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        statusCell.font = { color: { argb: 'FF065F46' } };
      } else if (opp.TrangThaiCoHoi === 'Thất bại') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        statusCell.font = { color: { argb: 'FF991B1B' } };
      } else if (opp.TrangThaiCoHoi === 'Chờ xử lý') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        statusCell.font = { color: { argb: 'FF92400E' } };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        statusCell.font = { color: { argb: 'FF1E3A8A' } };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 25 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
      { width: 12 }
    ];

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=BaoCao_TyLeChuyenDoi_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export conversion rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xuất báo cáo tỷ lệ chuyển đổi',
      error: error.message
    });
  }
};

// Export báo cáo hợp đồng gần đến hạn
exports.exportHopDongGanHetHan = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    const userId = req.user.userId;

    // Get contracts expiring within 90 days
    let query = `
      SELECT 
        hd.ID,
        hd.MaHopDong,
        kh.TenKhachHang,
        kh.TenDoanhNghiep,
        kh.LoaiKhachHang,
        kh.SoDienThoai,
        kh.Email,
        hd.NgayHieuLuc,
        hd.NgayHetHan,
        hd.GiaTri,
        nv.TenNhanVien,
        DATEDIFF(hd.NgayHetHan, CURDATE()) as SoNgayConLai
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
      WHERE DATEDIFF(hd.NgayHetHan, CURDATE()) BETWEEN 0 AND 90
      ${roleId === 1 ? 'AND co.ID_NhanVien = ?' : ''}
      ORDER BY SoNgayConLai ASC
    `;

    const [contracts] = await db.query(query, roleId === 1 ? [userId] : []);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hợp đồng gần hết hạn');

    // Add title
    worksheet.mergeCells('A1:K1');
    worksheet.getCell('A1').value = 'BÁO CÁO HỢP ĐỒNG GẦN HẾT HẠN (≤90 NGÀY)';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Add summary
    const criticalContracts = contracts.filter(c => c.SoNgayConLai <= 30).length;
    const warningContracts = contracts.filter(c => c.SoNgayConLai > 30 && c.SoNgayConLai <= 60).length;
    const normalContracts = contracts.filter(c => c.SoNgayConLai > 60).length;

    worksheet.mergeCells('A3:D3');
    worksheet.getCell('A3').value = `Tổng số: ${contracts.length} hợp đồng`;
    worksheet.getCell('A3').font = { bold: true };

    worksheet.mergeCells('E3:G3');
    worksheet.getCell('E3').value = `Khẩn cấp (≤30 ngày): ${criticalContracts}`;
    worksheet.getCell('E3').font = { bold: true, color: { argb: 'FFEF4444' } };

    worksheet.mergeCells('H3:K3');
    worksheet.getCell('H3').value = `Cảnh báo (31-60 ngày): ${warningContracts}`;
    worksheet.getCell('H3').font = { bold: true, color: { argb: 'FFF59E0B' } };

    worksheet.mergeCells('A4:D4');
    worksheet.getCell('A4').value = `Bình thường (61-90 ngày): ${normalContracts}`;
    worksheet.getCell('A4').font = { bold: true, color: { argb: 'FF10B981' } };

    // Add headers
    const headers = ['STT', 'Mã HĐ', 'Khách hàng', 'SĐT', 'Email', 'Ngày hiệu lực', 'Ngày hết hạn', 'Còn lại (ngày)', 'Giá trị', 'Nhân viên', 'Mức độ'];
    worksheet.getRow(6).values = headers;
    worksheet.getRow(6).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' }
    };
    worksheet.getRow(6).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data
    contracts.forEach((contract, index) => {
      const mucDo = contract.SoNgayConLai <= 30 ? 'KHẨN CẤP' : 
                     contract.SoNgayConLai <= 60 ? 'CẢNH BÁO' : 'THEO DÕI';
      
      const row = worksheet.addRow([
        index + 1,
        contract.MaHopDong,
        contract.LoaiKhachHang === 'Cá nhân' ? contract.TenKhachHang : contract.TenDoanhNghiep,
        contract.SoDienThoai,
        contract.Email,
        new Date(contract.NgayHieuLuc).toLocaleDateString('vi-VN'),
        new Date(contract.NgayHetHan).toLocaleDateString('vi-VN'),
        contract.SoNgayConLai,
        Number(contract.GiaTri || 0).toLocaleString('vi-VN') + 'đ',
        contract.TenNhanVien,
        mucDo
      ]);

      // Color code by urgency
      const urgencyCell = row.getCell(11);
      const daysCell = row.getCell(8);
      
      if (contract.SoNgayConLai <= 30) {
        urgencyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        urgencyCell.font = { color: { argb: 'FF991B1B' }, bold: true };
        daysCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      } else if (contract.SoNgayConLai <= 60) {
        urgencyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        urgencyCell.font = { color: { argb: 'FF92400E' }, bold: true };
        daysCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
      } else {
        urgencyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        urgencyCell.font = { color: { argb: 'FF065F46' } };
        daysCell.font = { color: { argb: 'FF10B981' } };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 5 },
      { width: 15 },
      { width: 25 },
      { width: 12 },
      { width: 25 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 20 },
      { width: 12 }
    ];

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=BaoCao_HopDongGanHetHan_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export expiring contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xuất báo cáo hợp đồng gần hết hạn',
      error: error.message
    });
  }
};
