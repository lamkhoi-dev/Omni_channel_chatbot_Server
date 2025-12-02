const express = require('express');
const router = express.Router();
const thongbaoController = require('../controllers/thongbaoController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all notifications for current user
router.get('/', thongbaoController.getAll);

// Mark notification as read
router.put('/:id/read', thongbaoController.markAsRead);

// Mark all notifications as read
router.put('/read-all', thongbaoController.markAllAsRead);

module.exports = router;
