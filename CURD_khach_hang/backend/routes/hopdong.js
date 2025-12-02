const express = require('express');
const router = express.Router();
const hopdongController = require('../controllers/hopdongController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// All routes require authentication
router.use(authMiddleware);

// Get all contracts
router.get('/', hopdongController.getAll);

// Get expiring contracts (for cron job)
router.get('/expiring', hopdongController.getExpiring);

// Get contract by ID
router.get('/:id', hopdongController.getById);

// Download contract file
router.get('/:id/download', hopdongController.download);

// Create contract (requires approved HoSo)
router.post('/', hopdongController.create);

// Update contract
router.put('/:id', hopdongController.update);

// Delete contract (Manager only - Role 2)
router.delete('/:id', roleMiddleware([2]), hopdongController.delete);

module.exports = router;
