const mongoose = require('mongoose');

const BillItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsnSacCode: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
}, { _id: true });

const BillSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  billDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  challan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challan',
    default: null,
  },
  challanNumber: {
    type: String,
    trim: true,
    default: '',
  },
  dueDate: {
    type: Date,
  },
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
  items: [BillItemSchema],
  subTotalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  amountAfterDiscount: {
    type: Number,
    default: 0,
  },
  taxType: {
    type: String,
    enum: ['CGST_SGST', 'IGST', 'JOBCGST_JOBSGST'],
    required: true,
  },
  cgstPercentage: {
    type: Number,
    default: 0,
  },
  cgstAmount: {
    type: Number,
    default: 0,
  },
  sgstPercentage: {
    type: Number,
    default: 0,
  },
  sgstAmount: {
    type: Number,
    default: 0,
  },
  igstPercentage: {
    type: Number,
    default: 0,
  },
  igstAmount: {
    type: Number,
    default: 0,
  },
  jobCgstPercentage: {
    type: Number,
    default: 0,
  },
  jobCgstAmount: {
    type: Number,
    default: 0,
  },
  jobSgstPercentage: {
    type: Number,
    default: 0,
  },
  jobSgstAmount: {
    type: Number,
    default: 0,
  },
  totalTaxAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  amountInWords: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'],
    default: 'Pending',
  },
  totalPaidAmount: {
    type: Number,
    default: 0,
  },
  paymentRecords: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    paymentDate: { type: Date, required: true },
    amountPaid: { type: Number, required: true, min: 0.01 },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, unique: true, sparse: true },
    paymentMethod: String,
    referenceNumber: String,
    notes: String,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  excelFilePath: { type: String },
  pdfFilePath: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to calculate taxes, amounts, and update fields
BillSchema.pre('save', async function(next) {
  const Settings = mongoose.model('Settings');
  const settings = await Settings.getSettings();

  // Calculate subTotalAmount from items
  this.subTotalAmount = this.items.reduce((acc, item) => acc + item.amount, 0);
  this.subTotalAmount = parseFloat(this.subTotalAmount.toFixed(2));

  // Calculate discount
  this.discountAmount = (this.subTotalAmount * this.discountPercentage) / 100;
  this.discountAmount = parseFloat(this.discountAmount.toFixed(2));
  this.amountAfterDiscount = this.subTotalAmount - this.discountAmount;
  this.amountAfterDiscount = parseFloat(this.amountAfterDiscount.toFixed(2));

  // Reset tax amounts
  this.cgstAmount = 0;
  this.sgstAmount = 0;
  this.igstAmount = 0;
  this.jobCgstAmount = 0;
  this.jobSgstAmount = 0;

  // Apply tax based on taxType
  if (this.taxType === 'CGST_SGST') {
    this.cgstPercentage = settings.cgstPercentage;
    this.sgstPercentage = settings.sgstPercentage;
    this.cgstAmount = (this.amountAfterDiscount * this.cgstPercentage) / 100;
    this.sgstAmount = (this.amountAfterDiscount * this.sgstPercentage) / 100;
  } else if (this.taxType === 'IGST') {
    this.igstPercentage = settings.igstPercentage;
    this.igstAmount = (this.amountAfterDiscount * this.igstPercentage) / 100;
  } else if (this.taxType === 'JOBCGST_JOBSGST') {
    this.jobCgstPercentage = settings.jobCgstPercentage;
    this.jobSgstPercentage = settings.jobSgstPercentage;
    this.jobCgstAmount = (this.amountAfterDiscount * this.jobCgstPercentage) / 100;
    this.jobSgstAmount = (this.amountAfterDiscount * this.jobSgstPercentage) / 100;
  }

  // Calculate total tax amount
  this.totalTaxAmount = this.cgstAmount + this.sgstAmount + this.igstAmount + this.jobCgstAmount + this.jobSgstAmount;
  this.totalTaxAmount = parseFloat(this.totalTaxAmount.toFixed(2));

  // Calculate total amount
  this.totalAmount = this.amountAfterDiscount + this.totalTaxAmount;
  this.totalAmount = parseFloat(this.totalAmount.toFixed(2));

  // Update total paid amount and status
  this.totalPaidAmount = this.paymentRecords.reduce((acc, record) => acc + record.amountPaid, 0);
  this.totalPaidAmount = parseFloat(this.totalPaidAmount.toFixed(2));

  if (this.totalPaidAmount >= this.totalAmount) {
    this.status = 'Paid';
  } else if (this.totalPaidAmount > 0 && this.totalPaidAmount < this.totalAmount) {
    this.status = 'Partially Paid';
  } else if (this.totalPaidAmount === 0 && this.status !== 'Cancelled') {
    this.status = 'Pending';
  }

  // Set due date if billDate is modified or dueDate is not set
  if (this.isModified('billDate') || !this.dueDate) {
    const dueDate = new Date(this.billDate);
    dueDate.setDate(dueDate.getDate() + 30);
    this.dueDate = dueDate;
  }

  // Update updatedAt
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }

  next();
});

module.exports = mongoose.model('Bill', BillSchema);