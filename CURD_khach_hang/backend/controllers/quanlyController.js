const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all employees (Manager only)
exports.getAllNhanVien = async (req, res) => {
  try {
    const { roleId = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (roleId) {
      whereClause += ' AND nv.ID_Role = ?';
      params.push(roleId);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM NhanVien nv ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [employees] = await db.query(
      `SELECT nv.ID, nv.TenNhanVien, nv.Username, nv.Email, nv.CCCD, 
              nv.TrangThaiNhanVien, nv.createdAt, nv.ID_Role, r.TenRole
       FROM NhanVien nv
       JOIN Role r ON nv.ID_Role = r.ID
       ${whereClause}
       ORDER BY nv.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: employees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách nhân viên',
      error: error.message
    });
  }
};

// Get employee by ID (Manager only)
exports.getNhanVienById = async (req, res) => {
  try {
    const { id } = req.params;

    const [employees] = await db.query(
      `SELECT nv.ID, nv.TenNhanVien, nv.Username, nv.Email, nv.CCCD, nv.TrangThaiNhanVien, nv.createdAt, nv.ID_Role, r.TenRole
       FROM NhanVien nv
       JOIN Role r ON nv.ID_Role = r.ID
       WHERE nv.ID = ?`,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    res.json({
      success: true,
      data: employees[0]
    });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin nhân viên',
      error: error.message
    });
  }
};

// Create employee (Manager only)
exports.createNhanVien = async (req, res) => {
  try {
    const { TenNhanVien, Username, Email, MatKhau, ID_Role, CCCD } = req.body;

    if (!TenNhanVien || !Username || !Email || !MatKhau || !ID_Role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin nhân viên'
      });
    }

    // Check username exists
    const [existingUsernames] = await db.query(
      'SELECT ID FROM NhanVien WHERE Username = ?',
      [Username]
    );

    if (existingUsernames.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username đã tồn tại'
      });
    }

    // Check email exists
    const [existingEmails] = await db.query(
      'SELECT ID FROM NhanVien WHERE Email = ?',
      [Email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    // Insert employee
    const [result] = await db.query(
      `INSERT INTO NhanVien (TenNhanVien, Username, Email, MatKhau, ID_Role, CCCD)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [TenNhanVien, Username, Email, hashedPassword, ID_Role, CCCD || null]
    );

    const [newEmployee] = await db.query(
      `SELECT nv.ID, nv.TenNhanVien, nv.Username, nv.Email, nv.CCCD, nv.TrangThaiNhanVien, nv.createdAt, nv.ID_Role, r.TenRole
       FROM NhanVien nv
       JOIN Role r ON nv.ID_Role = r.ID
       WHERE nv.ID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo nhân viên thành công',
      data: newEmployee[0]
    });

  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo nhân viên',
      error: error.message
    });
  }
};

// Update employee (Manager only)
exports.updateNhanVien = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenNhanVien, Username, Email, MatKhau, ID_Role, CCCD, TrangThaiNhanVien } = req.body;

    const [employees] = await db.query('SELECT * FROM NhanVien WHERE ID = ?', [id]);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Check username exists for other user
    if (Username) {
      const [existingUsernames] = await db.query(
        'SELECT ID FROM NhanVien WHERE Username = ? AND ID != ?',
        [Username, id]
      );

      if (existingUsernames.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username đã tồn tại'
        });
      }
    }

    // Check email exists for other user
    if (Email) {
      const [existingEmails] = await db.query(
        'SELECT ID FROM NhanVien WHERE Email = ? AND ID != ?',
        [Email, id]
      );

      if (existingEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }
    }

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (TenNhanVien) {
      updateFields.push('TenNhanVien = ?');
      updateValues.push(TenNhanVien);
    }
    if (Username) {
      updateFields.push('Username = ?');
      updateValues.push(Username);
    }
    if (Email) {
      updateFields.push('Email = ?');
      updateValues.push(Email);
    }
    if (CCCD !== undefined) {
      updateFields.push('CCCD = ?');
      updateValues.push(CCCD || null);
    }
    if (ID_Role) {
      updateFields.push('ID_Role = ?');
      updateValues.push(ID_Role);
    }
    if (TrangThaiNhanVien) {
      updateFields.push('TrangThaiNhanVien = ?');
      updateValues.push(TrangThaiNhanVien);
    }
    if (MatKhau) {
      const hashedPassword = await bcrypt.hash(MatKhau, 10);
      updateFields.push('MatKhau = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await db.query(
        `UPDATE NhanVien SET ${updateFields.join(', ')} WHERE ID = ?`,
        updateValues
      );
    }

    const [updated] = await db.query(
      `SELECT nv.ID, nv.TenNhanVien, nv.Username, nv.Email, nv.CCCD, nv.TrangThaiNhanVien, nv.createdAt, nv.ID_Role, r.TenRole
       FROM NhanVien nv
       JOIN Role r ON nv.ID_Role = r.ID
       WHERE nv.ID = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Cập nhật nhân viên thành công',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật nhân viên',
      error: error.message
    });
  }
};

// Delete employee (Manager only)
exports.deleteNhanVien = async (req, res) => {
  try {
    const { id } = req.params;

    const [employees] = await db.query('SELECT * FROM NhanVien WHERE ID = ?', [id]);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Cannot delete admin or self (should check in frontend too)
    if (employees[0].Email === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản admin'
      });
    }

    await db.query('DELETE FROM NhanVien WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa nhân viên thành công'
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa nhân viên',
      error: error.message
    });
  }
};

// Get pending documents (Manager only)
exports.getPendingHoSo = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM HoSo 
       WHERE TrangThaiHoSo = 'Chờ duyệt'`
    );
    const total = countResult[0].total;

    const [documents] = await db.query(
      `SELECT hs.*, 
              co.TenCoHoi, co.ID_NhanVien,
              kh.TenKhachHang, kh.TenDoanhNghiep,
              nv.TenNhanVien
       FROM HoSo hs
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
       WHERE hs.TrangThaiHoSo = 'Chờ duyệt'
       ORDER BY hs.NgayUpload ASC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: documents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách hồ sơ chờ duyệt',
      error: error.message
    });
  }
};

// Get overdue appointments (Manager only)
exports.getOverdueLichHen = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM LichHen 
       WHERE ThoiGianHen < NOW() AND TrangThaiLichHen = 'Sắp diễn ra'`
    );
    const total = countResult[0].total;

    const [appointments] = await db.query(
      `SELECT lh.*, 
              co.TenCoHoi, co.ID_NhanVien,
              kh.TenKhachHang, kh.TenDoanhNghiep,
              nv.TenNhanVien
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
       WHERE lh.ThoiGianHen < NOW() AND lh.TrangThaiLichHen = 'Sắp diễn ra'
       ORDER BY lh.ThoiGianHen ASC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get overdue appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách lịch hẹn quá hạn',
      error: error.message
    });
  }
};
