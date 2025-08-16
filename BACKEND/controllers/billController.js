const Bill = require('../models/Bill');
const Company = require('../models/Company');
const Settings = require('../models/Settings');
const Challan = require('../models/Challan');
const { log } = require('../middleware/logger');
const exceljs = require('exceljs');
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb, PageSizes } = require('pdf-lib');
const fontkit = require('fontkit');

const calculateBillTotals = (
  items,
  discountPercentage,
  taxType,
  cgstPercentage,
  sgstPercentage,
  igstPercentage,
  jobCgstPercentage,
  jobSgstPercentage
) => {
  // Calculate subtotal from items
  let subTotalAmount = 0;
  const calculatedItems = items.map(item => {
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const amount = parseFloat((quantity * rate).toFixed(2));
    subTotalAmount += amount;
    return {
      description: item.description,
      hsnSacCode: item.hsnSacCode,
      quantity,
      rate,
      amount
    };
  });

  subTotalAmount = parseFloat(subTotalAmount.toFixed(2));
  const discountAmount = parseFloat((subTotalAmount * (parseFloat(discountPercentage) / 100)).toFixed(2)) || 0;
  const amountAfterDiscount = parseFloat((subTotalAmount - discountAmount).toFixed(2));

  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0, jobCgstAmount = 0, jobSgstAmount = 0;
  let totalTaxAmount = 0;

  if (taxType === 'CGST_SGST') {
    cgstAmount = parseFloat((amountAfterDiscount * (parseFloat(cgstPercentage) / 100)).toFixed(2)) || 0;
    sgstAmount = parseFloat((amountAfterDiscount * (parseFloat(sgstPercentage) / 100)).toFixed(2)) || 0;
    totalTaxAmount = cgstAmount + sgstAmount;
  } else if (taxType === 'IGST') {
    igstAmount = parseFloat((amountAfterDiscount * (parseFloat(igstPercentage) / 100)).toFixed(2)) || 0;
    totalTaxAmount = igstAmount;
  } else if (taxType === 'JOBCGST_JOBSGST') {
    jobCgstAmount = parseFloat((amountAfterDiscount * (parseFloat(jobCgstPercentage) / 100)).toFixed(2)) || 0;
    jobSgstAmount = parseFloat((amountAfterDiscount * (parseFloat(jobSgstPercentage) / 100)).toFixed(2)) || 0;
    totalTaxAmount = jobCgstAmount + jobSgstAmount;
  }

  totalTaxAmount = parseFloat(totalTaxAmount.toFixed(2));
  const totalAmount = parseFloat((amountAfterDiscount + totalTaxAmount).toFixed(2));

  return {
    items: calculatedItems,
    subTotalAmount,
    discountAmount,
    amountAfterDiscount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    jobCgstAmount,
    jobSgstAmount,
    totalTaxAmount,
    totalAmount
  };
};

// @desc    Get available challans for a company
// @route   GET /api/bills/challans/:companyId
// @access  Private/Admin
const getAvailableChallans = async (req, res) => {
  const { companyId } = req.params;
  try {
    const usedChallans = await Bill.find({ company: companyId, challan: { $ne: null } }).distinct('challan');
    const availableChallans = await Challan.find({
      company: companyId,
      _id: { $nin: usedChallans },
    }).select('challanNumber challanDate descriptionOfGoods totalNetWeight totalCops');

    log(`Fetched available challans for company ID ${companyId} by ${req.user.email}`, 'info');
    res.json(availableChallans);
  } catch (error) {
    log(`Error fetching available challans: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching available challans.' });
  }
};

// @desc    Create a new bill
// @route   POST /api/bills
// @access  Private/Admin
const createBill = async (req, res) => {
  const {
    billNumber,
    billDate,
    companyId,
    challanId,
    challanNumber,
    items,
    rate,
    discountPercentage = 0,
    taxType,
    overrideCgstPercentage,
    overrideSgstPercentage,
    overrideIgstPercentage,
    overrideJobCgstPercentage,
    overrideJobSgstPercentage,
    status,
    amountInWords,
  } = req.body;

  if (!billNumber || !companyId || (!challanId && (!items || items.length === 0)) || !taxType) {
    return res.status(400).json({ message: 'Missing required fields: billNumber, companyId, items (unless challanId is provided), taxType.' });
  }

  if (!['CGST_SGST', 'IGST', 'JOBCGST_JOBSGST'].includes(taxType)) {
    return res.status(400).json({ message: 'Invalid tax type' });
  }

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      log(`Bill creation failed: Company not found - ID: ${companyId}`, 'warn');
      return res.status(404).json({ message: 'Company not found.' });
    }

    let challan = null;
    let finalChallanNumber = challanNumber || '';
    let finalItems = items || [];

    if (challanId) {
      challan = await Challan.findById(challanId);
      if (!challan) {
        return res.status(404).json({ message: 'Challan not found.' });
      }
      if (challan.company.toString() !== companyId) {
        return res.status(400).json({ message: 'Challan does not belong to the selected company.' });
      }
      if (challan.isUsed) {
        return res.status(400).json({ message: `Challan ${challan.challanNumber} is already used in another bill.` });
      }
      finalChallanNumber = challan.challanNumber;
      const settings = await Settings.getSettings();
      const itemConfig = settings.itemConfigurations.find(item => item.description === challan.descriptionOfGoods);
      if (!itemConfig) {
        return res.status(400).json({ message: 'No item configuration found for the challan’s description of goods.' });
      }
      const itemRate = rate !== undefined ? rate : itemConfig.defaultRate || 0;
      finalItems = [{
        description: challan.descriptionOfGoods,
        hsnSacCode: itemConfig.hsnSacCode || '',
        quantity: challan.totalNetWeight,
        rate: itemRate,
        amount: Math.round(challan.totalNetWeight * itemRate),
      }];
    }

    if (finalItems.length === 0) {
      return res.status(400).json({ message: 'Items array cannot be empty.' });
    }

    const companyDetailsSnapshot = {
      name: company.name,
      address: company.address,
      gstNumber: company.gstNumber,
    };

    const settings = await Settings.getSettings();
    const cgstRate = overrideCgstPercentage !== undefined ? overrideCgstPercentage : settings.cgstPercentage;
    const sgstRate = overrideSgstPercentage !== undefined ? overrideSgstPercentage : settings.sgstPercentage;
    const igstRate = overrideIgstPercentage !== undefined ? overrideIgstPercentage : settings.igstPercentage;
    const jobCgstRate = overrideJobCgstPercentage !== undefined ? overrideJobCgstPercentage : settings.jobCgstPercentage;
    const jobSgstRate = overrideJobSgstPercentage !== undefined ? overrideJobSgstPercentage : settings.jobSgstPercentage;

    const calculated = calculateBillTotals(finalItems, discountPercentage, taxType, cgstRate, sgstRate, igstRate, jobCgstRate, jobSgstRate);

    const newBill = new Bill({
      billNumber,
      billDate: billDate ? new Date(billDate) : new Date(),
      challan: challanId || null,
      challanNumber: finalChallanNumber,
      company: companyId,
      companyDetailsSnapshot,
      items: calculated.items,
      subTotalAmount: calculated.subTotalAmount,
      discountPercentage,
      discountAmount: calculated.discountAmount,
      amountAfterDiscount: calculated.amountAfterDiscount,
      taxType,
      cgstPercentage: taxType === 'CGST_SGST' ? cgstRate : 0,
      cgstAmount: calculated.cgstAmount,
      sgstPercentage: taxType === 'CGST_SGST' ? sgstRate : 0,
      sgstAmount: calculated.sgstAmount,
      igstPercentage: taxType === 'IGST' ? igstRate : 0,
      igstAmount: calculated.igstAmount,
      jobCgstPercentage: taxType === 'JOBCGST_JOBSGST' ? jobCgstRate : 0,
      jobCgstAmount: calculated.jobCgstAmount,
      jobSgstPercentage: taxType === 'JOBCGST_JOBSGST' ? jobSgstRate : 0,
      jobSgstAmount: calculated.jobSgstAmount,
      totalTaxAmount: calculated.totalTaxAmount,
      totalAmount: calculated.totalAmount,
      amountInWords: amountInWords || amountToWords(calculated.totalAmount) || '',
      status: status || 'Pending',
      createdBy: req.user._id,
    });

    const savedBill = await newBill.save();

    if (challanId) {
      await Challan.findByIdAndUpdate(
        challanId,
        { isUsed: true, bill: savedBill._id },
        { new: true }
      );
      log(`Challan ${challan.challanNumber} marked as used and linked to bill ${savedBill.billNumber}`, 'info');
    }

    log(`Bill created successfully: ${savedBill.billNumber} by ${req.user.email}`, 'info');
    res.status(201).json(savedBill);
  } catch (error) {
    log(`Error creating bill: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      return res.status(400).json({ message: `Bill number '${billNumber}' already exists.` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating bill.' });
  }
};

// @desc    Update bill
// @route   PUT /api/bills/:id
const updateBill = async (req, res) => {
  const billId = req.params.id;
  const {
    billNumber,
    billDate,
    companyId,
    challanId,
    challanNumber,
    items,
    discountPercentage,
    taxType,
    overrideCgstPercentage,
    overrideSgstPercentage,
    overrideIgstPercentage,
    overrideJobCgstPercentage,
    overrideJobSgstPercentage,
    status,
    amountInWords,
    paymentRecords,
    rate // For challan mode
  } = req.body;

  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      log(`Bill update failed: Not found with ID: ${billId}`, 'warn');
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Handle challan updates
    if (challanId !== undefined && challanId !== bill.challan?.toString()) {
      if (bill.challan) {
        await Challan.findByIdAndUpdate(
          bill.challan,
          { isUsed: false, bill: null },
          { new: true }
        );
        log(`Previous challan ${bill.challan} reset for bill ${bill.billNumber}`, 'info');
      }
    }

    let needsRecalculation = false;

    // Update bill fields only if provided
    if (billNumber !== undefined && bill.billNumber !== billNumber) {
      const existingBillWithNewNumber = await Bill.findOne({ billNumber });
      if (existingBillWithNewNumber && existingBillWithNewNumber._id.toString() !== billId) {
        return res.status(400).json({ message: `Bill number '${billNumber}' already exists.` });
      }
      bill.billNumber = billNumber;
    }
    if (billDate !== undefined) bill.billDate = new Date(billDate);
    if (status !== undefined) bill.status = status;
    if (amountInWords !== undefined) bill.amountInWords = amountInWords;

    // Handle company updates
    if (companyId !== undefined && bill.company.toString() !== companyId) {
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'New company not found.' });
      }
      bill.company = companyId;
      bill.companyDetailsSnapshot = {
        name: company.name,
        address: company.address,
        gstNumber: company.gstNumber,
      };
    }

    // Handle challan or manual items
    if (challanId !== undefined || challanNumber !== undefined || rate !== undefined) {
      if (challanId) {
        const challan = await Challan.findById(challanId);
        if (!challan) {
          return res.status(404).json({ message: 'Challan not found.' });
        }
        if (challan.company.toString() !== (companyId || bill.company.toString())) {
          return res.status(400).json({ message: 'Challan does not belong to the selected company.' });
        }
        if (challan.isUsed && challan.bill?.toString() !== billId) {
          return res.status(400).json({ message: `Challan ${challan.challanNumber} is already used in another bill.` });
        }
        bill.challan = challanId;
        bill.challanNumber = challan.challanNumber;
        const settings = await Settings.getSettings();
        const itemConfig = settings.itemConfigurations.find(item => item.description === challan.descriptionOfGoods);
        const itemRate = parseFloat(rate) || itemConfig?.defaultRate || 0;
        bill.items = [{
          description: challan.descriptionOfGoods,
          hsnSacCode: itemConfig?.hsnSacCode || '',
          quantity: challan.totalNetWeight,
          rate: itemRate,
          amount: parseFloat((challan.totalNetWeight * itemRate).toFixed(2))
        }];
        await Challan.findByIdAndUpdate(
          challanId,
          { isUsed: true, bill: billId },
          { new: true }
        );
        log(`Challan ${challan.challanNumber} marked as used for bill ${bill.billNumber}`, 'info');
        needsRecalculation = true;
      } else {
        bill.challan = null;
        bill.challanNumber = challanNumber || '';
        if (items !== undefined) {
          bill.items = items;
          needsRecalculation = true;
        }
      }
    } else if (items !== undefined) {
      bill.items = items;
      needsRecalculation = true;
    }

    // Handle payment records
    if (paymentRecords !== undefined) {
      if (!Array.isArray(paymentRecords)) {
        return res.status(400).json({ message: 'paymentRecords must be an array.' });
      }
      bill.paymentRecords = paymentRecords;
    }

    // Recalculate totals if needed
    if (
      needsRecalculation ||
      discountPercentage !== undefined ||
      taxType !== undefined ||
      overrideCgstPercentage !== undefined ||
      overrideSgstPercentage !== undefined ||
      overrideIgstPercentage !== undefined ||
      overrideJobCgstPercentage !== undefined ||
      overrideJobSgstPercentage !== undefined
    ) {
      const settings = await Settings.getSettings();
      const currentItems = bill.items; // Use updated items
      const currentDiscountPercentage = discountPercentage !== undefined ? parseFloat(discountPercentage) : bill.discountPercentage;
      const currentTaxType = taxType !== undefined ? taxType : bill.taxType;
      const cgstRate = overrideCgstPercentage !== undefined ? parseFloat(overrideCgstPercentage) : bill.cgstPercentage || settings.cgstPercentage;
      const sgstRate = overrideSgstPercentage !== undefined ? parseFloat(overrideSgstPercentage) : bill.sgstPercentage || settings.sgstPercentage;
      const igstRate = overrideIgstPercentage !== undefined ? parseFloat(overrideIgstPercentage) : bill.igstPercentage || settings.igstPercentage;
      const jobCgstRate = overrideJobCgstPercentage !== undefined ? parseFloat(overrideJobCgstPercentage) : bill.jobCgstPercentage || settings.jobCgstPercentage;
      const jobSgstRate = overrideJobSgstPercentage !== undefined ? parseFloat(overrideJobSgstPercentage) : bill.jobSgstPercentage || settings.jobSgstPercentage;

      const calculated = calculateBillTotals(
        currentItems,
        currentDiscountPercentage,
        currentTaxType,
        cgstRate,
        sgstRate,
        igstRate,
        jobCgstRate,
        jobSgstRate
      );

      bill.items = calculated.items;
      bill.subTotalAmount = calculated.subTotalAmount;
      bill.discountPercentage = currentDiscountPercentage;
      bill.discountAmount = calculated.discountAmount;
      bill.amountAfterDiscount = calculated.amountAfterDiscount;
      bill.taxType = currentTaxType;
      bill.cgstPercentage = currentTaxType === 'CGST_SGST' ? cgstRate : 0;
      bill.cgstAmount = calculated.cgstAmount;
      bill.sgstPercentage = currentTaxType === 'CGST_SGST' ? sgstRate : 0;
      bill.sgstAmount = calculated.sgstAmount;
      bill.igstPercentage = currentTaxType === 'IGST' ? igstRate : 0;
      bill.igstAmount = calculated.igstAmount;
      bill.jobCgstPercentage = currentTaxType === 'JOBCGST_JOBSGST' ? jobCgstRate : 0;
      bill.jobCgstAmount = calculated.jobCgstAmount;
      bill.jobSgstPercentage = currentTaxType === 'JOBCGST_JOBSGST' ? jobSgstRate : 0;
      bill.jobSgstAmount = calculated.jobSgstAmount;
      bill.totalTaxAmount = calculated.totalTaxAmount;
      bill.totalAmount = calculated.totalAmount;
      if (amountInWords === undefined) {
        bill.amountInWords = amountToWords(calculated.totalAmount) || '';
      }
    }

    const updatedBill = await bill.save();
    log(`Bill updated: ${updatedBill.billNumber} by ${req.user.email}`, 'info');
    res.json(updatedBill);
  } catch (error) {
    log(`Error updating bill ID ${billId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      return res.status(400).json({ message: `Bill number '${req.body.billNumber}' already exists.` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating bill.' });
  }
};

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private/Admin
const getBills = async (req, res) => {
  const { companyId, startDate, endDate, status } = req.query;
  const query = {};

  if (companyId) query.company = companyId;
  if (status) query.status = status;

  if (startDate && endDate) {
    query.billDate = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  } else if (startDate) {
    query.billDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.billDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  try {
    const bills = await Bill.find(query)
      .populate('company', 'name gstNumber')
      .populate('createdBy', 'username email')
      .populate('challan', 'challanNumber descriptionOfGoods totalNetWeight totalCops')
      .sort({ billDate: -1, createdAt: -1 });

    log(`Fetched bills with query ${JSON.stringify(query)} by ${req.user.email}`, 'info');
    res.json(bills);
  } catch (error) {
    log(`Error fetching bills: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching bills.' });
  }
};

// @desc    Get a bill by ID
// @route   GET /api/bills/:id
// @access  Private/Admin
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('company', 'name address gstNumber mobileNumber')
      .populate('createdBy', 'username email')
      .populate('challan', 'challanNumber descriptionOfGoods totalNetWeight totalCops');

    if (!bill) {
      log(`Bill not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Bill not found' });
    }
    log(`Fetched bill by ID: ${bill.billNumber} by ${req.user.email}`, 'info');
    res.json(bill);
  } catch (error) {
    log(`Error fetching bill ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching bill.' });
  }
};

// @desc    Delete a bill
// @route   DELETE /api/bills/:id
// @access  Private/Admin
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      log(`Bill deletion failed: Not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.challan) {
      await Challan.findByIdAndUpdate(
        bill.challan,
        { isUsed: false, bill: null },
        { new: true }
      );
      log(`Challan ${bill.challan} reset due to deletion of bill ${bill.billNumber}`, 'info');
    }

    await bill.deleteOne();
    log(`Bill deleted: ${bill.billNumber} by ${req.user.email}`, 'info');
    res.json({ message: 'Bill removed successfully.' });
  } catch (error) {
    log(`Error deleting bill ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while deleting bill.' });
  }
};

// @desc    Generate Excel for a bill
// @route   GET /api/bills/:id/excel
// @access  Private/Admin
const generateBillExcel = async (req, res) => {
  const billId = req.params.id;
  const excelTemplatePath = process.env.EXCEL_TEMPLATE_PATH;

  if (!excelTemplatePath) {
    log('Excel generation failed: EXCEL_TEMPLATE_PATH not set in .env', 'error');
    return res.status(500).json({ message: 'Excel template path not configured.' });
  }

  try {
    const bill = await Bill.findById(billId).populate('company');
    if (!bill) {
      log(`Excel generation failed: Bill not found - ID: ${billId}`, 'warn');
      return res.status(404).json({ message: 'Bill not found.' });
    }

    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(excelTemplatePath);
    const worksheet = workbook.getWorksheet(1);

    worksheet.getCell('C7').value = bill.companyDetailsSnapshot.name || bill.company.name;
    worksheet.getCell('C9').value = bill.companyDetailsSnapshot.address || bill.company.address;
    worksheet.getCell('D12').value = bill.companyDetailsSnapshot.gstNumber || bill.company.gstNumber;
    worksheet.getCell('H7').value = new Date(bill.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    worksheet.getCell('H8').value = bill.billNumber;
    worksheet.getCell('H9').value = bill.challanNumber || '';

    let currentRow = 15;
    bill.items.forEach((item, index) => {
      worksheet.getCell(`A${currentRow}`).value = index + 1;
      worksheet.getCell(`B${currentRow}`).value = item.description;
      worksheet.getCell(`E${currentRow}`).value = item.hsnSacCode;
      worksheet.getCell(`F${currentRow}`).value = item.quantity;
      worksheet.getCell(`G${currentRow}`).value = item.rate;
      worksheet.getCell(`H${currentRow}`).value = item.amount;
      currentRow++;
    });

    worksheet.getCell('G19').value = bill.discountPercentage > 0 ? `DISCOUNT(${bill.discountPercentage}%)` : '';
    worksheet.getCell('H19').value = bill.discountAmount > 0 ? bill.discountAmount : '';
    worksheet.getCell('H20').value = bill.amountAfterDiscount;

    if (bill.taxType === 'CGST_SGST') {
      worksheet.getCell('G21').value = 'SGST';
      worksheet.getCell('H21').value = bill.sgstPercentage;
      worksheet.getCell('I21').value = bill.sgstAmount;
      worksheet.getCell('G22').value = 'CGST';
      worksheet.getCell('H22').value = bill.cgstPercentage;
      worksheet.getCell('I22').value = bill.cgstAmount;
      worksheet.getCell('G20').value = '';
      worksheet.getCell('H20').value = '';
      worksheet.getCell('I20').value = '';
    } else if (bill.taxType === 'IGST') {
      worksheet.getCell('G20').value = 'IGST';
      worksheet.getCell('H20').value = bill.igstPercentage;
      worksheet.getCell('I20').value = bill.igstAmount;
      worksheet.getCell('G21').value = '';
      worksheet.getCell('H21').value = '';
      worksheet.getCell('I21').value = '';
      worksheet.getCell('G22').value = '';
      worksheet.getCell('H22').value = '';
      worksheet.getCell('I22').value = '';
    } else if (bill.taxType === 'JOBCGST_JOBSGST') {
      worksheet.getCell('G21').value = 'JOBSGST';
      worksheet.getCell('H21').value = bill.jobSgstPercentage;
      worksheet.getCell('I21').value = bill.jobSgstAmount;
      worksheet.getCell('G22').value = 'JOBCGST';
      worksheet.getCell('H22').value = bill.jobCgstPercentage;
      worksheet.getCell('I22').value = bill.jobCgstAmount;
      worksheet.getCell('G20').value = '';
      worksheet.getCell('H20').value = '';
      worksheet.getCell('I20').value = '';
    }

    worksheet.getCell('I23').value = bill.totalAmount;

    const outputDir = path.join(__dirname, '..', 'generated_bills', 'excel');
    await fsPromises.mkdir(outputDir, { recursive: true });
    const excelFileName = `Bill-${bill.billNumber.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    const excelFilePath = path.join(outputDir, excelFileName);

    await workbook.xlsx.writeFile(excelFilePath);

    bill.excelFilePath = excelFilePath;
    await bill.save();

    log(`Excel generated for bill ${bill.billNumber}: ${excelFilePath}`, 'info');

    res.download(excelFilePath, excelFileName, (err) => {
      if (err) {
        log(`Error sending Excel file for bill ${bill.billNumber}: ${err.message}`, 'error');
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to download Excel file.' });
        }
      } else {
        log(`Excel file downloaded for bill ${bill.billNumber}`, 'info');
      }
    });
  } catch (error) {
    log(`Error generating Excel for bill ID ${billId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error while generating Excel bill.' });
    }
  }
};

// @desc    Generate PDF for a bill
// @route   GET /api/bills/:id/pdf
// @access  Private/Admin
const generateBillPdf = async (req, res) => {
  const billId = req.params.id;
  try {
    const bill = await Bill.findById(billId)
      .populate('company')
      .populate('challan', 'challanNumber descriptionOfGoods totalNetWeight totalCops');
    if (!bill) {
      log(`PDF generation failed: Bill not found - ID: ${billId}`, 'warn');
      return res.status(404).json({ message: 'Bill not found.' });
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 40;
    const lineSpacing = 18;
    const smallLineSpacing = 12;
    const itemLineSpacing = 16;
    const leftMargin = 40;
    const rightMargin = width - 40;
    const contentWidth = rightMargin - leftMargin;

    const drawTextAndMeasureHeight = (textToDraw, xPos, currentY, options = {}) => {
      const textToProcess = String(textToDraw ?? '').replace(/₹/g, 'INR ');
      const FONT_TO_USE = options.font || font;
      const SIZE = options.size || 10;
      const COLOR = options.color || rgb(0, 0, 0);
      const LINE_HEIGHT = options.lineHeight || SIZE * 1.3;
      const MAX_WIDTH = options.maxWidth;
      const SPACING_AFTER = options.spacingAfter !== undefined ? options.spacingAfter : 3;
      const ALIGN = options.align || 'left';

      let actualXPos = xPos;
      if (ALIGN === 'center' && MAX_WIDTH) {
        const textWidth = FONT_TO_USE.widthOfTextAtSize(textToProcess, SIZE);
        actualXPos = xPos + (MAX_WIDTH - textWidth) / 2;
      } else if (ALIGN === 'center') {
        const textWidth = FONT_TO_USE.widthOfTextAtSize(textToProcess, SIZE);
        actualXPos = leftMargin + (contentWidth - textWidth) / 2;
      }

      page.drawText(textToProcess, {
        x: actualXPos,
        y: currentY,
        font: FONT_TO_USE,
        size: SIZE,
        color: COLOR,
        lineHeight: LINE_HEIGHT,
        maxWidth: MAX_WIDTH,
        wordBreaks: [' ', '-', '/'],
      });

      let numLines = 1;
      if (MAX_WIDTH && FONT_TO_USE.widthOfTextAtSize(textToProcess.replace(/\n/g, ' '), SIZE) > MAX_WIDTH) {
        const segments = textToProcess.split('\n');
        numLines = 0;
        segments.forEach(segment => {
          if (segment.trim() === '') {
            numLines++;
            return;
          }
          let currentLineForEstimation = '';
          let linesForSegment = 1;
          const words = segment.split(' ');
          for (const word of words) {
            const testLineWithWord = currentLineForEstimation ? `${currentLineForEstimation} ${word}` : word;
            if (FONT_TO_USE.widthOfTextAtSize(testLineWithWord, SIZE) > MAX_WIDTH) {
              linesForSegment++;
              currentLineForEstimation = word;
            } else {
              currentLineForEstimation = testLineWithWord;
            }
          }
          numLines += linesForSegment;
        });
        if (textToProcess.endsWith('\n') && segments[segments.length - 1].trim() !== '') numLines++;
        if (numLines === 0 && textToProcess.trim() !== '') numLines = 1;
      } else {
        numLines = textToProcess.split('\n').length;
        if (numLines === 0 && textToProcess.trim() !== '') numLines = 1;
      }

      const textHeight = textToProcess.trim() === '' ? 0 : numLines * LINE_HEIGHT;
      return textHeight + SPACING_AFTER;
    };

    let currentY = y;

    const topHeaderTextY = currentY;
    const shreeGaneshText = 'SHREE GANESHAY NAMAH';
    const shreeGaneshFontSize = 10;
    const shreeGaneshOptions = { font: boldFont, size: shreeGaneshFontSize, align: 'center', color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
    const shreeGaneshHeight = drawTextAndMeasureHeight(shreeGaneshText, leftMargin, topHeaderTextY, shreeGaneshOptions);

    const taxInvoiceText = 'TAX INVOICE';
    const taxInvoiceFontSize = 14;
    const taxInvoiceWidth = boldFont.widthOfTextAtSize(taxInvoiceText, taxInvoiceFontSize);
    const taxInvoiceOptions = { font: boldFont, size: taxInvoiceFontSize, color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
    const taxInvoiceHeight = drawTextAndMeasureHeight(taxInvoiceText, rightMargin - taxInvoiceWidth, topHeaderTextY, taxInvoiceOptions);

    currentY -= Math.max(shreeGaneshHeight, taxInvoiceHeight) + 18;

    const companyNameText = 'MAHADEV FILAMENTS';
    const companyNameFontSize = 25;
    currentY -= drawTextAndMeasureHeight(companyNameText, leftMargin, currentY, { font: boldFont, size: companyNameFontSize, align: 'center', color: rgb(0.1, 0.3, 0.5) });

    const addressText = 'BLOCK NO - 15, 1ST FLOOR, AMBIKA VIBHAG - 2, NEAR NAVJIVAN CIRCLE, U.M. ROAD, SURAT - 395007';
    const addressFontSize = 9;
    currentY -= drawTextAndMeasureHeight(addressText, leftMargin, currentY + 14, { size: addressFontSize, align: 'center', maxWidth: contentWidth, spacingAfter: 4 });

    const gstinText = 'GSTIN: 24AABEFM9966E1ZZ';
    const gstinFontSize = 10;
    currentY -= drawTextAndMeasureHeight(gstinText, leftMargin, currentY + 14, { size: gstinFontSize, align: 'center', spacingAfter: 15 });

    y = currentY;

    const clientName = bill.companyDetailsSnapshot?.name || bill.company?.name || 'N/A';
    const clientAddress = bill.companyDetailsSnapshot?.address || bill.company?.address || 'N/A';
    const clientGstin = bill.companyDetailsSnapshot?.gstNumber || bill.company?.gstNumber || 'N/A';
    const broker = bill.challan ? bill.challan.broker || 'direct' : 'direct';

    let yLeft = y;
    let yRight = y;

    const consigneeMaxWidth = contentWidth / 2 - 20;
    const billDetailsColumnWidth = 180;
    const billDetailsX = rightMargin - billDetailsColumnWidth;
    const billDetailsMaxWidth = billDetailsColumnWidth - 10;

    page.drawRectangle({
      x: leftMargin,
      y: yLeft - 84,
      width: consigneeMaxWidth + 20,
      height: 100,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.5,
    });

    page.drawRectangle({
      x: billDetailsX - 5,
      y: yRight - 64,
      width: billDetailsColumnWidth,
      height: 80,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.5,
    });

    yLeft -= drawTextAndMeasureHeight(`Consignee:`, leftMargin + 5, yLeft, { font: boldFont, size: 11, spacingAfter: 4 });
    yLeft -= drawTextAndMeasureHeight(clientName, leftMargin + 5, yLeft, { font: boldFont, size: 10, spacingAfter: 4, maxWidth: consigneeMaxWidth });
    yLeft -= drawTextAndMeasureHeight(clientAddress, leftMargin + 5, yLeft, { size: 9, spacingAfter: 4, maxWidth: consigneeMaxWidth });
    yLeft -= drawTextAndMeasureHeight(`GSTIN: ${clientGstin}`, leftMargin + 5, yLeft, { font: boldFont, size: 9, spacingAfter: 4, maxWidth: consigneeMaxWidth });

    yRight -= drawTextAndMeasureHeight(`Date: ${new Date(bill.billDate).toLocaleDateString('en-IN')}`, billDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: billDetailsMaxWidth });
    yRight -= drawTextAndMeasureHeight(`Invoice No.: ${bill.billNumber || 'N/A'}`, billDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: billDetailsMaxWidth });
    yRight -= drawTextAndMeasureHeight(`Challan No.: ${bill.challanNumber || bill.challan?.challanNumber || 'N/A'}`, billDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: billDetailsMaxWidth });
    yRight -= drawTextAndMeasureHeight(`Broker: ${broker}`, billDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: billDetailsMaxWidth });

    y = Math.min(yLeft, yRight) - lineSpacing;

    page.drawRectangle({
      x: leftMargin,
      y: y - 22,
      width: contentWidth,
      height: 20,
      color: rgb(0.1, 0.3, 0.5),
      opacity: 0.1,
    });
    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= smallLineSpacing;

    const colPositions = {
      srNo: leftMargin + 10,
      desc: leftMargin + 50,
      hsn: leftMargin + 260,
      qty: leftMargin + 340,
      rate: leftMargin + 410,
      amount: rightMargin - 80,
    };
    const headerOptions = { font: boldFont, size: 10, spacingAfter: 0, color: rgb(0.1, 0.1, 0.1) };
    drawTextAndMeasureHeight('Sr No.', colPositions.srNo, y, headerOptions);
    drawTextAndMeasureHeight('Description of Goods', colPositions.desc, y, { ...headerOptions, maxWidth: colPositions.hsn - colPositions.desc - 15 });
    drawTextAndMeasureHeight('HSN/SAC', colPositions.hsn, y, headerOptions);
    drawTextAndMeasureHeight('Quantity', colPositions.qty, y, headerOptions);
    drawTextAndMeasureHeight('Rate/Kgs', colPositions.rate, y, headerOptions);
    const amountHeaderText = 'Amount';
    const amountHeaderWidth = boldFont.widthOfTextAtSize(amountHeaderText, 10);
    drawTextAndMeasureHeight(amountHeaderText, rightMargin - amountHeaderWidth - 10, y, headerOptions);

    y -= smallLineSpacing;
    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= itemLineSpacing;

    const pageBreakThreshold = 100;
    bill.items.forEach((item, index) => {
      if (y < pageBreakThreshold) {
        page = pdfDoc.addPage([595, 842]);
        y = height - 40;
      }

      const itemRowOptions = { size: 9, spacingAfter: 0 };
      let maxHeightThisRow = 0;

      if (index % 2 === 0) {
        page.drawRectangle({
          x: leftMargin,
          y: y - 5,
          width: contentWidth,
          height: 16,
          color: rgb(0.98, 0.98, 0.98),
          opacity: 0.5,
        });
      }

      maxHeightThisRow = Math.max(maxHeightThisRow, drawTextAndMeasureHeight(String(index + 1), colPositions.srNo, y, itemRowOptions));
      maxHeightThisRow = Math.max(maxHeightThisRow, drawTextAndMeasureHeight(item.description, colPositions.desc, y, { ...itemRowOptions, maxWidth: colPositions.hsn - colPositions.desc - 15 }));
      maxHeightThisRow = Math.max(maxHeightThisRow, drawTextAndMeasureHeight(item.hsnSacCode, colPositions.hsn, y, { ...itemRowOptions, maxWidth: colPositions.qty - colPositions.hsn - 10 }));
      maxHeightThisRow = Math.max(maxHeightThisRow, drawTextAndMeasureHeight(String(item.quantity.toFixed(2)), colPositions.qty, y, { ...itemRowOptions, maxWidth: colPositions.rate - colPositions.qty - 10 }));
      maxHeightThisRow = Math.max(maxHeightThisRow, drawTextAndMeasureHeight(String(Math.round(item.rate || 0)), colPositions.rate, y, { ...itemRowOptions, maxWidth: colPositions.amount - colPositions.rate - 10 }));
      const amountStr = String(Math.round(item.amount || 0));
      const amountCellWidth = font.widthOfTextAtSize(amountStr, itemRowOptions.size);
      maxHeightThisRow = Math.max(maxHeightThisRow, drawTextAndMeasureHeight(amountStr, rightMargin - amountCellWidth - 10, y, itemRowOptions));

      y -= maxHeightThisRow + itemLineSpacing / 2;
    });

    const minItemRows = 7;
    if (bill.items.length < minItemRows) {
      for (let i = bill.items.length; i < minItemRows; i++) {
        y -= itemLineSpacing;
      }
    }

    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1.5, color: rgb(0.2, 0.2, 0.2) });
    y -= smallLineSpacing + 1;

    const totalsLabelX = rightMargin - 230;
    const totalsValueX = rightMargin - 100;

    const drawTotalLine = (label, valueStr, isBold = false) => {
      const commonOpt = { size: 10, font: isBold ? boldFont : font, spacingAfter: 2 };
      const labelMaxWidth = totalsValueX - totalsLabelX - 15;
      const valueMaxWidth = rightMargin - totalsValueX - 10;

      const hLabel = drawTextAndMeasureHeight(label, totalsLabelX, y, { ...commonOpt, maxWidth: labelMaxWidth });
      const valWidth = (isBold ? boldFont : font).widthOfTextAtSize(valueStr, commonOpt.size);
      const valXPos = rightMargin - valWidth - 10;
      const hValue = drawTextAndMeasureHeight(valueStr, valXPos, y, { ...commonOpt, maxWidth: valueMaxWidth });

      y -= Math.max(hLabel, hValue) + smallLineSpacing - commonOpt.spacingAfter;
    };

    page.drawRectangle({
      x: totalsLabelX - 10,
      y: y - 114,
      width: rightMargin - totalsLabelX + 15,
      height: 124,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.5,
    });

    drawTotalLine('Subtotal', String(Math.round(bill.subTotalAmount || 0)));
    if (bill.discountAmount > 0) {
      drawTotalLine(`Discount (${bill.discountPercentage}%):`, `- ${String(Math.round(bill.discountAmount || 0))}`);
    }
    drawTotalLine('Amount After Discount:', String(Math.round(bill.amountAfterDiscount || 0)), true);

    if (bill.taxType === 'CGST_SGST') {
      drawTotalLine(`SGST (${bill.sgstPercentage}%):`, `+ ${String(Math.round(bill.sgstAmount || 0))}`);
      drawTotalLine(`CGST (${bill.cgstPercentage}%):`, `+ ${String(Math.round(bill.cgstAmount || 0))}`);
    } else if (bill.taxType === 'IGST') {
      drawTotalLine(`IGST (${bill.igstPercentage}%):`, `+ ${String(Math.round(bill.igstAmount || 0))}`);
    } else if (bill.taxType === 'JOBCGST_JOBSGST') {
      drawTotalLine(`SGST (${bill.jobSgstPercentage}%):`, `+ ${String(Math.round(bill.jobSgstAmount || 0))}`);
      drawTotalLine(`CGST (${bill.jobCgstPercentage}%):`, `+ ${String(Math.round(bill.jobCgstAmount || 0))}`);
    }

    y -= 5;
    page.drawLine({ start: { x: totalsLabelX - 10, y: y + smallLineSpacing / 2 }, end: { x: rightMargin, y: y + smallLineSpacing / 2 }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= 3;

    drawTotalLine('Total Amount', String(Math.round(bill.totalAmount || 0)), true);

    const currentTotalAmountInWords = amountToWords(bill.totalAmount || 0);
    if (currentTotalAmountInWords && currentTotalAmountInWords !== 'Zero Rupees Only' && bill.totalAmount !== 0) {
      const amountInWordsText = `Amount in Words: ${currentTotalAmountInWords}`;
      y -= drawTextAndMeasureHeight(amountInWordsText, leftMargin, y, {
        font: boldFont,
        size: 10,
        spacingAfter: 8,
        maxWidth: contentWidth,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else if (bill.totalAmount === 0) {
      const amountInWordsText = `Amount in Words: Zero Rupees Only`;
      y -= drawTextAndMeasureHeight(amountInWordsText, leftMargin, y, {
        font: boldFont,
        size: 10,
        spacingAfter: 8,
        maxWidth: contentWidth,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
    y -= 2;

    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= smallLineSpacing;

    let bankDetailsY = y;
    const bankDetailsMaxWidth = contentWidth * 0.5;
    bankDetailsY -= drawTextAndMeasureHeight('Bank Details:', leftMargin, bankDetailsY, { font: boldFont, size: 12, spacingAfter: 4 });
    bankDetailsY -= drawTextAndMeasureHeight('Bank Name: Prime Bank of India', leftMargin, bankDetailsY, { size: 10, spacingAfter: 3, maxWidth: bankDetailsMaxWidth });
    bankDetailsY -= drawTextAndMeasureHeight('Account Name: Mahadev Filaments', leftMargin, bankDetailsY, { size: 10, spacingAfter: 3, maxWidth: bankDetailsMaxWidth });
    bankDetailsY -= drawTextAndMeasureHeight('Account No.: 10062001003372', leftMargin, bankDetailsY, { size: 10, spacingAfter: 3, maxWidth: bankDetailsMaxWidth });
    bankDetailsY -= drawTextAndMeasureHeight('IFSC Code: PMEC0100607', leftMargin, bankDetailsY, { size: 10, spacingAfter: 10, maxWidth: bankDetailsMaxWidth });

    let declarationTitleY = bankDetailsY;
    const forCompanyText = 'For MAHADEV FILAMENTS';
    const forCompanyFontSize = 11;
    const forCompanyOptions = { font: boldFont, size: forCompanyFontSize, spacingAfter: 3, align: 'right' };
    const forCompanyWidth = boldFont.widthOfTextAtSize(forCompanyText, forCompanyFontSize);

    const declarationTitleHeight = drawTextAndMeasureHeight('Declaration:', leftMargin, declarationTitleY, { font: boldFont, size: 12, spacingAfter: 4 });
    drawTextAndMeasureHeight(forCompanyText, rightMargin - forCompanyWidth, declarationTitleY, forCompanyOptions);
    bankDetailsY -= declarationTitleHeight;

    const declarationText = [
      '1. Interest @ 2% will be charged on bills if not paid within 20 days.',
      '2. All payments must be made by payee\'s A/C Cheque/Draft.',
      '3. No claims will be entertained unless notified in writing within three days from the date of this bill.',
      'Subject to Surat jurisdiction.',
    ];

    let lastDeclarationLineY = bankDetailsY;

    declarationText.forEach((line, index) => {
      const currentLineHeight = drawTextAndMeasureHeight(line, leftMargin, bankDetailsY, { size: 9, spacingAfter: 3, maxWidth: contentWidth * 0.6 });
      bankDetailsY -= currentLineHeight;
      if (index === declarationText.length - 1) {
        lastDeclarationLineY = bankDetailsY + currentLineHeight - 3;
      }
    });

    const authSignText = 'Authorised Signatory';
    const authSignFontSize = 9;
    const authSignOptions = { font: font, size: authSignFontSize, spacingAfter: 0, align: 'right' };
    const authSignWidth = font.widthOfTextAtSize(authSignText, authSignFontSize);
    drawTextAndMeasureHeight(authSignText, rightMargin - authSignWidth, lastDeclarationLineY, authSignOptions);

    const forCompanyHeight = boldFont.heightAtSize(forCompanyFontSize) + 3;
    const signatureSpaceY = declarationTitleY - forCompanyHeight - 30;
    y = Math.min(bankDetailsY, signatureSpaceY) - lineSpacing;

    const bottomMarginForContact = 30;
    y = bottomMarginForContact;
    page.drawRectangle({
      x: leftMargin,
      y: y - 8,
      width: contentWidth,
      height: 20,
      color: rgb(0.1, 0.3, 0.5),
      opacity: 0.1,
    });
    const contactText = 'Contact: Bharat Radiya | Phone: 9825492079 | Email: mahadevfilaments@gmail.com';
    const contactTextWidth = font.widthOfTextAtSize(contactText, 9);
    drawTextAndMeasureHeight(contactText, leftMargin + (contentWidth - contactTextWidth) / 2, y, { size: 9, spacingAfter: 0, color: rgb(0.3, 0.3, 0.3) });

    const pdfBytes = await pdfDoc.save();
    const outputDir = path.join(__dirname, '..', 'generated_bills', 'pdf');
    await fsPromises.mkdir(outputDir, { recursive: true });

    const pdfFileName = `Bill-${bill.billNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const pdfFilePath = path.join(outputDir, pdfFileName);

    await fsPromises.writeFile(pdfFilePath, pdfBytes);
    await fsPromises.access(pdfFilePath, fs.constants.R_OK);

    bill.pdfFilePath = pdfFilePath;
    await bill.save();

    log(`PDF generated for bill ${bill.billNumber}: ${pdfFilePath}`, 'info');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);

    const fileStream = fs.createReadStream(pdfFilePath);
    fileStream.pipe(res);

    fileStream.on('error', (streamErr) => {
      log(`Error streaming PDF file for bill ${bill.billNumber}: ${streamErr.message}`, 'error');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to stream PDF file.' });
      }
    });

    fileStream.on('end', () => {
      log(`PDF file streamed for bill ${bill.billNumber}`, 'info');
      res.end();
    });
  } catch (error) {
    log(`Error generating PDF for bill ID ${billId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error while generating PDF bill.' });
    }
  }
};

 const   amountToWords = (number) => {
    if (number === null || number === undefined || isNaN(parseInt(number, 10))) {
        return ''; // Handle invalid input
    }
    let num = parseInt(number, 10); // Expecting a whole number
    if (num === 0) return 'Zero Rupees Only';

    const আচ্ছা = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const থানা = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
    
    let mainNum = num; // No decimal part to handle

    let str = "";
    const crore = Math.floor(mainNum / 10000000); mainNum %= 10000000;
    const lakh = Math.floor(mainNum / 100000); mainNum %= 100000;
    const thousand = Math.floor(mainNum / 1000); mainNum %= 1000;
    const hundred = Math.floor(mainNum / 100); mainNum %= 100;

    if (crore > 0) { str += (crore > 19 ? থানা[Math.floor(crore / 10)] + আচ্ছা[crore % 10] : আচ্ছা[crore]) + 'Crore '; }
    if (lakh > 0) { str += (lakh > 19 ? থানা[Math.floor(lakh / 10)] + আচ্ছা[lakh % 10] : আচ্ছা[lakh]) + 'Lakh '; }
    if (thousand > 0) { str += (thousand > 19 ? থানা[Math.floor(thousand / 10)] + আচ্ছা[thousand % 10] : আচ্ছা[thousand]) + 'Thousand '; }
    if (hundred > 0) { str += (hundred > 19 ? থানা[Math.floor(hundred / 10)] + আচ্ছা[hundred % 10] : আচ্ছা[hundred]) + 'Hundred '; }
    if (mainNum > 0) { str += (str !== "" && mainNum < 100 && str.trim() !== '' ? "and " : "") + (mainNum > 19 ? থানা[Math.floor(mainNum / 10)] + আচ্ছা[mainNum % 10] : আচ্ছা[mainNum]); }
    
    // No decimal part (Paise) to handle as amounts are rounded
    
    const finalStr = (str.trim() + " Rupees Only").trim();
    // Ensure "Zero Rupees Only" if nothing else, or if the number was indeed zero.
    return finalStr.length > "Rupees Only".length ? finalStr : "Zero Rupees Only";
};

// @desc    Download bills as Excel with filters
// @route   GET /api/bills/download/excel
// @access  Private/Admin
const downloadBillsExcel = async (req, res) => {
  const { companyId, startDate, endDate, status, month, year } = req.query;
  const query = {};

  if (companyId) query.company = companyId;
  if (status) query.status = status;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    query.billDate = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    query.billDate = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    };
  } else if (startDate) {
    query.billDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.billDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  try {
    const bills = await Bill.find(query)
      .populate('company', 'name gstNumber address')
      .sort({ billDate: 1, billNumber: 1 });

    if (!bills || bills.length === 0) {
      return res.status(404).json({ message: 'No bills found matching the criteria' });
    }

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Bills');

    worksheet.columns = [
      { header: 'Bill No.', key: 'billNumber', width: 15 },
      { header: 'Date', key: 'billDate', width: 12 },
      { header: 'Challan No.', key: 'challanNumber', width: 15 },
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'Company GST', key: 'companyGst', width: 20 },
      { header: 'Company Address', key: 'companyAddress', width: 40 },
      { header: 'Item Description', key: 'itemDescription', width: 30 },
      { header: 'HSN/SAC', key: 'hsnSac', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Rate', key: 'rate', width: 12, style: { numFmt: '₹#,##0.00' } },
      { header: 'Amount', key: 'amount', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Subtotal', key: 'subtotal', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Discount %', key: 'discountPercent', width: 12 },
      { header: 'Discount Amt', key: 'discountAmt', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Taxable Amt', key: 'taxableAmt', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'CGST %', key: 'cgstPercent', width: 10 },
      { header: 'CGST Amt', key: 'cgstAmt', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'SGST %', key: 'sgstPercent', width: 10 },
      { header: 'SGST Amt', key: 'sgstAmt', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'IGST %', key: 'igstPercent', width: 10 },
      { header: 'IGST Amt', key: 'igstAmt', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'JOBCGST %', key: 'jobCgstPercent', width: 10 },
      { header: 'JOBCGST Amt', key: 'jobCgstAmt', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'JOBSGST %', key: 'jobSgstPercent', width: 10 },
      { header: 'JOBSGST Amt', key: 'jobSgstAmt', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Total Tax', key: 'totalTax', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Grand Total', key: 'grandTotal', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Amount in Words', key: 'amountInWords', width: 50 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    bills.forEach(bill => {
      bill.items.forEach((item, index) => {
        const rowData = {
          billNumber: index === 0 ? bill.billNumber : '',
          billDate: index === 0 ? bill.billDate.toLocaleDateString('en-IN') : '',
          challanNumber: index === 0 ? bill.challanNumber : '',
          companyName: index === 0 ? bill.company?.name || bill.companyDetailsSnapshot?.name : '',
          companyGst: index === 0 ? bill.company?.gstNumber || bill.companyDetailsSnapshot?.gstNumber : '',
          companyAddress: index === 0 ? bill.company?.address || bill.companyDetailsSnapshot?.address : '',
          itemDescription: item.description,
          hsnSac: item.hsnSacCode,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          subtotal: index === 0 ? bill.subTotalAmount : '',
          discountPercent: index === 0 ? bill.discountPercentage : '',
          discountAmt: index === 0 ? bill.discountAmount : '',
          taxableAmt: index === 0 ? bill.amountAfterDiscount : '',
          cgstPercent: index === 0 ? (bill.taxType === 'CGST_SGST' ? bill.cgstPercentage : '') : '',
          cgstAmt: index === 0 ? bill.cgstAmount : '',
          sgstPercent: index === 0 ? (bill.taxType === 'CGST_SGST' ? bill.sgstPercentage : '') : '',
          sgstAmt: index === 0 ? bill.sgstAmount : '',
          igstPercent: index === 0 ? (bill.taxType === 'IGST' ? bill.igstPercentage : '') : '',
          igstAmt: index === 0 ? bill.igstAmount : '',
          jobCgstPercent: index === 0 ? (bill.taxType === 'JOBCGST_JOBSGST' ? bill.jobCgstPercentage : '') : '',
          jobCgstAmt: index === 0 ? bill.jobCgstAmount : '',
          jobSgstPercent: index === 0 ? (bill.taxType === 'JOBCGST_JOBSGST' ? bill.jobSgstPercentage : '') : '',
          jobSgstAmt: index === 0 ? bill.jobSgstAmount : '',
          totalTax: index === 0 ? bill.totalTaxAmount : '',
          grandTotal: index === 0 ? bill.totalAmount : '',
          amountInWords: index === 0 ? bill.amountInWords : '',
          status: index === 0 ? bill.status : ''
        };
        worksheet.addRow(rowData);
      });

      worksheet.addRow([]);
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    let fileName = 'Bills';
    if (month && year) {
      fileName += `_${month}-${year}`;
    } else if (startDate && endDate) {
      fileName += `_${startDate}_to_${endDate}`;
    } else if (companyId) {
      fileName += `_Company_${companyId}`;
    }
    fileName += '.xlsx';

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    log(`Error generating Excel: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Error generating Excel file' });
  }
};

// @desc    Download bills as PDF with filters
// @route   GET /api/bills/download/pdf
// @access  Private/Admin
const downloadBillsPdf = async (req, res) => {
  const { companyId, startDate, endDate, status, month, year } = req.query;
  const query = {};

  if (companyId) query.company = companyId;
  if (status) query.status = status;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    query.billDate = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    query.billDate = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    };
  } else if (startDate) {
    query.billDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.billDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  try {
    const bills = await Bill.find(query)
      .populate('company', 'name gstNumber address')
      .populate('challan', 'challanNumber descriptionOfGoods totalNetWeight totalCops')
      .sort({ billDate: 1, billNumber: 1 });

    if (!bills || bills.length === 0) {
      log(`PDF generation failed: No bills found matching query ${JSON.stringify(query)}`, 'warn');
      return res.status(404).json({ message: 'No bills found matching the criteria' });
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const margin = 50;
    const tableWidth = width - margin * 2;
    const contentWidth = tableWidth - 20;
    const maxY = margin;

    const drawText = (text, x, y, size = 10, isBold = false, maxWidth = contentWidth, align = 'left') => {
      const safeText = String(text || '').replace(/₹/g, 'Rs. ');
      const currentFont = isBold ? boldFont : font;
      const textWidth = currentFont.widthOfTextAtSize(safeText, size);
      let finalX = x;

      if (align === 'center' && maxWidth) {
        finalX = x + (maxWidth - textWidth) / 2;
      } else if (align === 'right' && maxWidth) {
        finalX = x + (maxWidth - textWidth);
      }

      page.drawText(safeText, {
        x: finalX,
        y,
        size,
        font: currentFont,
        maxWidth: maxWidth || undefined,
        lineHeight: size * 1.3,
        wordBreaks: [' ', '/', '-', ',']
      });

      return currentFont.heightAtSize(size) * (safeText.split('\n').length || 1);
    };

    let currentY = height - margin;
    const checkPageBreak = (requiredHeight) => {
      if (currentY - requiredHeight < maxY) {
        drawText('Continued on next page...', margin, maxY + 10, 8, false, contentWidth, 'center');
        page = pdfDoc.addPage(PageSizes.A4);
        currentY = height - margin;
        return true;
      }
      return false;
    };

    // Draw report header
    let reportTitle = 'BILLS REPORT';
    if (month && year) {
      reportTitle += ` (${month}/${year})`;
    } else if (startDate && endDate) {
      reportTitle += ` (${startDate} to ${endDate})`;
    } else if (companyId) {
      const company = await Company.findById(companyId);
      reportTitle += ` for ${company?.name || 'Selected Company'}`;
    }
    checkPageBreak(30);
    currentY -= drawText(reportTitle, margin, currentY, 14, true, contentWidth, 'center') + 20;

    // Define table column widths
    const colWidths = {
      billNumber: 60,
      billDate: 70,
      companyName: 100,
      taxableAmt: 60,
      cgst: 50,
      sgst: 50,
      igst: 50,
      jobCgst: 50,
      jobSgst: 50,
      totalTax: 60,
      grandTotal: 60
    };

    const totalTableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
    const startX = margin + (tableWidth - totalTableWidth) / 2;

    // Table headers
    const headers = [
      { key: 'billNumber', label: 'Bill No.', x: startX },
      { key: 'billDate', label: 'Date', x: startX + colWidths.billNumber },
      { key: 'companyName', label: 'Company', x: startX + colWidths.billNumber + colWidths.billDate },
      { key: 'taxableAmt', label: 'Taxable Amt', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName },
      { key: 'cgst', label: 'CGST', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName + colWidths.taxableAmt },
      { key: 'sgst', label: 'SGST', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName + colWidths.taxableAmt + colWidths.cgst },
      { key: 'igst', label: 'IGST', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName + colWidths.taxableAmt + colWidths.cgst + colWidths.sgst },
      { key: 'jobCgst', label: 'JOBCGST', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName + colWidths.taxableAmt + colWidths.cgst + colWidths.sgst + colWidths.igst },
      { key: 'jobSgst', label: 'JOBSGST', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName + colWidths.taxableAmt + colWidths.cgst + colWidths.sgst + colWidths.igst + colWidths.jobCgst },
      { key: 'totalTax', label: 'Total Tax', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName + colWidths.taxableAmt + colWidths.cgst + colWidths.sgst + colWidths.igst + colWidths.jobCgst + colWidths.jobSgst },
      { key: 'grandTotal', label: 'Grand Total', x: startX + colWidths.billNumber + colWidths.billDate + colWidths.companyName + colWidths.taxableAmt + colWidths.cgst + colWidths.sgst + colWidths.igst + colWidths.jobCgst + colWidths.jobSgst + colWidths.totalTax }
    ];

    checkPageBreak(20);
    page.drawRectangle({
      x: startX,
      y: currentY - 15,
      width: totalTableWidth,
      height: 20,
      color: rgb(0.1, 0.3, 0.5),
      opacity: 0.1
    });

    headers.forEach(header => {
      drawText(header.label, header.x + 5, currentY - 5, 9, true, colWidths[header.key] - 10, 'center');
    });

    currentY -= 20;
    page.drawLine({
      start: { x: startX, y: currentY },
      end: { x: startX + totalTableWidth, y: currentY },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2)
    });

    // Table rows
    bills.forEach((bill, index) => {
      checkPageBreak(20);
      if (index % 2 === 0) {
        page.drawRectangle({
          x: startX,
          y: currentY - 15,
          width: totalTableWidth,
          height: 20,
          color: rgb(0.98, 0.98, 0.98),
          opacity: 0.5
        });
      }

      const rowData = {
        billNumber: bill.billNumber,
        billDate: bill.billDate.toLocaleDateString('en-IN'),
        companyName: bill.company?.name || bill.companyDetailsSnapshot?.name || 'N/A',
        taxableAmt: Math.round(bill.amountAfterDiscount || 0).toFixed(2),
        cgst: bill.taxType === 'CGST_SGST' ? Math.round(bill.cgstAmount || 0).toFixed(2) : '',
        sgst: bill.taxType === 'CGST_SGST' ? Math.round(bill.sgstAmount || 0).toFixed(2) : '',
        igst: bill.taxType === 'IGST' ? Math.round(bill.igstAmount || 0).toFixed(2) : '',
        jobCgst: bill.taxType === 'JOBCGST_JOBSGST' ? Math.round(bill.jobCgstAmount || 0).toFixed(2) : '',
        jobSgst: bill.taxType === 'JOBCGST_JOBSGST' ? Math.round(bill.jobSgstAmount || 0).toFixed(2) : '',
        totalTax: Math.round(bill.totalTaxAmount || 0).toFixed(2),
        grandTotal: Math.round(bill.totalAmount || 0).toFixed(2)
      };

      headers.forEach(header => {
        drawText(rowData[header.key], header.x + 5, currentY - 5, 9, false, colWidths[header.key] - 10, 'center');
      });

      currentY -= 20;
      page.drawLine({
        start: { x: startX, y: currentY },
        end: { x: startX + totalTableWidth, y: currentY },
        thickness: 0.5,
        color: rgb(0.2, 0.2, 0.2)
      });
    });

    // Draw footer
    checkPageBreak(30);
    currentY -= 10;
    drawText(
      `Generated on ${new Date().toLocaleDateString('en-IN')} by ${req.user.email}`,
      margin,
      currentY,
      8,
      false,
      contentWidth,
      'center'
    );

    const pdfBytes = await pdfDoc.save();
    const outputDir = path.join(__dirname, '..', 'generated_bills', 'pdf');
    await fsPromises.mkdir(outputDir, { recursive: true });

    let fileName = 'Bills_Report';
    if (month && year) {
      fileName += `_${month}-${year}`;
    } else if (startDate && endDate) {
      fileName += `_${startDate}_to_${endDate}`;
    } else if (companyId) {
      fileName += `_Company_${companyId}`;
    }
    fileName += '.pdf';
    const pdfFilePath = path.join(outputDir, fileName);

    await fsPromises.writeFile(pdfFilePath, pdfBytes);
    await fsPromises.access(pdfFilePath, fs.constants.R_OK);

    log(`PDF report generated: ${pdfFilePath}`, 'info');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(pdfFilePath);
    fileStream.pipe(res);
    fileStream.on('error', (streamErr) => {
      log(`Error streaming PDF report: ${streamErr.message}`, 'error');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to stream PDF report.' });
      }
    });
    fileStream.on('end', () => {
      log(`PDF report streamed successfully: ${fileName}`, 'info');
      res.end();
    });
  } catch (error) {
    log(`Error generating PDF report: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while generating PDF report.' });
  } finally {
    if (!res.headersSent) {
      res.end();
    }
  }
}
module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  getAvailableChallans,
  generateBillExcel,
  generateBillPdf,
  amountToWords,
  downloadBillsExcel,
  downloadBillsPdf,
  calculateBillTotals
};