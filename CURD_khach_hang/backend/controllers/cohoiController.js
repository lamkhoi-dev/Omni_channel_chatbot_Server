const db = require('../config/db');

// Get all opportunities with filtering
exports.getAll = async (req, res) => {
  try {
    const { search = '', trangThai = '', khachHangId = '', page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    const roleId = req.user.roleId;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    // Role-based filtering
    if (roleId === 1) {
      whereClause = 'WHERE co.ID_NhanVien = ?';
      params.push(userId);
    } else {
      whereClause = 'WHERE 1=1';
    }

    // Search filter
    if (search) {
      whereClause += ' AND co.TenCoHoi LIKE ?';
      params.push(`%${search}%`);
    }

    // Status filter
    if (trangThai) {
      whereClause += ' AND co.TrangThaiCoHoi = ?';
      params.push(trangThai);
    }

    // Customer filter
    if (khachHangId) {
      whereClause += ' AND co.ID_KhachHang = ?';
      params.push(khachHangId);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM CoHoi co ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get opportunities with related data
    const query = `
      SELECT co.*, 
             kh.TenKhachHang, kh.TenDoanhNghiep, kh.LoaiKhachHang,
             nv.TenNhanVien
      FROM CoHoi co
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
      ${whereClause}
      ORDER BY co.NgayTao DESC
      LIMIT ? OFFSET ?
    `;
    
    const [opportunities] = await db.query(query, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: opportunities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách cơ hội',
      error: error.message
    });
  }
};

// Get opportunity by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [opportunities] = await db.query(
      `SELECT co.*, 
              kh.TenKhachHang, kh.TenDoanhNghiep, kh.LoaiKhachHang, kh.SoDienThoai, kh.Email,
              nv.TenNhanVien
       FROM CoHoi co
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
       WHERE co.ID = ?`,
      [id]
    );

    if (opportunities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội'
      });
    }

    const opportunity = opportunities[0];

    // Authorization check
    if (roleId === 1 && opportunity.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem cơ hội này'
      });
    }

    // Get related appointments
    const [appointments] = await db.query(
      'SELECT * FROM LichHen WHERE ID_CoHoi = ? ORDER BY ThoiGianHen DESC',
      [id]
    );

    // Get related documents
    const [documents] = await db.query(
      'SELECT * FROM HoSo WHERE ID_CoHoi = ? ORDER BY NgayUpload DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...opportunity,
        lichHen: appointments,
        hoSo: documents
      }
    });

  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin cơ hội',
      error: error.message
    });
  }
};

// Create new opportunity
exports.create = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { ID_KhachHang, TenCoHoi, GiaTri, GhiChu } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Validation
    if (!ID_KhachHang || !TenCoHoi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ ID khách hàng và tên cơ hội'
      });
    }

    await connection.beginTransaction();

    // Check if customer exists and belongs to user (if Nhân viên)
    const [customers] = await connection.query(
      'SELECT * FROM KhachHang WHERE ID = ?',
      [ID_KhachHang]
    );

    if (customers.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    const customer = customers[0];

    // Authorization: Nhân viên can only create opportunities for their own customers
    if (roleId === 1 && customer.ID_NhanVien !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo cơ hội cho khách hàng này'
      });
    }

    // Insert opportunity with TrangThai='Mới'
    const [result] = await connection.query(
      `INSERT INTO CoHoi (ID_KhachHang, ID_NhanVien, TenCoHoi, TrangThaiCoHoi, GiaTri, GhiChu)
       VALUES (?, ?, ?, 'Mới', ?, ?)`,
      [ID_KhachHang, userId, TenCoHoi, GiaTri || 0, GhiChu]
    );

    // AUTO UPDATE: KhachHang TrangThai to 'Đang chăm sóc'
    await connection.query(
      `UPDATE KhachHang SET TrangThaiKhachHang = 'Đang chăm sóc' WHERE ID = ?`,
      [ID_KhachHang]
    );

    await connection.commit();

    // Get created opportunity
    const [newOpportunity] = await db.query(
      `SELECT co.*, kh.TenKhachHang, kh.TenDoanhNghiep 
       FROM CoHoi co
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       WHERE co.ID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo cơ hội thành công',
      data: newOpportunity[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo cơ hội',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update opportunity
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenCoHoi, GiaTri, GhiChu } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Check if opportunity exists
    const [opportunities] = await db.query('SELECT * FROM CoHoi WHERE ID = ?', [id]);
    
    if (opportunities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội'
      });
    }

    const opportunity = opportunities[0];

    // Authorization
    if (roleId === 1 && opportunity.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa cơ hội này'
      });
    }

    // Update opportunity
    await db.query(
      `UPDATE CoHoi SET TenCoHoi = ?, GiaTri = ?, GhiChu = ? WHERE ID = ?`,
      [TenCoHoi, GiaTri, GhiChu, id]
    );

    const [updated] = await db.query('SELECT * FROM CoHoi WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Cập nhật cơ hội thành công',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật cơ hội',
      error: error.message
    });
  }
};

// Update opportunity status (with state machine validation)
exports.updateStatus = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { TrangThaiCoHoi, GhiChu } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Validate status
    const validStatuses = ['Mới', 'Chờ xử lý', 'Thành công', 'Thất bại'];
    if (!validStatuses.includes(TrangThaiCoHoi)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    await connection.beginTransaction();

    // Get opportunity
    const [opportunities] = await connection.query(
      'SELECT * FROM CoHoi WHERE ID = ?',
      [id]
    );
    
    if (opportunities.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội'
      });
    }

    const opportunity = opportunities[0];

    // Authorization
    if (roleId === 1 && opportunity.ID_NhanVien !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật cơ hội này'
      });
    }

    const currentStatus = opportunity.TrangThaiCoHoi;

    // State transition validation
    const validTransitions = {
      'Mới': ['Chờ xử lý', 'Thất bại'],
      'Chờ xử lý': ['Thành công', 'Thất bại'],
      'Thành công': [],
      'Thất bại': []
    };

    if (!validTransitions[currentStatus].includes(TrangThaiCoHoi) && currentStatus !== TrangThaiCoHoi) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển trạng thái từ '${currentStatus}' sang '${TrangThaiCoHoi}'`
      });
    }

    // Update opportunity status
    await connection.query(
      'UPDATE CoHoi SET TrangThaiCoHoi = ?, GhiChu = ? WHERE ID = ?',
      [TrangThaiCoHoi, GhiChu, id]
    );

    // AUTO UPDATE: If status changes to 'Thành công', update KhachHang
    if (TrangThaiCoHoi === 'Thành công') {
      await connection.query(
        `UPDATE KhachHang SET TrangThaiKhachHang = 'Thành công' WHERE ID = ?`,
        [opportunity.ID_KhachHang]
      );
    }

    // AUTO UPDATE: If status changes to 'Thất bại', run Churn Prediction Logic
    if (TrangThaiCoHoi === 'Thất bại') {
      await runChurnPrediction(connection, opportunity.ID_KhachHang);
    }

    await connection.commit();

    const [updated] = await db.query('SELECT * FROM CoHoi WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái cơ hội thành công',
      data: updated[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái cơ hội',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Delete opportunity
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [opportunities] = await db.query('SELECT * FROM CoHoi WHERE ID = ?', [id]);
    
    if (opportunities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội'
      });
    }

    const opportunity = opportunities[0];

    // Authorization
    if (roleId === 1 && opportunity.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa cơ hội này'
      });
    }

    await db.query('DELETE FROM CoHoi WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa cơ hội thành công'
    });

  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa cơ hội',
      error: error.message
    });
  }
};

// HELPER: Churn Prediction Logic
async function runChurnPrediction(connection, khachHangId) {
  try {
    // Check if customer has any successful contracts
    const [contracts] = await connection.query(`
      SELECT hd.* 
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      WHERE co.ID_KhachHang = ?
    `, [khachHangId]);

    if (contracts.length > 0) {
      // CASE 1: Customer has contracts (đã từng mua)
      // Check if all contracts are expired
      const [activeContracts] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM HopDong hd
        JOIN HoSo hs ON hd.ID_HoSo = hs.ID
        JOIN CoHoi co ON hs.ID_CoHoi = co.ID
        WHERE co.ID_KhachHang = ? AND hd.NgayHetHan >= CURDATE()
      `, [khachHangId]);

      if (activeContracts[0].count === 0) {
        // All contracts expired → Set to 'Rời bỏ'
        await connection.query(
          `UPDATE KhachHang SET TrangThaiKhachHang = 'Rời bỏ' WHERE ID = ?`,
          [khachHangId]
        );
      }
    } else {
      // CASE 2: Customer has no contracts (chưa từng mua)
      // Check if there are any open opportunities
      const [openOpportunities] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM CoHoi 
        WHERE ID_KhachHang = ? AND TrangThaiCoHoi IN ('Mới', 'Chờ xử lý')
      `, [khachHangId]);

      if (openOpportunities[0].count === 0) {
        // No open opportunities → Set to 'Không tiềm năng'
        await connection.query(
          `UPDATE KhachHang SET TrangThaiKhachHang = 'Không tiềm năng' WHERE ID = ?`,
          [khachHangId]
        );
      }
    }
  } catch (error) {
    console.error('Churn prediction error:', error);
    throw error;
  }
}

// Export cơ hội theo filter
exports.exportExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { search = '', trangThai = '' } = req.query;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Build WHERE clause (same as getAll)
    let whereClause = '';
    let params = [];

    if (roleId === 1) {
      whereClause = 'WHERE co.ID_NhanVien = ?';
      params.push(userId);
    } else {
      whereClause = 'WHERE 1=1';
    }

    if (search) {
      whereClause += ' AND co.TenCoHoi LIKE ?';
      params.push(`%${search}%`);
    }

    if (trangThai) {
      whereClause += ' AND co.TrangThaiCoHoi = ?';
      params.push(trangThai);
    }

    // Get all filtered opportunities
    const [opportunities] = await db.query(
      `SELECT co.*, 
              kh.TenKhachHang, kh.TenDoanhNghiep, kh.LoaiKhachHang,
              nv.TenNhanVien
       FROM CoHoi co
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
       ${whereClause}
       ORDER BY co.NgayTao DESC`,
      params
    );

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cơ hội');

    // Define columns
    worksheet.columns = [
      { header: 'Mã cơ hội', key: 'ID', width: 12 },
      { header: 'Tên cơ hội', key: 'TenCoHoi', width: 30 },
      { header: 'Khách hàng', key: 'TenKhachHang', width: 30 },
      { header: 'Giá trị', key: 'GiaTri', width: 18 },
      { header: 'Trạng thái', key: 'TrangThaiCoHoi', width: 15 },
      { header: 'Nhân viên', key: 'TenNhanVien', width: 20 },
      { header: 'Ngày tạo', key: 'NgayTao', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };

    // Add data
    opportunities.forEach(opp => {
      worksheet.addRow({
        ID: `CO00${opp.ID}`,
        TenCoHoi: opp.TenCoHoi,
        TenKhachHang: opp.TenKhachHang || opp.TenDoanhNghiep,
        GiaTri: opp.GiaTri ? `${Number(opp.GiaTri).toLocaleString('vi-VN')}đ` : '0đ',
        TrangThaiCoHoi: opp.TrangThaiCoHoi,
        TenNhanVien: opp.TenNhanVien,
        NgayTao: opp.NgayTao ? new Date(opp.NgayTao).toLocaleDateString('vi-VN') : ''
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CoHoi_${new Date().toISOString().split('T')[0]}.xlsx`);

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
