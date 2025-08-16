const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  supplierCompany: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  supplierDetailsSnapshot: {
    name: String,
    address: String,
    gstNumber: String,
  },
  challanNumber: {
    type: String,
    trim: true,
  },
  purchaseBillNumber: { 
    type: String,
    required: [true, 'Supplier bill number is required.'],
    trim: true,
  },
  challanDate: {
    type: Date,
  },
  purchaseBillDate: {
    type: Date,
    required: [true, 'Supplier bill date is required.'],
  },
  denier: {
    type: String,
    trim: true,
  },
  grade: { 
    type: String,
    trim: true,
  },
  totalGrossWeight: { 
    type: Number,
    required: [true, 'Total gross weight is required.'],
    min: 0,
  },
  tareWeight: { 
    type: Number,
    default: 0,
    min: 0,
  },
  netWeight: { 
    type: Number,
    required: true,
    min: 0,
  },
  ratePerUnit: { 
    type: Number,
    required: [true, 'Rate per unit is required.'],
    min: 0
  },
  amount: { 
    type: Number,
    required: [true, 'Purchase amount is required.'],
    min: 0,
  },
 
  dueDate: { 
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid'],
    default: 'Unpaid',
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
  notes: { 
    type: String,
    trim: true,
  },
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

PurchaseSchema.pre('save', function(next) {
  this.totalPaidAmount = this.paymentRecords.reduce((acc, record) => acc + record.amountPaid, 0);
  this.totalPaidAmount = parseFloat(this.totalPaidAmount.toFixed(2));

  if (this.totalPaidAmount >= this.amount) {
    this.paymentStatus = 'Paid';
  } else if (this.totalPaidAmount > 0 && this.totalPaidAmount < this.amount) {
    this.paymentStatus = 'Partially Paid';
  } else if (this.totalPaidAmount === 0) {
    this.paymentStatus = 'Unpaid';
  }

  if (this.totalGrossWeight !== undefined && this.tareWeight !== undefined) {
    this.netWeight = parseFloat((this.totalGrossWeight - this.tareWeight).toFixed(3)); 
  }


  if (this.isModified('purchaseBillDate') || !this.dueDate) {
    const dueDate = new Date(this.purchaseBillDate);
    dueDate.setDate(dueDate.getDate() + 15); 
    this.dueDate = dueDate;
  }

  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

PurchaseSchema.index({ supplierCompany: 1, purchaseBillNumber: 1 });

module.exports = mongoose.model('Purchase', PurchaseSchema);