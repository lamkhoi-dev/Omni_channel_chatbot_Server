const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const cohoiController = require('../controllers/cohoiController');

// All routes require authentication
router.use(authMiddleware);

// Export to Excel (must be before /:id)
router.get('/export/excel', cohoiController.exportExcel);

// Get all opportunities
router.get('/', cohoiController.getAll);

// Get opportunity by ID
router.get('/:id', cohoiController.getById);

// Create new opportunity
router.post('/', cohoiController.create);

// Update opportunity
router.put('/:id', cohoiController.update);

// Update opportunity status (with state machine validation)
router.put('/:id/status', cohoiController.updateStatus);

// Delete opportunity
router.delete('/:id', cohoiController.delete);

module.exports = router;
