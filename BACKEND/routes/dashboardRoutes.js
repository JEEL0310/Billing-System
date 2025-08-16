const express = require('express');
const router = express.Router();
const {
  getOverdueBills,
  getOverduePurchases,
  getAccountSummary,
  getMonthlyTransactionSummary,
  getMonthlyMaterialFlowSummary,
  getUpcomingBillDues,      // Added
  getUpcomingPurchaseDues,  // Added
} = require('../controllers/dashboardController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

router.get('/overdue-bills', getOverdueBills);
router.get('/overdue-purchases', getOverduePurchases);
router.get('/account-summary', getAccountSummary);
router.get('/monthly-transaction-summary', getMonthlyTransactionSummary);
router.get('/monthly-material-flow', getMonthlyMaterialFlowSummary);
router.get('/upcoming-bill-dues', getUpcomingBillDues);        // Added route
router.get('/upcoming-purchase-dues', getUpcomingPurchaseDues); // Added route

module.exports = router;