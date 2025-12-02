const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const lichhenController = require('../controllers/lichhenController');

// All routes require authentication
router.use(authMiddleware);

// Get today's appointments
router.get('/today', lichhenController.getToday);

// Get all appointments
router.get('/', lichhenController.getAll);

// Get appointment by ID
router.get('/:id', lichhenController.getById);

// Create new appointment
router.post('/', lichhenController.create);

// Update appointment
router.put('/:id', lichhenController.update);

// Complete appointment
router.put('/:id/complete', lichhenController.complete);

// Cancel appointment
router.put('/:id/cancel', lichhenController.cancel);

// Delete appointment
router.delete('/:id', lichhenController.delete);

module.exports = router;
