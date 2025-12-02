const db = require('../config/db');

// Get all notifications for current user
exports.getAll = async (req, res) => {
  try {
    const { trangThai = '', page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ID_NhanVien = ?';
    let params = [userId];

    if (trangThai) {
      whereClause += ' AND TrangThai = ?';
      params.push(trangThai);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM ThongBao ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [notifications] = await db.query(
      `SELECT * FROM ThongBao 
       ${whereClause}
       ORDER BY NgayTao DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Count unread
    const [unreadResult] = await db.query(
      `SELECT COUNT(*) as unread FROM ThongBao 
       WHERE ID_NhanVien = ? AND TrangThai = 'Chưa đọc'`,
      [userId]
    );

    res.json({
      success: true,
      data: notifications,
      unread: unreadResult[0].unread,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách thông báo',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [notifications] = await db.query(
      'SELECT * FROM ThongBao WHERE ID = ?',
      [id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    // Authorization: Can only mark own notifications
    if (notifications[0].ID_NhanVien !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông báo này'
      });
    }

    await db.query(
      `UPDATE ThongBao SET TrangThai = 'Đã đọc' WHERE ID = ?`,
      [id]
    );

    const [updated] = await db.query('SELECT * FROM ThongBao WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Đánh dấu đã đọc thành công',
      data: updated[0]
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông báo',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await db.query(
      `UPDATE ThongBao 
       SET TrangThai = 'Đã đọc' 
       WHERE ID_NhanVien = ? AND TrangThai = 'Chưa đọc'`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông báo',
      error: error.message
    });
  }
};
