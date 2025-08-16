// routes/debitNoteRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDebitNote,
  getDebitNotes,
  getDebitNoteById,
  updateDebitNote,
  deleteDebitNote,
  generateDebitNoteExcel,
  generateDebitNotePdf,
  getDebitNotesForBill,
  checkBillCanHaveDebitNote,
} = require('../controllers/debitNoteController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(isAdmin);

// Debit Note routes
router.route('/')
  .post( createDebitNote)
  .get(getDebitNotes);

router.route('/:id')
  .get( getDebitNoteById)
  .put( updateDebitNote)
  .delete( deleteDebitNote);

router.route('/:id/excel')
  .get( generateDebitNoteExcel);

router.route('/:id/pdf')
  .get( generateDebitNotePdf);

// Bill-related debit note routes
router.route('/bills/:billId/debit-notes')
  .get( getDebitNotesForBill);

router.route('/bills/:billId/can-have-debit-note')
  .get( checkBillCanHaveDebitNote);

module.exports = router;