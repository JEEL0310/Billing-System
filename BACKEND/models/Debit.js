const mongoose = require('mongoose');

const debitNoteSchema = new mongoose.Schema({
    debitNoteNumber: { type: String, required: true, unique: true },
    issueDate: { type: Date, required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    companyDetailsSnapshot: {
        name: String,
        address: String,
        gstNumber: String,
    },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    lateDays: { type: Number },
    perDayInterest: { type: Number },
    totalInterest: { type: Number },
    cgstPercentage: { type: Number },
    cgstAmount: { type: Number },
    sgstPercentage: { type: Number },
    sgstAmount: { type: Number },
    totalTaxAmount: { type: Number },
    tdsAmount: { type: Number },
    totalAmount: { type: Number },
    amountInWords: { type: String },
    excelFilePath: { type: String },
    pdfFilePath: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
}); 

const Debit = mongoose.model('Debit', debitNoteSchema);
module.exports = Debit;