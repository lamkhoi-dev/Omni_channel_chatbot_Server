const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Multer configuration for HoSo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/hoso/');
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

// Get all documents
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
      whereClause += ' AND hs.TrangThaiHoSo = ?';
      params.push(trangThai);
    }

    if (coHoiId) {
      whereClause += ' AND hs.ID_CoHoi = ?';
      params.push(coHoiId);
    }

    if (khachhangId) {
      whereClause += ' AND co.ID_KhachHang = ?';
      params.push(khachhangId);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM HoSo hs
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const query = `
      SELECT hs.*, 
             co.TenCoHoi, co.ID_NhanVien,
             kh.TenKhachHang, kh.TenDoanhNghiep
      FROM HoSo hs
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      ${whereClause}
      ORDER BY hs.NgayUpload DESC
      LIMIT ? OFFSET ?
    `;
    
    const [documents] = await db.query(query, [...params, parseInt(limit), offset]);

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
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách hồ sơ',
      error: error.message
    });
  }
};

// Get document by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [documents] = await db.query(
      `SELECT hs.*, 
              co.TenCoHoi, co.ID_NhanVien,
              kh.TenKhachHang, kh.TenDoanhNghiep
       FROM HoSo hs
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       WHERE hs.ID = ?`,
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ'
      });
    }

    const document = documents[0];

    // Authorization
    if (roleId === 1 && document.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem hồ sơ này'
      });
    }

    res.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin hồ sơ',
      error: error.message
    });
  }
};

// Upload document
exports.upload = (req, res) => {
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
        message: 'Vui lòng chọn file để upload'
      });
    }

    try {
      const { ID_CoHoi, TenHoSo, GhiChu } = req.body;
      const userId = req.user.userId;
      const roleId = req.user.roleId;

      if (!ID_CoHoi || !TenHoSo) {
        // Delete uploaded file
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ cơ hội và tên hồ sơ'
        });
      }

      // Check if opportunity exists and belongs to user
      const [opportunities] = await db.query(
        'SELECT * FROM CoHoi WHERE ID = ?',
        [ID_CoHoi]
      );

      if (opportunities.length === 0) {
        await fs.unlink(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cơ hội'
        });
      }

      const opportunity = opportunities[0];

      // Authorization
      if (roleId === 1 && opportunity.ID_NhanVien !== userId) {
        await fs.unlink(req.file.path);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền upload hồ sơ cho cơ hội này'
        });
      }

      // Insert document
      const [result] = await db.query(
        `INSERT INTO HoSo (ID_CoHoi, TenHoSo, FileHoSo, TrangThaiHoSo, GhiChu)
         VALUES (?, ?, ?, 'Chờ duyệt', ?)`,
        [ID_CoHoi, TenHoSo, req.file.filename, GhiChu]
      );

      const [newDocument] = await db.query('SELECT * FROM HoSo WHERE ID = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Upload hồ sơ thành công',
        data: newDocument[0]
      });

    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi upload hồ sơ',
        error: error.message
      });
    }
  });
};

// Approve document (Manager only)
exports.approve = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { GhiChu } = req.body;
    const roleId = req.user.roleId;

    // Check role: Only manager (2) or director (3) can approve
    if (![2, 3].includes(roleId)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản lý mới có quyền duyệt hồ sơ'
      });
    }

    await connection.beginTransaction();

    const [documents] = await connection.query('SELECT * FROM HoSo WHERE ID = ?', [id]);
    
    if (documents.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ'
      });
    }

    // Update document status
    await connection.query(
      `UPDATE HoSo SET TrangThaiHoSo = 'Đã duyệt', NgayDuyet = NOW(), GhiChu = ? WHERE ID = ?`,
      [GhiChu, id]
    );

    // Get opportunity info for notification
    const [opportunities] = await connection.query(
      `SELECT co.ID_NhanVien FROM CoHoi co
       JOIN HoSo hs ON hs.ID_CoHoi = co.ID
       WHERE hs.ID = ?`,
      [id]
    );

    if (opportunities.length > 0) {
      // Create notification
      await connection.query(
        `INSERT INTO ThongBao (ID_NhanVien, LoaiThongBao, NoiDung)
         VALUES (?, 'Hồ sơ duyệt', ?)`,
        [opportunities[0].ID_NhanVien, `Hồ sơ "${documents[0].TenHoSo}" đã được duyệt`]
      );

      await connection.commit();

      // Emit Socket.IO notification
      const io = req.app.get('io');
      io.to(`user_${opportunities[0].ID_NhanVien}`).emit('hoso-approved', {
        type: 'Hồ sơ được duyệt',
        message: `Hồ sơ "${documents[0].TenHoSo}" đã được duyệt`,
        documentId: id
      });
    } else {
      await connection.commit();
    }

    const [updated] = await db.query('SELECT * FROM HoSo WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Duyệt hồ sơ thành công',
      data: updated[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Approve document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi duyệt hồ sơ',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Reject document (Manager only)
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { GhiChu } = req.body;
    const roleId = req.user.roleId;

    // Check role
    if (![2, 3].includes(roleId)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản lý mới có quyền từ chối hồ sơ'
      });
    }

    if (!GhiChu) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const [documents] = await db.query('SELECT * FROM HoSo WHERE ID = ?', [id]);
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ'
      });
    }

    // Update document status
    await db.query(
      `UPDATE HoSo SET TrangThaiHoSo = 'Bổ sung', GhiChu = ? WHERE ID = ?`,
      [GhiChu, id]
    );

    const [updated] = await db.query('SELECT * FROM HoSo WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Từ chối hồ sơ thành công',
      data: updated[0]
    });

  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi từ chối hồ sơ',
      error: error.message
    });
  }
};

// Re-upload document (for rejected documents)
exports.reupload = (req, res) => {
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
        message: 'Vui lòng chọn file để upload'
      });
    }

    try {
      const { id } = req.params;
      const { TenHoSo, GhiChu } = req.body;
      const userId = req.user.userId;
      const roleId = req.user.roleId;

      // Get existing document
      const [documents] = await db.query(
        `SELECT hs.*, co.ID_NhanVien
         FROM HoSo hs
         JOIN CoHoi co ON hs.ID_CoHoi = co.ID
         WHERE hs.ID = ?`,
        [id]
      );

      if (documents.length === 0) {
        await fs.unlink(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hồ sơ'
        });
      }

      const document = documents[0];

      // Authorization: Only document owner can re-upload
      if (roleId === 1 && document.ID_NhanVien !== userId) {
        await fs.unlink(req.file.path);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền re-upload hồ sơ này'
        });
      }

      // Check status: Only "Bổ sung" (rejected) documents can be re-uploaded
      if (document.TrangThaiHoSo !== 'Bổ sung') {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể re-upload hồ sơ đang ở trạng thái Bổ sung'
        });
      }

      // Delete old file
      const oldFilePath = path.join(__dirname, '../uploads/hoso', document.FileHoSo);
      try {
        await fs.unlink(oldFilePath);
      } catch (err) {
        console.error('Error deleting old file:', err);
      }

      // Update document
      const newTenHoSo = TenHoSo || document.TenHoSo;
      await db.query(
        `UPDATE HoSo 
         SET TenHoSo = ?, FileHoSo = ?, TrangThaiHoSo = 'Chờ duyệt', GhiChu = ?, NgayUpload = NOW(), NgayDuyet = NULL
         WHERE ID = ?`,
        [newTenHoSo, req.file.filename, GhiChu, id]
      );

      const [updated] = await db.query('SELECT * FROM HoSo WHERE ID = ?', [id]);

      res.json({
        success: true,
        message: 'Re-upload hồ sơ thành công',
        data: updated[0]
      });

    } catch (error) {
      // Delete uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      console.error('Re-upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi re-upload hồ sơ',
        error: error.message
      });
    }
  });
};

// Download document
exports.download = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [documents] = await db.query(
      `SELECT hs.*, co.ID_NhanVien
       FROM HoSo hs
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       WHERE hs.ID = ?`,
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ'
      });
    }

    const document = documents[0];

    // Authorization: Own document or manager
    if (roleId === 1 && document.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tải hồ sơ này'
      });
    }

    const filePath = path.join(__dirname, '../uploads/hoso', document.FileHoSo);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại'
      });
    }

    res.download(filePath, document.TenHoSo + path.extname(document.FileHoSo));

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tải hồ sơ',
      error: error.message
    });
  }
};

// Delete document
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [documents] = await db.query(
      `SELECT hs.*, co.ID_NhanVien
       FROM HoSo hs
       JOIN CoHoi co ON hs.ID_CoHoi = co.ID
       WHERE hs.ID = ?`,
      [id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ'
      });
    }

    const document = documents[0];

    // Authorization
    if (roleId === 1 && document.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa hồ sơ này'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads/hoso', document.FileHoSo);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Delete from database
    await db.query('DELETE FROM HoSo WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa hồ sơ thành công'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa hồ sơ',
      error: error.message
    });
  }
};
