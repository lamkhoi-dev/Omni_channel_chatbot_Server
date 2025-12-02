const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Login attempt:', { username, passwordLength: password?.length });

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ username và password'
      });
    }

    // Find user
    const [users] = await db.query(
      `SELECT nv.*, r.TenRole 
       FROM NhanVien nv 
       JOIN Role r ON nv.ID_Role = r.ID 
       WHERE nv.Username = ?`,
      [username]
    );

    console.log('👤 User found:', users.length > 0 ? { 
      id: users[0].ID, 
      username: users[0].Username, 
      role: users[0].TenRole,
      status: users[0].TrangThaiNhanVien,
      hashedPasswordLength: users[0].MatKhau?.length
    } : 'NOT FOUND');

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    const user = users[0];

    // Check if account is active
    if (user.TrangThaiNhanVien === 'Khóa') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản lý'
      });
    }

    // Verify password
    console.log('🔑 Comparing passwords...');
    const isPasswordValid = await bcrypt.compare(password, user.MatKhau);
    console.log('✅ Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.ID,
        roleId: user.ID_Role,
        username: user.Username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info (exclude password)
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.ID,
        username: user.Username,
        tenNhanVien: user.TenNhanVien,
        email: user.Email,
        roleId: user.ID_Role,
        roleName: user.TenRole
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Get current user
    const [users] = await db.query('SELECT MatKhau FROM NhanVien WHERE ID = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, users[0].MatKhau);
    
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu cũ không đúng'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE NhanVien SET MatKhau = ?, updatedAt = CURRENT_TIMESTAMP WHERE ID = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đổi mật khẩu',
      error: error.message
    });
  }
};
