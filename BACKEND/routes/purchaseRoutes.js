const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  downloadPurchasesExcel,
  downloadPurchasesPdf
} = require('../controllers/purchaseController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

router.route('/')
  .post(createPurchase)
  .get(getPurchases);

router.route('/:id')
  .get(getPurchaseById)
  .put(updatePurchase)
  .delete(deletePurchase);

router.route('/download/excel')
  .get(downloadPurchasesExcel); 

router.route('/download/pdf')
  .get(downloadPurchasesPdf); 

module.exports = router;