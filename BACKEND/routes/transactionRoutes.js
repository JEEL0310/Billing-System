const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getFilteredTransactionSummary,
  exportTransactionsToExcel,
  exportTransactionsToPDF
} = require('../controllers/transactionController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

router.route('/')
  .post(createTransaction)
  .get(getTransactions);

// Route for filtered summary
router.route('/summary')
  .get(getFilteredTransactionSummary);

router.route('/export/excel')
  .get( exportTransactionsToExcel);

router.route('/export/pdf')
  .get( exportTransactionsToPDF);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction) // Limited updates (e.g., notes, reference)
  .delete(deleteTransaction); // Deletes transaction and attempts to reverse linked payments

module.exports = router;