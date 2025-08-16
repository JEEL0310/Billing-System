const express = require('express');
const router = express.Router();
const {
  getTransactionReport,
  exportTransactionReportCSV,
  // exportTransactionReportExcel, // Placeholder for future Excel export
} = require('../controllers/reportController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

// Transaction Reports
router.get('/transactions', getTransactionReport);
router.get('/transactions/export/csv', exportTransactionReportCSV);
// router.get('/transactions/export/excel', exportTransactionReportExcel); // Future

// You can add more report routes here, e.g., Sales Report, Purchase Report, GST Report etc.

module.exports = router;