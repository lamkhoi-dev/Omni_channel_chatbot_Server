const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Multer configuration for HopDong
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/hopdong/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file: PDF, JPG, PNG, DOC, DOCX'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
}).single('file');

// Get all contracts
exports.getAll = async (req, res) => {
  try {
    const { trangThai = '', coHoiId = '', khachhangId = '', page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    const roleId = req.user.roleId;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (roleId === 1) {
      whereClause = 'WHERE co.ID_NhanVien = ?';
      params.push(userId);
    } else {
      whereClause = 'WHERE 1=1';
    }

    if (trangThai) {
      whereClause += ' AND hd.TrangThaiHopDong = ?';
      params.push(trangThai);
    }

    if (coHoiId) {
      whereClause += ' AND co.ID = ?';
      params.push(coHoiId);
    }

    if (khachhangId) {
      whereClause += ' AND co.ID_KhachHang = ?';
      params.push(khachhangId);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM HopDong hd
       JOIN HoSo hs ON hd.ID_HoSo = hs.ID
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const query = `
      SELECT hd.*, 
             hs.TenHoSo,
             co.TenCoHoi, co.ID_NhanVien,
             kh.TenKhachHang, kh.TenDoanhNghiep
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      ${whereClause}
      ORDER BY hd.NgayHieuLuc DESC
      LIMIT ? OFFSET ?
    `;
    
    const [contracts] = await db.query(query, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: contracts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách hợp đồng',
      error: error.message
    });
  }
};

// Get contract by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [contracts] = await db.query(
      `SELECT hd.*, 
              co.TenCoHoi, co.ID_NhanVien, co.ID_KhachHang,
              kh.TenKhachHang, kh.TenDoanhNghiep
       FROM HopDong hd
       JOIN CoHoi co ON hd.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       WHERE hd.ID = ?`,
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng'
      });
    }

    const contract = contracts[0];

    // Authorization
    if (roleId === 1 && contract.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem hợp đồng này'
      });
    }

    res.json({
      success: true,
      data: contract
    });

  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin hợp đồng',
      error: error.message
    });
  }
};

// Create contract (require approved HoSo)
exports.create = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file hợp đồng'
      });
    }

    const connection = await db.getConnection();

    try {
      const { 
        ID_HoSo, 
        MaHopDong, 
        GiaTri, 
        NgayHieuLuc, 
        NgayHetHan, 
        GhiChu 
      } = req.body;
      const userId = req.user.userId;
      const roleId = req.user.roleId;

      if (!ID_HoSo || !MaHopDong || !GiaTri || !NgayHieuLuc || !NgayHetHan) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin hợp đồng'
        });
      }

      await connection.beginTransaction();

      // CRITICAL: Validate HoSo must be approved and get CoHoi from it
      const [documents] = await connection.query(
        'SELECT hs.*, co.ID_NhanVien, co.ID_KhachHang FROM HoSo hs JOIN CoHoi co ON hs.ID_CoHoi = co.ID WHERE hs.ID = ?',
        [ID_HoSo]
      );

      if (documents.length === 0) {
        await connection.rollback();
        await fs.unlink(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hồ sơ'
        });
      }

      const document = documents[0];
      const ID_CoHoi = document.ID_CoHoi;

      if (document.TrangThaiHoSo !== 'Đã duyệt') {
        await connection.rollback();
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Hồ sơ chưa được duyệt. Chỉ được tạo hợp đồng khi hồ sơ đã được duyệt'
        });
      }

      // Authorization
      if (roleId === 1 && document.ID_NhanVien !== userId) {
        await connection.rollback();
        await fs.unlink(req.file.path);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền tạo hợp đồng cho cơ hội này'
        });
      }

      // Insert contract (no ID_CoHoi column in HopDong table)
      const [result] = await connection.query(
        `INSERT INTO HopDong (ID_HoSo, MaHopDong, GiaTri, NgayHieuLuc, NgayHetHan, FileHopDong)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ID_HoSo, MaHopDong, GiaTri, NgayHieuLuc, NgayHetHan, req.file.filename]
      );

      // Update opportunity status to 'Thành công'
      await connection.query(
        `UPDATE CoHoi SET TrangThaiCoHoi = 'Thành công' WHERE ID = ?`,
        [ID_CoHoi]
      );

      // Update customer status to 'Thành công'
      await connection.query(
        `UPDATE KhachHang SET TrangThaiKhachHang = 'Thành công' WHERE ID = ?`,
        [document.ID_KhachHang]
      );

      await connection.commit();

      const [newContract] = await db.query('SELECT * FROM HopDong WHERE ID = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Tạo hợp đồng thành công. Cơ hội và khách hàng đã được cập nhật trạng thái Thành công',
        data: newContract[0]
      });

    } catch (error) {
      await connection.rollback();
      // Delete uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      console.error('Create contract error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi tạo hợp đồng',
        error: error.message
      });
    } finally {
      connection.release();
    }
  });
};

// Update contract
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { MaHopDong, GiaTri, NgayHieuLuc, NgayHetHan, GhiChu } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [contracts] = await db.query(
      `SELECT hd.*, hs.ID_CoHoi, co.ID_NhanVien
       FROM HopDong hd
       JOIN HoSo hs ON hd.ID_HoSo = hs.ID
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       WHERE hd.ID = ?`,
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng'
      });
    }

    const contract = contracts[0];

    // Authorization
    if (roleId === 1 && contract.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa hợp đồng này'
      });
    }

    await db.query(
      `UPDATE HopDong 
       SET MaHopDong = COALESCE(?, MaHopDong),
           GiaTri = COALESCE(?, GiaTri),
           NgayHieuLuc = COALESCE(?, NgayHieuLuc),
           NgayHetHan = COALESCE(?, NgayHetHan),
           GhiChu = COALESCE(?, GhiChu)
       WHERE ID = ?`,
      [MaHopDong, GiaTri, NgayHieuLuc, NgayHetHan, GhiChu, id]
    );

    const [updated] = await db.query('SELECT * FROM HopDong WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Cập nhật hợp đồng thành công',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật hợp đồng',
      error: error.message
    });
  }
};

// Get expiring contracts (for cron job)
exports.getExpiring = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [contracts] = await db.query(
      `SELECT hd.*, 
              co.TenCoHoi, co.ID_NhanVien,
              kh.TenKhachHang, kh.TenDoanhNghiep
       FROM HopDong hd
       JOIN CoHoi co ON hd.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       WHERE hd.TrangThaiHopDong = 'Hiệu lực'
         AND DATEDIFF(hd.NgayHetHan, CURDATE()) <= ?
         AND DATEDIFF(hd.NgayHetHan, CURDATE()) >= 0
       ORDER BY hd.NgayHetHan ASC`,
      [parseInt(days)]
    );

    res.json({
      success: true,
      data: contracts
    });

  } catch (error) {
    console.error('Get expiring contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách hợp đồng sắp hết hạn',
      error: error.message
    });
  }
};

// Delete contract
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [contracts] = await db.query(
      `SELECT hd.*, co.ID_NhanVien
       FROM HopDong hd
       JOIN CoHoi co ON hd.ID_CoHoi = co.ID
       WHERE hd.ID = ?`,
      [id]
    );
    
    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng'
      });
    }

    const contract = contracts[0];

    // Authorization: Only manager can delete
    if (![2, 3].includes(roleId)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản lý mới có quyền xóa hợp đồng'
      });
    }

    // Delete file from filesystem
    if (contract.FileHopDong) {
      const filePath = path.join(__dirname, '../uploads/hopdong', contract.FileHopDong);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    // Delete from database
    await db.query('DELETE FROM HopDong WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa hợp đồng thành công'
    });

  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa hợp đồng',
      error: error.message
    });
  }
};

// Download contract file
exports.download = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Get contract with related data
    const [contracts] = await db.query(
      `SELECT hd.*, co.ID_NhanVien 
       FROM HopDong hd
       JOIN HoSo hs ON hd.ID_HoSo = hs.ID
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       WHERE hd.ID = ?`,
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng'
      });
    }

    const contract = contracts[0];

    // Authorization: Employee can only download their own, Manager can download all
    if (roleId === 1 && contract.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tải hợp đồng này'
      });
    }

    if (!contract.FileHopDong) {
      return res.status(404).json({
        success: false,
        message: 'File hợp đồng không tồn tại'
      });
    }

    const filePath = path.join(__dirname, '../uploads/hopdong', contract.FileHopDong);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại trên server'
      });
    }

    // Send file
    res.download(filePath, contract.FileHopDong);

  } catch (error) {
    console.error('Download contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tải file hợp đồng',
      error: error.message
    });
  }
};
