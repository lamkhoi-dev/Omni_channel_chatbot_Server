const db = require('../config/db');

// Get all appointments
exports.getAll = async (req, res) => {
  try {
    const { trangThai = '', coHoiId = '', khachhangId = '', from = '', to = '', page = 1, limit = 20 } = req.query;
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

    // Status filter
    if (trangThai) {
      whereClause += ' AND lh.TrangThaiLichHen = ?';
      params.push(trangThai);
    }

    // Opportunity filter
    if (coHoiId) {
      whereClause += ' AND lh.ID_CoHoi = ?';
      params.push(coHoiId);
    }

    // Customer filter
    if (khachhangId) {
      whereClause += ' AND co.ID_KhachHang = ?';
      params.push(khachhangId);
    }

    // Date range filter
    if (from) {
      whereClause += ' AND DATE(lh.ThoiGianHen) >= ?';
      params.push(from);
    }
    if (to) {
      whereClause += ' AND DATE(lh.ThoiGianHen) <= ?';
      params.push(to);
    }

    // Get total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get appointments
    const query = `
      SELECT lh.*, 
             co.TenCoHoi, co.TrangThaiCoHoi,
             kh.TenKhachHang, kh.TenDoanhNghiep, kh.SoDienThoai,
             nv.TenNhanVien
      FROM LichHen lh
      JOIN CoHoi co ON lh.ID_CoHoi = co.ID
      JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
      JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
      ${whereClause}
      ORDER BY lh.ThoiGianHen DESC
      LIMIT ? OFFSET ?
    `;
    
    const [appointments] = await db.query(query, [...params, parseInt(limit), offset]);

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
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách lịch hẹn',
      error: error.message
    });
  }
};

// Get today's appointments
exports.getToday = async (req, res) => {
  try {
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    let whereClause = 'WHERE DATE(lh.ThoiGianHen) = CURDATE()';
    let params = [];

    if (roleId === 1) {
      whereClause += ' AND co.ID_NhanVien = ?';
      params.push(userId);
    }

    const [appointments] = await db.query(
      `SELECT lh.*, 
              co.TenCoHoi,
              kh.TenKhachHang, kh.TenDoanhNghiep, kh.SoDienThoai
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       ${whereClause}
       ORDER BY lh.ThoiGianHen ASC`,
      params
    );

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch hẹn hôm nay',
      error: error.message
    });
  }
};

// Get appointment by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    const [appointments] = await db.query(
      `SELECT lh.*, 
              co.TenCoHoi, co.ID_NhanVien,
              kh.TenKhachHang, kh.TenDoanhNghiep, kh.SoDienThoai, kh.Email,
              nv.TenNhanVien
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       JOIN NhanVien nv ON co.ID_NhanVien = nv.ID
       WHERE lh.ID = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointments[0];

    // Authorization
    if (roleId === 1 && appointment.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch hẹn này'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin lịch hẹn',
      error: error.message
    });
  }
};

// Create new appointment
exports.create = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { ID_CoHoi, ThoiGianHen, DiaDiem, NoiDung } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Validation
    if (!ID_CoHoi || !ThoiGianHen) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ cơ hội và thời gian hẹn'
      });
    }

    await connection.beginTransaction();

    // Check if opportunity exists and belongs to user
    const [opportunities] = await connection.query(
      'SELECT * FROM CoHoi WHERE ID = ?',
      [ID_CoHoi]
    );

    if (opportunities.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội'
      });
    }

    const opportunity = opportunities[0];

    // CRITICAL VALIDATION: Cơ hội phải ở trạng thái 'Mới' hoặc 'Chờ xử lý'
    // Không cho phép tạo lịch hẹn cho cơ hội đã 'Thất bại' hoặc 'Thành công'
    if (opportunity.TrangThaiCoHoi === 'Thất bại') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cơ hội đã thất bại. Vui lòng tạo cơ hội mới nếu muốn hẹn lại với khách hàng này'
      });
    }

    if (opportunity.TrangThaiCoHoi === 'Thành công') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cơ hội đã thành công. Không thể tạo thêm lịch hẹn'
      });
    }

    // VALIDATION: Kiểm tra đã có lịch hẹn chưa hoàn thành
    const [existingAppointments] = await connection.query(
      `SELECT * FROM LichHen 
       WHERE ID_CoHoi = ? AND TrangThaiLichHen NOT IN ('Hoàn thành', 'Hủy')`,
      [ID_CoHoi]
    );

    if (existingAppointments.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cơ hội này đã có lịch hẹn đang diễn ra. Vui lòng hoàn thành hoặc hủy lịch hẹn cũ trước'
      });
    }

    // Authorization
    if (roleId === 1 && opportunity.ID_NhanVien !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo lịch hẹn cho cơ hội này'
      });
    }

    // Insert appointment
    const [result] = await connection.query(
      `INSERT INTO LichHen (ID_CoHoi, ThoiGianHen, DiaDiem, NoiDung, TrangThaiLichHen)
       VALUES (?, ?, ?, ?, 'Sắp diễn ra')`,
      [ID_CoHoi, ThoiGianHen, DiaDiem, NoiDung]
    );

    // AUTO UPDATE: CoHoi TrangThai to 'Chờ xử lý'
    await connection.query(
      `UPDATE CoHoi SET TrangThaiCoHoi = 'Chờ xử lý' WHERE ID = ?`,
      [ID_CoHoi]
    );

    // Create notification
    await connection.query(
      `INSERT INTO ThongBao (ID_NhanVien, LoaiThongBao, NoiDung)
       VALUES (?, 'Lịch hẹn', ?)`,
      [opportunity.ID_NhanVien, `Bạn có lịch hẹn mới vào ${ThoiGianHen} tại ${DiaDiem || 'chưa xác định'}`]
    );

    await connection.commit();

    // Get created appointment
    const [newAppointment] = await db.query(
      `SELECT lh.*, co.TenCoHoi, kh.TenKhachHang, kh.TenDoanhNghiep
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       JOIN KhachHang kh ON co.ID_KhachHang = kh.ID
       WHERE lh.ID = ?`,
      [result.insertId]
    );

    // Emit Socket.IO notification
    const io = req.app.get('io');
    io.to(`user_${opportunity.ID_NhanVien}`).emit('new-appointment', {
      type: 'Lịch hẹn mới',
      message: `Lịch hẹn mới vào ${ThoiGianHen}`,
      data: newAppointment[0]
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lịch hẹn thành công',
      data: newAppointment[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo lịch hẹn',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update appointment
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ThoiGianHen, DiaDiem, NoiDung } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Get appointment
    const [appointments] = await db.query(
      `SELECT lh.*, co.ID_NhanVien 
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       WHERE lh.ID = ?`,
      [id]
    );
    
    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointments[0];

    // Authorization
    if (roleId === 1 && appointment.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa lịch hẹn này'
      });
    }

    // Update appointment
    await db.query(
      `UPDATE LichHen SET ThoiGianHen = ?, DiaDiem = ?, NoiDung = ? WHERE ID = ?`,
      [ThoiGianHen, DiaDiem, NoiDung, id]
    );

    const [updated] = await db.query('SELECT * FROM LichHen WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Cập nhật lịch hẹn thành công',
      data: updated[0]
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật lịch hẹn',
      error: error.message
    });
  }
};

// Complete appointment
exports.complete = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { KetQuaSauCuocHen, isSuccess } = req.body;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    await connection.beginTransaction();

    // Get appointment
    const [appointments] = await connection.query(
      `SELECT lh.*, co.ID_NhanVien, co.ID as CoHoiID, co.ID_KhachHang
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       WHERE lh.ID = ?`,
      [id]
    );
    
    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointments[0];

    // Authorization
    if (roleId === 1 && appointment.ID_NhanVien !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hoàn thành lịch hẹn này'
      });
    }

    // Update appointment
    await connection.query(
      `UPDATE LichHen SET TrangThaiLichHen = 'Hoàn thành', KetQuaSauCuocHen = ? WHERE ID = ?`,
      [KetQuaSauCuocHen, id]
    );

    // Parse isSuccess (frontend sends as string "true"/"false")
    const isSuccessful = isSuccess === true || isSuccess === 'true';

    // If failed, update CoHoi to 'Thất bại' and run Churn Prediction
    if (!isSuccessful) {
      await connection.query(
        `UPDATE CoHoi SET TrangThaiCoHoi = 'Thất bại' WHERE ID = ?`,
        [appointment.CoHoiID]
      );

      // Run Churn Prediction - will update customer status based on remaining opportunities
      await runChurnPrediction(connection, appointment.ID_KhachHang);
    }

    await connection.commit();

    const [updated] = await db.query('SELECT * FROM LichHen WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Hoàn thành lịch hẹn thành công',
      data: updated[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hoàn thành lịch hẹn',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Cancel appointment
exports.cancel = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    await connection.beginTransaction();

    // Get appointment
    const [appointments] = await connection.query(
      `SELECT lh.*, co.ID_NhanVien, co.ID as CoHoiID, co.ID_KhachHang
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       WHERE lh.ID = ?`,
      [id]
    );
    
    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointments[0];

    // Authorization
    if (roleId === 1 && appointment.ID_NhanVien !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy lịch hẹn này'
      });
    }

    // Update appointment
    await connection.query(
      `UPDATE LichHen SET TrangThaiLichHen = 'Hủy' WHERE ID = ?`,
      [id]
    );

    // Update CoHoi to 'Thất bại' and run Churn Prediction
    await connection.query(
      `UPDATE CoHoi SET TrangThaiCoHoi = 'Thất bại' WHERE ID = ?`,
      [appointment.CoHoiID]
    );

    await runChurnPrediction(connection, appointment.ID_KhachHang);

    await connection.commit();

    const [updated] = await db.query('SELECT * FROM LichHen WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Hủy lịch hẹn thành công',
      data: updated[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hủy lịch hẹn',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Delete appointment
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Get appointment
    const [appointments] = await db.query(
      `SELECT lh.*, co.ID_NhanVien 
       FROM LichHen lh
       JOIN CoHoi co ON lh.ID_CoHoi = co.ID
       WHERE lh.ID = ?`,
      [id]
    );
    
    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointments[0];

    // Authorization
    if (roleId === 1 && appointment.ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa lịch hẹn này'
      });
    }

    await db.query('DELETE FROM LichHen WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa lịch hẹn thành công'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa lịch hẹn',
      error: error.message
    });
  }
};

// HELPER: Churn Prediction Logic (same as CoHoi)
async function runChurnPrediction(connection, khachHangId) {
  try {
    // Check if customer has any contracts
    const [contracts] = await connection.query(`
      SELECT hd.* 
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      WHERE co.ID_KhachHang = ?
    `, [khachHangId]);

    // Check for active/open opportunities (not failed)
    const [openOpportunities] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM CoHoi 
      WHERE ID_KhachHang = ? AND TrangThaiCoHoi IN ('Mới', 'Chờ xử lý')
    `, [khachHangId]);

    // Scenario 1: Customer has contracts
    if (contracts.length > 0) {
      // Check if any contracts are still active
      const [activeContracts] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM HopDong hd
        JOIN HoSo hs ON hd.ID_HoSo = hs.ID
        JOIN CoHoi co ON hs.ID_CoHoi = co.ID
        WHERE co.ID_KhachHang = ? AND hd.NgayHetHan >= CURDATE()
      `, [khachHangId]);

      // All contracts expired
      if (activeContracts[0].count === 0) {
        // If no open opportunities => "Rời bỏ"
        if (openOpportunities[0].count === 0) {
          await connection.query(
            `UPDATE KhachHang SET TrangThaiKhachHang = 'Rời bỏ' WHERE ID = ?`,
            [khachHangId]
          );
        }
        // Else: keep current status (might be "Đang chăm sóc" if has open opps)
      }
      // Else: has active contracts, keep status as is
    } 
    // Scenario 2: Customer has NO contracts yet
    else {
      // No open opportunities => "Không tiềm năng"
      if (openOpportunities[0].count === 0) {
        await connection.query(
          `UPDATE KhachHang SET TrangThaiKhachHang = 'Không tiềm năng' WHERE ID = ?`,
          [khachHangId]
        );
      }
      // Else: still has open opportunities, keep "Đang chăm sóc" or current status
    }
  } catch (error) {
    console.error('Churn prediction error:', error);
    throw error;
  }
}
