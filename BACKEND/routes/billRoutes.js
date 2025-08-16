const express = require('express');
const router = express.Router();
const {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  generateBillExcel,
  generateBillPdf,
  downloadBillsExcel,
  downloadBillsPdf,
  getAvailableChallans
} = require('../controllers/billController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

router.route('/')
  .post(createBill)
  .get(getBills);

router.route('/:id')
  .get(getBillById)
  .put(updateBill)
  .delete(deleteBill);

// Route to get available challans for a company
router.route('/available-challans/:companyId')
  .get(getAvailableChallans); // GET request to retrieve available challans for a specific company

// Routes for downloading bills in bulk
router.route('/download/excel')
  .get(downloadBillsExcel); // GET request to download all bills as Excel

router.route('/download/pdf')
  .get(downloadBillsPdf); // GET request to download all bills as PDF

// Routes for file generation
router.route('/:id/excel')
  .get(generateBillExcel); // GET request to trigger generation and download

router.route('/:id/pdf')
  .get(generateBillPdf);   // GET request to trigger generation and download (or return path)

module.exports = router;