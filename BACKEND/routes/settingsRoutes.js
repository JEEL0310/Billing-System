const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  addItemConfiguration,
  updateItemConfiguration,
  deleteItemConfiguration,
} = require('../controllers/settingsController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

// Routes for general settings (GST percentages, etc.)
router.route('/')
  .get(getSettings)
  .put(updateSettings);

// Routes for managing individual item configurations (description, HSN/SAC, rate)
router.route('/item-configurations')
  .post(addItemConfiguration);

router.route('/item-configurations/:itemId')
  .put(updateItemConfiguration)
  .delete(deleteItemConfiguration);

module.exports = router;