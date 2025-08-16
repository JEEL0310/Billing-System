// models/DebitNote.js
const mongoose = require('mongoose');

const DebitNoteSchema = new mongoose.Schema({
  debitNoteNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  originalBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true,
  },
  originalBillNumber: { type: String, required: false },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyDetailsSnapshot: {
    name: String,
    address: String,
    gstNumber: String,
  },
  originalBillNumber: String,
  originalBillDate: Date,
  paymentDate: Date,
  lateDays: Number,
  interestRatePerDay: {
    type: Number,
    default: 0.02, // 2% per day as per declaration
  },
  principalAmount: Number, // Original overdue amount
  interestAmount: Number,
  cgstPercentage: {
    type: Number,
    default: 6, // 6% CGST
  },
  cgstAmount: Number,
  sgstPercentage: {
    type: Number,
    default: 6, // 6% SGST
  },
  sgstAmount: Number,
  totalTaxAmount: Number,
  tdsPercentage: {
    type: Number,
    default: 1, // 1% TDS
  },
  tdsAmount: Number,
  totalAmount: Number,
  amountInWords: String,
  excelFilePath: String,
  pdfFilePath: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to calculate totals
DebitNoteSchema.pre('save', function(next) {
  // Calculate late days
  if (this.isModified('paymentDate') || !this.lateDays) {
    const dueDate = new Date(this.originalBillDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days after bill date is due date
    const paymentDate = this.paymentDate ? new Date(this.paymentDate) : new Date();
    this.lateDays = Math.max(0, Math.floor((paymentDate - dueDate) / (1000 * 60 * 60 * 24)));
  }

  // Calculate interest amount
  this.interestAmount = this.principalAmount * this.interestRatePerDay * this.lateDays;
  this.interestAmount = parseFloat(this.interestAmount.toFixed(2));

  // Calculate taxes
  this.cgstAmount = parseFloat((this.interestAmount * this.cgstPercentage / 100).toFixed(2));
  this.sgstAmount = parseFloat((this.interestAmount * this.sgstPercentage / 100).toFixed(2));
  this.totalTaxAmount = parseFloat((this.cgstAmount + this.sgstAmount).toFixed(2));

  // Calculate TDS
  this.tdsAmount = parseFloat((this.interestAmount * this.tdsPercentage / 100).toFixed(2));

  // Calculate total amount
  this.totalAmount = parseFloat((this.interestAmount + this.totalTaxAmount - this.tdsAmount).toFixed(2));

  if (this.netPayable && typeof this.netPayable === 'number') {
    this.amountInWords = amountToWords(this.netPayable);
  }
  next();
});

module.exports = mongoose.model('DebitNote', DebitNoteSchema);