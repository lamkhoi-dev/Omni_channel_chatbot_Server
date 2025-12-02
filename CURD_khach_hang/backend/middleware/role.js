const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.roleId) {
        return res.status(401).json({
          success: false,
          message: 'Chưa xác thực'
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.roleId)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập chức năng này'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra phân quyền',
        error: error.message
      });
    }
  };
};

module.exports = roleMiddleware;
