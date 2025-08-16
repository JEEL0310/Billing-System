const Purchase = require('../models/Purchase');
const Company = require('../models/Company');
const { log } = require('../middleware/logger');
const exceljs = require('exceljs');
const { PDFDocument, rgb, StandardFonts, PageSizes } = require('pdf-lib');
const fsPromises = require('fs').promises;
const path = require('path');
const fontkit = require('@pdf-lib/fontkit');

// @desc    Create a new purchase record
// @route   POST /api/purchases
// @access  Private/Admin
const   createPurchase = async (req, res) => {
  const {
    supplierCompanyId,
    challanNumber,
    purchaseBillNumber,
    challanDate,
    purchaseBillDate,
    denier,
    grade,
    totalGrossWeight,
    tareWeight = 0, // Default tare weight to 0 if not provided
    // netWeight, // Will be calculated or can be passed
    ratePerUnit,
    amount, // Can be calculated or passed
    paymentStatus,
    notes,
  } = req.body;

  if (!supplierCompanyId || !purchaseBillNumber || !purchaseBillDate || totalGrossWeight === undefined || ratePerUnit === undefined) {
    return res.status(400).json({ message: 'Supplier, bill number, bill date, gross weight, and rate are required.' });
  }

  try {
    const supplier = await Company.findById(supplierCompanyId);
    if (!supplier) {
      log(`Purchase creation failed: Supplier company not found - ID: ${supplierCompanyId}`, 'warn');
      return res.status(404).json({ message: 'Supplier company not found.' });
    }
    const supplierDetailsSnapshot = {
      name: supplier.name,
      address: supplier.address,
      gstNumber: supplier.gstNumber,
    };

    let calculatedNetWeight = parseFloat((parseFloat(totalGrossWeight) - parseFloat(tareWeight)).toFixed(3));
    let calculatedAmount = parseFloat((calculatedNetWeight * parseFloat(ratePerUnit)).toFixed(2));

    // If amount is provided directly, use it. Otherwise, use calculated.
    // This allows flexibility if the final amount has adjustments not covered by simple netWeight * rate.
    const finalAmount = amount !== undefined ? parseFloat(amount) : calculatedAmount;


    const purchase = new Purchase({
      supplierCompany: supplierCompanyId,
      supplierDetailsSnapshot,
      challanNumber,
      purchaseBillNumber,
      challanDate: challanDate ? new Date(challanDate) : undefined,
      purchaseBillDate: new Date(purchaseBillDate),
      denier,
      grade,
      totalGrossWeight: parseFloat(totalGrossWeight),
      tareWeight: parseFloat(tareWeight),
      netWeight: calculatedNetWeight, // Use calculated net weight
      ratePerUnit: parseFloat(ratePerUnit),
      amount: finalAmount,
      paymentStatus: paymentStatus || 'Unpaid',
      notes,
      createdBy: req.user._id,
      // dueDate will be set by pre-save hook
    });

    const createdPurchase = await purchase.save();
    log(`Purchase record created successfully: Bill# ${createdPurchase.purchaseBillNumber} from ${supplier.name} by ${req.user.email}`, 'info');
    res.status(201).json(createdPurchase);
  } catch (error) {
    log(`Error creating purchase record: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating purchase record.' });
  }
};

// @desc    Get all purchase records
// @route   GET /api/purchases
// @access  Private/Admin
const   getPurchases = async (req, res) => {
  const { supplierCompanyId, startDate, endDate, paymentStatus } = req.query;
  const query = {};

  if (supplierCompanyId) query.supplierCompany = supplierCompanyId;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (startDate && endDate) {
    query.purchaseBillDate = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23,59,59,999)) };
  } else if (startDate) {
    query.purchaseBillDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.purchaseBillDate = { $lte: new Date(new Date(endDate).setHours(23,59,59,999)) };
  }

  try {
    const purchases = await Purchase.find(query)
      .populate('supplierCompany', 'name')
      .populate('createdBy', 'username email')
      .sort({ purchaseBillDate: -1, createdAt: -1 });

    log(`Fetched purchase records with query ${JSON.stringify(query)} by ${req.user.email}`, 'info');
    res.json(purchases);
  } catch (error) {
    log(`Error fetching purchase records: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching purchase records.' });
  }
};

// @desc    Get a single purchase record by ID
// @route   GET /api/purchases/:id
// @access  Private/Admin
const   getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierCompany', 'name address gstNumber mobileNumber')
      .populate('createdBy', 'username email');

    if (!purchase) {
      log(`Purchase record not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Purchase record not found' });
    }
    log(`Fetched purchase record by ID: Bill# ${purchase.purchaseBillNumber} by ${req.user.email}`, 'info');
    res.json(purchase);
  } catch (error) {
    log(`Error fetching purchase record ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching purchase record.' });
  }
};

// @desc    Update a purchase record
// @route   PUT /api/purchases/:id
// @access  Private/Admin
const   updatePurchase = async (req, res) => {
  const {
    supplierCompanyId, // Note: Changing supplier might be complex if other things depend on it.
    challanNumber,
    purchaseBillNumber,
    challanDate,
    purchaseBillDate,
    denier,
    grade,
    totalGrossWeight,
    tareWeight,
    // netWeight, // Recalculate if weights change
    ratePerUnit,
    amount, // Recalculate or allow override
    paymentStatus,
    notes,
  } = req.body;

  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      log(`Purchase update failed: Not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    // Update supplier if changed
    if (supplierCompanyId && purchase.supplierCompany.toString() !== supplierCompanyId) {
      const newSupplier = await Company.findById(supplierCompanyId);
      if (!newSupplier) {
        return res.status(404).json({ message: 'New supplier company not found.' });
      }
      purchase.supplierCompany = supplierCompanyId;
      purchase.supplierDetailsSnapshot = {
        name: newSupplier.name,
        address: newSupplier.address,
        gstNumber: newSupplier.gstNumber,
      };
    }
    
    // Update fields
    if (challanNumber !== undefined) purchase.challanNumber = challanNumber;
    if (purchaseBillNumber !== undefined) purchase.purchaseBillNumber = purchaseBillNumber;
    if (challanDate !== undefined) purchase.challanDate = challanDate ? new Date(challanDate) : null;
    if (purchaseBillDate !== undefined) purchase.purchaseBillDate = new Date(purchaseBillDate);
    if (denier !== undefined) purchase.denier = denier;
    if (grade !== undefined) purchase.grade = grade;

    let needsRecalculation = false;
    if (totalGrossWeight !== undefined) {
        purchase.totalGrossWeight = parseFloat(totalGrossWeight);
        needsRecalculation = true;
    }
    if (tareWeight !== undefined) {
        purchase.tareWeight = parseFloat(tareWeight);
        needsRecalculation = true;
    }
     if (ratePerUnit !== undefined) {
        purchase.ratePerUnit = parseFloat(ratePerUnit);
        needsRecalculation = true;
    }

    if (needsRecalculation) {
        purchase.netWeight = parseFloat((purchase.totalGrossWeight - purchase.tareWeight).toFixed(3));
        // If amount is not explicitly passed in update, recalculate it.
        // If amount IS passed, it overrides calculation.
        if (amount === undefined) {
            purchase.amount = parseFloat((purchase.netWeight * purchase.ratePerUnit).toFixed(2));
        }
    }
    
    // Allow direct update of amount if provided, otherwise it's based on calculation
    if (amount !== undefined) {
        purchase.amount = parseFloat(amount);
    }


    if (paymentStatus !== undefined) purchase.paymentStatus = paymentStatus;
    if (notes !== undefined) purchase.notes = notes;
    
    // Due date will be recalculated by pre-save hook if purchaseBillDate changes

    const updatedPurchase = await purchase.save();
    log(`Purchase record updated: Bill# ${updatedPurchase.purchaseBillNumber} by ${req.user.email}`, 'info');
    res.json(updatedPurchase);
  } catch (error) {
    log(`Error updating purchase ID ${req.params.id}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating purchase record.' });
  }
};

// @desc    Delete a purchase record
// @route   DELETE /api/purchases/:id
// @access  Private/Admin
const   deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      log(`Purchase deletion failed: Not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    // Consider implications: e.g., if linked to transactions.
    await purchase.deleteOne();
    log(`Purchase record deleted: Bill# ${purchase.purchaseBillNumber} by ${req.user.email}`, 'info');
    res.json({ message: 'Purchase record removed successfully.' });
  } catch (error) {
    log(`Error deleting purchase ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while deleting purchase record.' });
  }
};

// @desc    Download purchases as Excel
// @route   GET /api/purchases/download/excel
// @access  Private/Admin
const downloadPurchasesExcel = async (req, res) => {
  const { supplierCompanyId, startDate, endDate, paymentStatus } = req.query;
  const query = {};

  if (supplierCompanyId) query.supplierCompany = supplierCompanyId;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (startDate && endDate) {
    query.purchaseBillDate = { 
      $gte: new Date(startDate), 
      $lte: new Date(new Date(endDate).setHours(23,59,59,999)) 
    };
  } else if (startDate) {
    query.purchaseBillDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.purchaseBillDate = { $lte: new Date(new Date(endDate).setHours(23,59,59,999)) };
  }

  try {
    const purchases = await Purchase.find(query)
      .populate('supplierCompany', 'name')
      .sort({ purchaseBillDate: 1, purchaseBillNumber: 1 });

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({ message: 'No purchases found matching the criteria.' });
    }

    // Create workbook and worksheet
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Purchases');

    // Define columns
    worksheet.columns = [
      { header: 'Bill No.', key: 'billNumber', width: 15 },
      { header: 'Date', key: 'billDate', width: 12 },
      { header: 'Supplier', key: 'supplier', width: 30 },
      { header: 'Challan No.', key: 'challanNumber', width: 15 },
      { header: 'Denier', key: 'denier', width: 10 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Gross Weight', key: 'grossWeight', width: 12 },
      { header: 'Tare Weight', key: 'tareWeight', width: 12 },
      { header: 'Net Weight', key: 'netWeight', width: 12 },
      { header: 'Rate', key: 'rate', width: 12, style: { numFmt: '₹#,##0.00' } },
      { header: 'Amount', key: 'amount', width: 12, style: { numFmt: '₹#,##0.00' } },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Add data rows
    purchases.forEach(purchase => {
      worksheet.addRow({
        billNumber: purchase.purchaseBillNumber,
        billDate: purchase.purchaseBillDate.toLocaleDateString('en-IN'),
        supplier: purchase.supplierCompany?.name || purchase.supplierDetailsSnapshot?.name || 'N/A',
        challanNumber: purchase.challanNumber || '-',
        denier: purchase.denier || '-',
        grade: purchase.grade || '-',
        grossWeight: purchase.totalGrossWeight,
        tareWeight: purchase.tareWeight,
        netWeight: purchase.netWeight,
        rate: purchase.ratePerUnit,
        amount: purchase.amount,
        status: purchase.paymentStatus
      });
    });

    // Add summary row
    const lastRow = purchases.length + 2;
    worksheet.addRow({});
    
    // Calculate totals
    const totalGrossWeight = purchases.reduce((sum, p) => sum + p.totalGrossWeight, 0);
    const totalTareWeight = purchases.reduce((sum, p) => sum + p.tareWeight, 0);
    const totalNetWeight = purchases.reduce((sum, p) => sum + p.netWeight, 0);
    const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);

    worksheet.addRow({
      billNumber: 'TOTALS:',
      grossWeight: totalGrossWeight,
      tareWeight: totalTareWeight,
      netWeight: totalNetWeight,
      amount: totalAmount
    });

    // Style the summary row
    const summaryRow = worksheet.getRow(lastRow + 1);
    summaryRow.font = { bold: true };
    summaryRow.eachCell((cell) => {
      if (cell.value) {
        cell.border = { top: { style: 'thin' } };
      }
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    // Generate filename
    let fileName = 'Purchases';
    if (startDate && endDate) fileName += `_${startDate}_to_${endDate}`;
    if (supplierCompanyId) {
      const supplier = purchases[0]?.supplierCompany?.name || purchases[0]?.supplierDetailsSnapshot?.name;
      fileName += supplier ? `_${supplier}` : `_Supplier_${supplierCompanyId}`;
    }
    fileName += '.xlsx';

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    log(`Error generating Excel report: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while generating Excel report.' });
  }
};

// @desc    Download purchases as PDF
// @route   GET /api/purchases/download/pdf
// @access  Private/Admin
const downloadPurchasesPdf = async (req, res) => {
  const { supplierCompanyId, startDate, endDate, paymentStatus } = req.query;
  const query = {};

  if (supplierCompanyId) query.supplierCompany = supplierCompanyId;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (startDate && endDate) {
    query.purchaseBillDate = { 
      $gte: new Date(startDate), 
      $lte: new Date(new Date(endDate).setHours(23,59,59,999)) 
    };
  } else if (startDate) {
    query.purchaseBillDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.purchaseBillDate = { $lte: new Date(new Date(endDate).setHours(23,59,59,999)) };
  }

  try {
    const purchases = await Purchase.find(query)
      .populate('supplierCompany', 'name')
      .sort({ purchaseBillDate: 1, purchaseBillNumber: 1 });

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({ message: 'No purchases found matching the criteria.' });
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    // Use standard fonts (no custom font needed)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const margin = 40;
    const tableWidth = width - margin * 2;

    // Helper function to draw text
    const drawText = (text, x, y, size = 10, isBold = false, maxWidth = tableWidth, align = 'left') => {
      const currentFont = isBold ? boldFont : font;
      const textWidth = currentFont.widthOfTextAtSize(text, size);
      let finalX = x;
      
      if (align === 'center' && maxWidth) {
        finalX = x + (maxWidth - textWidth) / 2;
      } else if (align === 'right' && maxWidth) {
        finalX = x + (maxWidth - textWidth);
      }
      
      page.drawText(text, {
        x: finalX,
        y,
        size,
        font: currentFont,
        maxWidth: maxWidth || undefined,
        lineHeight: size * 1.2
      });
      
      return textWidth;
    };

    // Current position
    let y = height - margin;

    // Report title
    let reportTitle = 'PURCHASES REPORT';
    if (startDate && endDate) {
      reportTitle += ` (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`;
    }
    drawText(reportTitle, margin, y, 16, true, tableWidth, 'center');
    y -= 30;

    // Filter information
    let filterInfo = '';
    if (supplierCompanyId) {
      const supplier = purchases[0]?.supplierCompany?.name || purchases[0]?.supplierDetailsSnapshot?.name;
      filterInfo += `Supplier: ${supplier || supplierCompanyId}`;
    }
    if (paymentStatus) {
      filterInfo += `${filterInfo ? ' | ' : ''}Status: ${paymentStatus}`;
    }
    if (filterInfo) {
      drawText(filterInfo, margin, y, 10, false, tableWidth, 'center');
      y -= 20;
    }

    // Summary information
    const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
    drawText(`Total Purchases: ${purchases.length}`, margin, y, 12, true);
    drawText(`Grand Total: Rs. ${totalAmount.toLocaleString('en-IN')}`, width - margin - 100, y, 12, true);
    y -= 25;

    // Table header
    const colPositions = {
      billNo: margin,
      date: margin + 70,
      supplier: margin + 140,
      weight: margin + 300,
      amount: width - margin - 80
    };

    // Header background
    page.drawRectangle({
      x: margin,
      y: y - 7,
      width: tableWidth,
      height: 20,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.5
    });

    // Header text
    drawText('Bill No.', colPositions.billNo, y, 10, true);
    drawText('Date', colPositions.date, y, 10, true);
    drawText('Supplier', colPositions.supplier, y, 10, true);
    drawText('Weight', colPositions.weight, y, 10, true);
    drawText('Amount', colPositions.amount, y, 10, true);
    y -= 25;

    // Purchases data
    for (const purchase of purchases) {
      // Check if we need a new page
      if (y < margin + 100) {
        drawText('Continued on next page...', margin, margin - 20, 10);
        page = pdfDoc.addPage(PageSizes.A4);
        y = height - margin;
        
        // Repeat header on new page
        page.drawRectangle({
          x: margin,
          y: y + 5,
          width: tableWidth,
          height: 20,
          color: rgb(0.8, 0.8, 0.8),
          opacity: 0.5
        });
        drawText('Bill No.', colPositions.billNo, y, 10, true);
        drawText('Date', colPositions.date, y, 10, true);
        drawText('Supplier', colPositions.supplier, y, 10, true);
        drawText('Weight', colPositions.weight, y, 10, true);
        drawText('Amount', colPositions.amount, y, 10, true);
        y -= 25;
      }

      // Purchase row
      drawText(purchase.purchaseBillNumber, colPositions.billNo, y, 10);
      drawText(purchase.purchaseBillDate.toLocaleDateString('en-IN'), colPositions.date, y, 10);
      
      const supplierName = purchase.supplierCompany?.name || purchase.supplierDetailsSnapshot?.name || 'N/A';
      const supplierText = supplierName.length > 20 ? supplierName.substring(0, 17) + '...' : supplierName;
      drawText(supplierText, colPositions.supplier, y, 10);
      
      drawText(`${purchase.netWeight} kg`, colPositions.weight, y, 10);
      drawText(`Rs. ${purchase.amount.toLocaleString('en-IN')}`, colPositions.amount, y, 10, false, 80, 'right');
      
      // Underline
      page.drawLine({
        start: { x: margin, y: y - 5 },
        end: { x: width - margin, y: y - 5 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7)
      });
      
      y -= 20;

      // Details sub-table
      const detailColPositions = {
        label: margin + 20,
        value: margin + 100
      };

      // Details header
      drawText('Details:', margin + 10, y, 9, true);
      y -= 15;
      
      // Details data
      if (purchase.challanNumber) {
        drawText('Challan No:', detailColPositions.label, y, 8);
        drawText(purchase.challanNumber, detailColPositions.value, y, 8);
        y -= 15;
      }
      
      if (purchase.denier) {
        drawText('Denier:', detailColPositions.label, y, 8);
        drawText(purchase.denier, detailColPositions.value, y, 8);
        y -= 15;
      }
      
      if (purchase.grade) {
        drawText('Grade:', detailColPositions.label, y, 8);
        drawText(purchase.grade, detailColPositions.value, y, 8);
        y -= 15;
      }
      
      drawText('Gross Weight:', detailColPositions.label, y, 8);
      drawText(`${purchase.totalGrossWeight} kg`, detailColPositions.value, y, 8);
      y -= 15;
      
      drawText('Tare Weight:', detailColPositions.label, y, 8);
      drawText(`${purchase.tareWeight} kg`, detailColPositions.value, y, 8);
      y -= 15;
      
      drawText('Rate:', detailColPositions.label, y, 8);
      drawText(`Rs. ${purchase.ratePerUnit}/kg`, detailColPositions.value, y, 8);
      y -= 15;
      
      drawText('Status:', detailColPositions.label, y, 8);
      drawText(purchase.paymentStatus, detailColPositions.value, y, 8);
      y -= 25;
    }

    // Footer
    drawText(`Generated on ${new Date().toLocaleDateString()}`, margin, margin - 20, 9);
    drawText(`Total Purchases: ${purchases.length} | Grand Total: Rs. ${totalAmount.toLocaleString('en-IN')}`, 
      width - margin - 250, margin - 20, 9, true);

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    
    // Generate filename
    let fileName = 'Purchases';
    if (startDate && endDate) fileName += `_${startDate}_to_${endDate}`;
    if (supplierCompanyId) {
      const supplier = purchases[0]?.supplierCompany?.name || purchases[0]?.supplierDetailsSnapshot?.name;
      fileName += supplier ? `_${supplier}` : `_Supplier_${supplierCompanyId}`;
    }
    fileName += '.pdf';

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send the PDF
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    log(`Error generating PDF report: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while generating PDF report.' });
  }
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  downloadPurchasesExcel,
  downloadPurchasesPdf

};



// now in this we have to add also in filter like compny wise also we have filter and we have to add two function download as excel and pdf in this we have download pdf and excle based on start date and end date and also on based on Supplier and based on satus also give me updated code for this 
