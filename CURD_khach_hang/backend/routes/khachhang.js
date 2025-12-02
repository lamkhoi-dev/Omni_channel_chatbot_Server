const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const khachhangController = require('../controllers/khachhangController');

// All routes require authentication
router.use(authMiddleware);

// Export to Excel (must be before /:id)
router.get('/export/excel', khachhangController.exportExcel);

// Get all customers (with filtering & pagination)
router.get('/', khachhangController.getAll);

// Get customer by ID (with related data: opportunities, appointments)
router.get('/:id', khachhangController.getById);

// Create new customer
router.post('/', khachhangController.create);

// Update customer
router.put('/:id', khachhangController.update);

// Delete customer
router.delete('/:id', khachhangController.delete);

module.exports = router;
