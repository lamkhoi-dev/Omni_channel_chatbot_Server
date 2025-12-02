const express = require('express');
const router = express.Router();
const hosoController = require('../controllers/hosoController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// All routes require authentication
router.use(authMiddleware);

// Get all documents
router.get('/', hosoController.getAll);

// Get document by ID
router.get('/:id', hosoController.getById);

// Upload document
router.post('/', hosoController.upload);

// Approve document (Manager only - Role 2)
router.put('/:id/approve', roleMiddleware([2]), hosoController.approve);

// Reject document (Manager only - Role 2)
router.put('/:id/reject', roleMiddleware([2]), hosoController.reject);

// Re-upload document (for rejected documents)
router.put('/:id/reupload', hosoController.reupload);

// Download document
router.get('/:id/download', hosoController.download);

// Delete document
router.delete('/:id', hosoController.delete);

module.exports = router;
