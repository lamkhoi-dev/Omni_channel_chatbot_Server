const db = require('../config/db');

// Get all customers with filtering and pagination
exports.getAll = async (req, res) => {
  try {
    const { search = '', trangThai = '', loai = '', page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    const roleId = req.user.roleId;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = '';
    let params = [];

    // Role-based filtering: Nhân viên (role 1) only see their own customers
    if (roleId === 1) {
      whereClause = 'WHERE kh.ID_NhanVien = ?';
      params.push(userId);
    } else {
      whereClause = 'WHERE 1=1';
    }

    // Search filter
    if (search) {
      whereClause += ` AND (kh.TenKhachHang LIKE ? OR kh.TenDoanhNghiep LIKE ? OR kh.SoDienThoai LIKE ? OR kh.Email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Status filter
    if (trangThai) {
      whereClause += ' AND kh.TrangThaiKhachHang = ?';
      params.push(trangThai);
    }

    // Type filter
    if (loai) {
      whereClause += ' AND kh.LoaiKhachHang = ?';
      params.push(loai);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM KhachHang kh ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get customers with employee info
    const query = `
      SELECT kh.*, nv.TenNhanVien 
      FROM KhachHang kh
      LEFT JOIN NhanVien nv ON kh.ID_NhanVien = nv.ID
      ${whereClause}
      ORDER BY kh.NgayTao DESC
      LIMIT ? OFFSET ?
    `;
    
    const [customers] = await db.query(query, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách khách hàng',
      error: error.message
    });
  }
};

// Get customer by ID with related data
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Get customer
    const [customers] = await db.query(
      `SELECT kh.*, nv.TenNhanVien 
       FROM KhachHang kh
       LEFT JOIN NhanVien nv ON kh.ID_NhanVien = nv.ID
       WHERE kh.ID = ?`,
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    const customer = customers[0];

    // Check authorization: Nhân viên can only view their own customers
    if (roleId === 1 && customer.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem khách hàng này'
      });
    }

    // Get related opportunities
    const [opportunities] = await db.query(
      'SELECT * FROM CoHoi WHERE ID_KhachHang = ? ORDER BY NgayTao DESC',
      [id]
    );

    // Get related appointments (through opportunities)
    const [appointments] = await db.query(
      `SELECT lh.* FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       WHERE co.ID_KhachHang = ?
       ORDER BY lh.ThoiGianHen DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...customer,
        coHoi: opportunities,
        lichHen: appointments
      }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin khách hàng',
      error: error.message
    });
  }
};

// Create new customer
exports.create = async (req, res) => {
  try {
    const {
      TenKhachHang,
      TenDoanhNghiep,
      LoaiKhachHang,
      SoDienThoai,
      Email,
      DiaChi,
      GhiChu,
      CCCD,
      NgaySinh,
      MaSoThue,
      NgayThanhLap
    } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!LoaiKhachHang || !['Cá nhân', 'Doanh nghiệp'].includes(LoaiKhachHang)) {
      return res.status(400).json({
        success: false,
        message: 'Loại khách hàng không hợp lệ (Cá nhân hoặc Doanh nghiệp)'
      });
    }

    if (LoaiKhachHang === 'Cá nhân' && !TenKhachHang) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên khách hàng'
      });
    }

    if (LoaiKhachHang === 'Doanh nghiệp' && !TenDoanhNghiep) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên doanh nghiệp'
      });
    }

    // Insert customer with new fields
    const [result] = await db.query(
      `INSERT INTO KhachHang 
       (ID_NhanVien, TenKhachHang, TenDoanhNghiep, LoaiKhachHang, SoDienThoai, Email, DiaChi, GhiChu, 
        CCCD, NgaySinh, MaSoThue, NgayThanhLap, TrangThaiKhachHang)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Tiềm năng')`,
      [userId, TenKhachHang, TenDoanhNghiep, LoaiKhachHang, SoDienThoai, Email, DiaChi, GhiChu,
       CCCD || null, NgaySinh || null, MaSoThue || null, NgayThanhLap || null]
    );

    // Get created customer
    const [newCustomer] = await db.query('SELECT * FROM KhachHang WHERE ID = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Tạo khách hàng thành công',
      data: newCustomer[0]
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo khách hàng',
      error: error.message
    });
  }
};

// Update customer
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      TenKhachHang,
      TenDoanhNghiep,
      LoaiKhachHang,
      SoDienThoai,
      Email,
      DiaChi,
      TrangThaiKhachHang,
      GhiChu,
      CCCD,
      NgaySinh,
      MaSoThue,
      NgayThanhLap
    } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Check if customer exists
    const [customers] = await db.query('SELECT * FROM KhachHang WHERE ID = ?', [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    const customer = customers[0];

    // Authorization: Nhân viên can only update their own customers
    if (roleId === 1 && customer.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa khách hàng này'
      });
    }

    // Update customer with new fields
    await db.query(
      `UPDATE KhachHang 
       SET TenKhachHang = ?, TenDoanhNghiep = ?, LoaiKhachHang = ?, 
           SoDienThoai = ?, Email = ?, DiaChi = ?, TrangThaiKhachHang = ?, GhiChu = ?,
           CCCD = ?, NgaySinh = ?, MaSoThue = ?, NgayThanhLap = ?
       WHERE ID = ?`,
      [TenKhachHang, TenDoanhNghiep, LoaiKhachHang, SoDienThoai, Email, DiaChi, TrangThaiKhachHang, GhiChu,
       CCCD || null, NgaySinh || null, MaSoThue || null, NgayThanhLap || null, id]
    );

    // Get updated customer
    const [updated] = await db.query('SELECT * FROM KhachHang WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Cập nhật khách hàng thành công',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật khách hàng',
      error: error.message
    });
  }
};

// Delete customer
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Check if customer exists
    const [customers] = await db.query('SELECT * FROM KhachHang WHERE ID = ?', [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    const customer = customers[0];

    // Authorization: Nhân viên can only delete their own customers
    if (roleId === 1 && customer.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa khách hàng này'
      });
    }

    // Delete customer (CASCADE will delete related data)
    await db.query('DELETE FROM KhachHang WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa khách hàng thành công'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa khách hàng',
      error: error.message
    });
  }
};

// Export khách hàng theo filter
exports.exportExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { search = '', trangThai = '', loai = '' } = req.query;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Build WHERE clause (same as getAll)
    let whereClause = '';
    let params = [];

    if (roleId === 1) {
      whereClause = 'WHERE kh.ID_NhanVien = ?';
      params.push(userId);
    } else {
      whereClause = 'WHERE 1=1';
    }

    if (search) {
      whereClause += ` AND (kh.TenKhachHang LIKE ? OR kh.TenDoanhNghiep LIKE ? OR kh.SoDienThoai LIKE ? OR kh.Email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (trangThai) {
      whereClause += ' AND kh.TrangThaiKhachHang = ?';
      params.push(trangThai);
    }

    if (loai) {
      whereClause += ' AND kh.LoaiKhachHang = ?';
      params.push(loai);
    }

    // Get all filtered customers
    const [customers] = await db.query(
      `SELECT kh.*, nv.TenNhanVien
       FROM KhachHang kh
       LEFT JOIN NhanVien nv ON kh.ID_NhanVien = nv.ID
       ${whereClause}
       ORDER BY kh.NgayTao DESC`,
      params
    );

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Khách hàng');

    // Define columns
    worksheet.columns = [
      { header: 'Mã KH', key: 'ID', width: 10 },
      { header: 'Loại', key: 'LoaiKhachHang', width: 15 },
      { header: 'Tên', key: 'Ten', width: 30 },
      { header: 'SĐT', key: 'SoDienThoai', width: 15 },
      { header: 'Email', key: 'Email', width: 25 },
      { header: 'Địa chỉ', key: 'DiaChi', width: 40 },
      { header: 'Trạng thái', key: 'TrangThaiKhachHang', width: 15 },
      { header: 'Nhân viên', key: 'TenNhanVien', width: 20 },
      { header: 'Ngày tạo', key: 'NgayTao', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };

    // Add data
    customers.forEach(cust => {
      worksheet.addRow({
        ID: `KH00${cust.ID}`,
        LoaiKhachHang: cust.LoaiKhachHang,
        Ten: cust.TenKhachHang || cust.TenDoanhNghiep,
        SoDienThoai: cust.SoDienThoai,
        Email: cust.Email,
        DiaChi: cust.DiaChi,
        TrangThaiKhachHang: cust.TrangThaiKhachHang,
        TenNhanVien: cust.TenNhanVien,
        NgayTao: cust.NgayTao ? new Date(cust.NgayTao).toLocaleDateString('vi-VN') : ''
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=KhachHang_${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xuất file Excel',
      error: error.message
    });
  }
};
