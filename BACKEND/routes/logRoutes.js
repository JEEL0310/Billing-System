const express = require('express');
const router = express.Router();
const { getAllLogs } = require('../controllers/logController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

// @route   GET /api/logs
// @desc    Get all logs (paginated)
// @access  Private/Admin
router.get('/', getAllLogs);

module.exports = router;