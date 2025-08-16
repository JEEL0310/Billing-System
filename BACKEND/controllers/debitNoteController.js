// controllers/debitNoteController.js
const DebitNote = require('../models/DebitNote');
const Bill = require('../models/Bill');
const Company = require('../models/Company');
const { log } = require('../middleware/logger');
const exceljs = require('exceljs');
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts, PageSizes } = require('pdf-lib');
const { amountToWords } = require('../utils/amountToWords');


// @desc    Create a new debit note
// @route   POST /api/debit-notes
// @access  Private/Admin
const createDebitNote = async (req, res) => {
  const {
    originalBillId,
    paymentDate,
    overrideInterestRate, // Monthly interest rate in percentage (e.g., 1.5)
    overrideCgstPercentage,
    overrideSgstPercentage,
    overrideTdsPercentage
  } = req.body;

  try {
    // 1. Fetch the original bill with company details
    const originalBill = await Bill.findById(originalBillId).populate('company');
    if (!originalBill) {
      log(`Debit note creation failed: Original bill not found - ID: ${originalBillId}`, 'warn');
      return res.status(404).json({ message: 'Original bill not found.' });
    }

    // 2. Calculate due date (bill date + credit period)
    const creditPeriod = originalBill.creditPeriod || 30; // Default to 30 days if not specified
    const dueDate = new Date(originalBill.billDate);
    dueDate.setDate(dueDate.getDate() + creditPeriod);
    
    const actualPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    
    // Calculate late days (excludes due date, includes payment date)
    const lateDays = Math.max(0, Math.ceil((actualPaymentDate - dueDate) / (1000 * 60 * 60 * 24)));
    
    if (lateDays <= 0) {
      return res.status(400).json({ message: 'Payment is not late. No debit note needed.' });
    }

    // 3. Generate debit note number sequence
    const lastDebitNote = await DebitNote.findOne().sort({ debitNoteNumber: -1 });
    let nextNumber = 1;
    if (lastDebitNote) {
      const lastNum = parseInt(lastDebitNote.debitNoteNumber.split('/').pop(), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    const debitNoteNumber = `DN/${new Date().getFullYear()}/${nextNumber.toString().padStart(4, '0')}`;

    // 4. Calculate interest rate (convert monthly % to daily decimal)
    const defaultMonthlyInterestRate = 1.5; // 1.5% per month
    const monthlyInterestRate = overrideInterestRate !== undefined 
      ? parseFloat(overrideInterestRate) 
      : defaultMonthlyInterestRate;
    
    // Convert to daily decimal rate (1.5% monthly → 0.05% daily → 0.0005)
    const dailyInterestRate = monthlyInterestRate / 30 / 100;

    // 5. Create debit note with all details
    const newDebitNote = new DebitNote({
      debitNoteNumber,
      issueDate: new Date(),
      originalBill: originalBillId,
      company: originalBill.company._id,
      companyDetailsSnapshot: {
        name: originalBill.company.name,
        address: originalBill.company.address,
        gstNumber: originalBill.company.gstNumber,
      },
      originalBillNumber: originalBill.billNumber,
      originalBillDate: originalBill.billDate,
      paymentDate: actualPaymentDate,
      lateDays,
      interestRatePerDay: dailyInterestRate,
      principalAmount: originalBill.totalAmount, // Full bill amount
      cgstPercentage: overrideCgstPercentage ?? 6, // Default 6%
      sgstPercentage: overrideSgstPercentage ?? 6, // Default 6%
      tdsPercentage: overrideTdsPercentage ?? 1,  // Default 1%
      createdBy: req.user._id,
    });

    // 6. Save debit note (pre-save hook will calculate amounts)
    const savedDebitNote = await newDebitNote.save();

    log(`Debit note created: ${savedDebitNote.debitNoteNumber} by ${req.user.email}`, 'info');
    res.status(201).json(savedDebitNote);

  } catch (error) {
    log(`Error creating debit note: ${error.message} - Stack: ${error.stack}`, 'error');
    
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      return res.status(400).json({ message: 'Duplicate debit note number.' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error while creating debit note.' });
  }
};

// Generate Excel for a debit note
const generateDebitNoteExcel = async (req, res) => {
  const debitNoteId = req.params.id;
  const excelTemplatePath = process.env.DEBIT_TEMPLATE_PATH;

  if (!excelTemplatePath) {
    log('Debit note Excel generation failed: DEBIT_TEMPLATE_PATH not set in .env', 'error');
    return res.status(500).json({ message: 'Excel template path not configured.' });
  }

  try {
    const debitNote = await DebitNote.findById(debitNoteId).populate('company');
    if (!debitNote) {
      log(`Debit note Excel generation failed: Debit note not found - ID: ${debitNoteId}`, 'warn');
      return res.status(404).json({ message: 'Debit note not found.' });
    }

    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(excelTemplatePath);
    const worksheet = workbook.getWorksheet(1);

    // Populate company details
    worksheet.getCell('A10').value = debitNote.companyDetailsSnapshot.name || debitNote.company.name;
    worksheet.getCell('A11').value = debitNote.companyDetailsSnapshot.address || debitNote.company.address;
    worksheet.getCell('A14').value = debitNote.companyDetailsSnapshot.gstNumber || debitNote.company.gstNumber;

    // Populate debit note details
    worksheet.getCell('I9').value = new Date(debitNote.issueDate).toLocaleDateString('en-IN');
    worksheet.getCell('I10').value = debitNote.debitNoteNumber;
    worksheet.getCell('I11').value = debitNote.originalBillNumber;

    // Populate item row (only one row for interest)
    worksheet.getCell('A17').value = 1; // Sr No.
    worksheet.getCell('B17').value = 'INTEREST ON LATE PAYMENT RECEIVED'; // Particulars
    worksheet.getCell('F17').value = (debitNote.interestRatePerDay * 100).toFixed(2) + '%'; // Interest per day
    worksheet.getCell('H17').value = debitNote.lateDays; // Total late days
    worksheet.getCell('I17').value = debitNote.interestAmount; // Total amount

    // Populate totals
    worksheet.getCell('I27').value = debitNote.interestAmount; // Sub total
    worksheet.getCell('I28').value = debitNote.cgstAmount; // CGST (6%)
    worksheet.getCell('I29').value = debitNote.sgstAmount; // SGST (6%)
    worksheet.getCell('I30').value = debitNote.interestAmount + debitNote.cgstAmount + debitNote.sgstAmount; // Amount
    worksheet.getCell('I31').value = debitNote.tdsAmount; // TDS
    worksheet.getCell('I32').value = debitNote.totalAmount; // TOTAL AMOUNT

    // Save the file
    const outputDir = path.join(__dirname, '..', 'generated_debit_notes', 'excel');
    await fsPromises.mkdir(outputDir, { recursive: true });
    const excelFileName = `DebitNote-${debitNote.debitNoteNumber.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    const excelFilePath = path.join(outputDir, excelFileName);

    await workbook.xlsx.writeFile(excelFilePath);

    // Update debit note document with file path
    debitNote.excelFilePath = excelFilePath;
    await debitNote.save();

    log(`Excel generated for debit note ${debitNote.debitNoteNumber}: ${excelFilePath}`, 'info');

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${excelFileName}"`);
    const stats = await fsPromises.stat(excelFilePath);
    res.setHeader('Content-Length', stats.size);

    // Stream the file
    const fileStream = fs.createReadStream(excelFilePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      log(`Error streaming Excel file for debit note ${debitNote.debitNoteNumber}: ${err.message}`, 'error');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to stream Excel file.' });
      }
    });

    fileStream.on('end', () => {
      log(`Excel file streamed successfully for debit note ${debitNote.debitNoteNumber}`, 'info');
    });

  } catch (error) {
    log(`Error generating Excel for debit note ID ${debitNoteId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error while generating Excel debit note.' });
    }
  }
};

// Generate PDF for a debit note
const generateDebitNotePdf = async (req, res) => {
  const debitNoteId = req.params.id;
  try {
    const debitNote = await DebitNote.findById(debitNoteId).populate('company');
    if (!debitNote) {
      log(`PDF generation failed: Debit note not found - ID: ${debitNoteId}`, 'warn');
      return res.status(404).json({ message: 'Debit note not found.' });
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
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
        wordBreaks: [' ', '-', '/']
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
        if (textToProcess.endsWith('\n') && segments[segments.length-1].trim() !== '') numLines++;
        if (numLines === 0 && textToProcess.trim() !== '') numLines = 1;
      } else {
        numLines = textToProcess.split('\n').length;
        if (numLines === 0 && textToProcess.trim() !== '') numLines = 1;
      }

      const textHeight = textToProcess.trim() === '' ? 0 : numLines * LINE_HEIGHT;
      return textHeight + SPACING_AFTER;
    };

    // --- Header Section ---
    let currentY = y;

    // "SHREE GANESHAY NAMAH" and "DEBIT NOTE"
    const shreeGaneshText = 'SHREE GANESHAY NAMAH';
    const shreeGaneshOptions = { font: boldFont, size: 10, align: 'center', color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
    drawTextAndMeasureHeight(shreeGaneshText, leftMargin, currentY, shreeGaneshOptions);

    const debitNoteText = 'DEBIT NOTE';
    const debitNoteFontSize = 14;
    const debitNoteWidth = boldFont.widthOfTextAtSize(debitNoteText, debitNoteFontSize);
    const debitNoteOptions = { font: boldFont, size: debitNoteFontSize, color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
    drawTextAndMeasureHeight(debitNoteText, rightMargin - debitNoteWidth, currentY, debitNoteOptions);

    currentY -= Math.max(
      drawTextAndMeasureHeight(shreeGaneshText, leftMargin, currentY, { ...shreeGaneshOptions, size: 0 }),
      drawTextAndMeasureHeight(debitNoteText, rightMargin - debitNoteWidth, currentY, { ...debitNoteOptions, size: 0 })
    ) + 18;

    // Company Name - Centered
    const companyNameText = 'MAHADEV FILAMENTS';
    const companyNameFontSize = 25;
    currentY -= drawTextAndMeasureHeight(companyNameText, leftMargin, currentY, { font: boldFont, size: companyNameFontSize, align: 'center', color: rgb(0.1, 0.3, 0.5) });

    // Address - Centered
    const addressText = 'BLOCK NO - 15, 1ST FLOOR, AMBIKA VIBHAG - 2, NEAR NAVJIVAN CIRCLE, U.M. ROAD, SURAT - 395007';
    const addressFontSize = 9;
    currentY -= drawTextAndMeasureHeight(addressText, leftMargin, (currentY + 14), { size: addressFontSize, align: 'center', maxWidth: contentWidth * 1, spacingAfter: 4 });

    // GSTIN - Centered
    const gstinText = 'GSTIN: 24AABEFM9966E1ZZ';
    const gstinFontSize = 10;
    currentY -= drawTextAndMeasureHeight(gstinText, leftMargin, (currentY + 14), { size: gstinFontSize, align: 'center', spacingAfter: 15 });

    y = currentY;

    // Consignee & Debit Note Details
    const clientName = debitNote.companyDetailsSnapshot?.name || debitNote.company?.name || 'N/A';
    const clientAddress = debitNote.companyDetailsSnapshot?.address || debitNote.company?.address || 'N/A';
    const clientGstin = debitNote.companyDetailsSnapshot?.gstNumber || debitNote.company?.gstNumber || 'N/A';

    let yLeft = y;
    let yRight = y;

    const consigneeMaxWidth = contentWidth / 2 - 20;
    const noteDetailsColumnWidth = 180;
    const noteDetailsX = rightMargin - noteDetailsColumnWidth;
    const noteDetailsMaxWidth = noteDetailsColumnWidth - 10;

    // Draw background rectangles
    page.drawRectangle({
      x: leftMargin,
      y: yLeft - 84,
      width: consigneeMaxWidth + 20,
      height: 100,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.5
    });

    page.drawRectangle({
      x: noteDetailsX - 5,
      y: yRight - 84,
      width: noteDetailsColumnWidth,
      height: 100,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.5
    });

    yLeft -= drawTextAndMeasureHeight(`Consignee:`, leftMargin + 5, yLeft, { font: boldFont, size: 11, spacingAfter: 4 });
    yLeft -= drawTextAndMeasureHeight(clientName, leftMargin + 5, yLeft, { font: boldFont, size: 10, spacingAfter: 4, maxWidth: consigneeMaxWidth });
    yLeft -= drawTextAndMeasureHeight(clientAddress, leftMargin + 5, yLeft, { size: 9, spacingAfter: 4, maxWidth: consigneeMaxWidth });
    yLeft -= drawTextAndMeasureHeight(`GSTIN: ${clientGstin}`, leftMargin + 5, yLeft, { font: boldFont, size: 9, spacingAfter: 4, maxWidth: consigneeMaxWidth });

    yRight -= drawTextAndMeasureHeight(`Date: ${new Date(debitNote.issueDate).toLocaleDateString('en-IN')}`, noteDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: noteDetailsMaxWidth });
    yRight -= drawTextAndMeasureHeight(`Debit Note No.: ${debitNote.debitNoteNumber || 'N/A'}`, noteDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: noteDetailsMaxWidth });
    yRight -= drawTextAndMeasureHeight(`Original Invoice No.: ${debitNote.originalBillNumber || 'N/A'}`, noteDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: noteDetailsMaxWidth });
    yRight -= drawTextAndMeasureHeight(`Payment AMOUNT: ${debitNote.principalAmount || 'N/A'}`, noteDetailsX, yRight, { size: 10, spacingAfter: 4, maxWidth: noteDetailsMaxWidth });

    y = Math.min(yLeft, yRight) - lineSpacing;

    // --- Items Table Header ---
    page.drawRectangle({
      x: leftMargin,
      y: y - 22,
      width: contentWidth,
      height: 20,
      color: rgb(0.1, 0.3, 0.5),
      opacity: 0.1
    });
    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= smallLineSpacing;

    const colPositions = {
      srNo: leftMargin + 10,
      particulars: leftMargin + 50,
      interestPerDay: leftMargin + 340,
      lateDays: leftMargin + 410,
      amount: rightMargin - 80
    };

    const headerOptions = { font: boldFont, size: 10, spacingAfter: 0, color: rgb(0.1, 0.1, 0.1) };
    drawTextAndMeasureHeight('Sr No.', colPositions.srNo, y, headerOptions);
    drawTextAndMeasureHeight('Particulars', colPositions.particulars, y, { ...headerOptions, maxWidth: colPositions.interestPerDay - colPositions.particulars - 15 });
    drawTextAndMeasureHeight('Interest/Day', colPositions.interestPerDay, y, headerOptions);
    drawTextAndMeasureHeight('Late Days', colPositions.lateDays, y, headerOptions);
    const amountHeaderText = 'Amount';
    const amountHeaderWidth = boldFont.widthOfTextAtSize(amountHeaderText, 10);
    drawTextAndMeasureHeight(amountHeaderText, rightMargin - amountHeaderWidth - 10, y, headerOptions);

    y -= (smallLineSpacing);
    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= (itemLineSpacing);

    // --- Items Table Row ---
    const itemRowOptions = { size: 9, spacingAfter: 0 };
    let currentItemY = y;

    // Single row for interest
    page.drawRectangle({
      x: leftMargin,
      y: y - 5,
      width: contentWidth,
      height: 16,
      color: rgb(0.98, 0.98, 0.98),
      opacity: 0.5
    });

    drawTextAndMeasureHeight('1', colPositions.srNo, currentItemY, itemRowOptions);
    drawTextAndMeasureHeight('INTEREST ON LATE PAYMENT RECEIVED', colPositions.particulars, currentItemY, { ...itemRowOptions, maxWidth: colPositions.interestPerDay - colPositions.particulars - 15 });
    drawTextAndMeasureHeight(`${(debitNote.interestRatePerDay * 100).toFixed(2)}%`, colPositions.interestPerDay, currentItemY, itemRowOptions);
    drawTextAndMeasureHeight(String(debitNote.lateDays), colPositions.lateDays, currentItemY, itemRowOptions);
    const amountStr = String(debitNote.interestAmount.toFixed(2));
    const amountCellWidth = font.widthOfTextAtSize(amountStr, itemRowOptions.size);
    drawTextAndMeasureHeight(amountStr, rightMargin - amountCellWidth - 10, currentItemY, itemRowOptions);

    y -= (itemLineSpacing * 7);
    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1.5, color: rgb(0.2, 0.2, 0.2) });
    y -= (smallLineSpacing + 3);

    // --- Totals Section ---
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

      y -= (Math.max(hLabel, hValue) + smallLineSpacing - commonOpt.spacingAfter);
    };

    page.drawRectangle({
      x: totalsLabelX - 10,
      y: y - 144,
      width: rightMargin - totalsLabelX + 15,
      height: 154,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.5
    });

    drawTotalLine('Subtotal', debitNote.interestAmount.toFixed(2));
    drawTotalLine(`SGST (${debitNote.sgstPercentage}%):`, `+ ${debitNote.sgstAmount.toFixed(2)}`);
    drawTotalLine(`CGST (${debitNote.cgstPercentage}%):`, `+ ${debitNote.cgstAmount.toFixed(2)}`);
    drawTotalLine('Amount', (debitNote.interestAmount + debitNote.cgstAmount + debitNote.sgstAmount).toFixed(2), true);
    drawTotalLine(`TDS (${debitNote.tdsPercentage}%):`, `- ${debitNote.tdsAmount.toFixed(2)}`);
    y -= 5;
    page.drawLine({ start: { x: totalsLabelX - 10, y: y + (smallLineSpacing / 2) }, end: { x: rightMargin, y: y + (smallLineSpacing / 2) }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= 3;
    drawTotalLine('Total Amount', debitNote.totalAmount.toFixed(2), true);

    // Amount in Words
    if (debitNote.amountInWords) {
      const amountInWordsText = `Amount in Words: ${debitNote.amountInWords}`;
      y -= drawTextAndMeasureHeight(amountInWordsText, leftMargin, y, {
        font: boldFont,
        size: 10,
        spacingAfter: 8,
        maxWidth: contentWidth,
        color: rgb(0.1, 0.1, 0.1)
      });
    }
    y -= 2;

    // --- Bank Details and Footer ---
    page.drawLine({ start: { x: leftMargin, y: y }, end: { x: rightMargin, y: y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
    y -= (smallLineSpacing);

    // Bank Details (Left)
    let bankDetailsY = y;
    const bankDetailsMaxWidth = contentWidth * 0.5;
    bankDetailsY -= drawTextAndMeasureHeight('Bank Details:', leftMargin, bankDetailsY, { font: boldFont, size: 12, spacingAfter: 4 });
    bankDetailsY -= drawTextAndMeasureHeight('Bank Name: Prime Bank of India', leftMargin, bankDetailsY, { size: 10, spacingAfter: 3, maxWidth: bankDetailsMaxWidth });
    bankDetailsY -= drawTextAndMeasureHeight('Account Name: Mahadev Filaments', leftMargin, bankDetailsY, { size: 10, spacingAfter: 3, maxWidth: bankDetailsMaxWidth });
    bankDetailsY -= drawTextAndMeasureHeight('Account No.: 10062001003372', leftMargin, bankDetailsY, { size: 10, spacingAfter: 3, maxWidth: bankDetailsMaxWidth });
    bankDetailsY -= drawTextAndMeasureHeight('IFSC Code: PMEC0100607', leftMargin, bankDetailsY, { size: 10, spacingAfter: 10, maxWidth: bankDetailsMaxWidth });

    // Declaration and Signatory (Right)
    let declarationTitleY = bankDetailsY;
    const forCompanyText = 'For MAHADEV FILAMENTS';
    const forCompanyFontSize = 11;
    const forCompanyOptions = { font: boldFont, size: forCompanyFontSize, spacingAfter: 3, align: 'right' };
    const forCompanyWidth = boldFont.widthOfTextAtSize(forCompanyText, forCompanyFontSize);

    const declarationTitleHeight = drawTextAndMeasureHeight('Declaration:', leftMargin, declarationTitleY, { font: boldFont, size: 12, spacingAfter: 4 });
    drawTextAndMeasureHeight(forCompanyText, rightMargin - forCompanyWidth, declarationTitleY, forCompanyOptions);
    bankDetailsY -= declarationTitleHeight;

    const declarationText = [
      '1. Interest @ 2% per day is charged on bills if not paid within 30 days.',
      '2. All payments must be made by payee\'s A/C Cheque/Draft.',
      '3. No claims will be entertained unless notified in writing within three days from the date of this bill.',
      'Subject to Surat jurisdiction.'
    ];

    let lastDeclarationLineY = bankDetailsY;
    declarationText.forEach((line, index) => {
      const currentLineHeight = drawTextAndMeasureHeight(line, leftMargin, bankDetailsY, { size: 9, spacingAfter: 3, maxWidth: contentWidth * 0.6 });
      bankDetailsY -= currentLineHeight;
      if (index === declarationText.length - 1) {
        lastDeclarationLineY = bankDetailsY + currentLineHeight - 3;
      }
    });

    // "Authorised Signatory" aligned with last declaration line
    const authSignText = 'Authorised Signatory';
    const authSignFontSize = 9;
    const authSignOptions = { font: font, size: authSignFontSize, spacingAfter: 0, align: 'right' };
    const authSignWidth = font.widthOfTextAtSize(authSignText, authSignFontSize);
    drawTextAndMeasureHeight(authSignText, rightMargin - authSignWidth, lastDeclarationLineY, authSignOptions);

    // Contact Info at Bottom
    y = 30;
    page.drawRectangle({
      x: leftMargin,
      y: y - 8,
      width: contentWidth,
      height: 20,
      color: rgb(0.1, 0.3, 0.5),
      opacity: 0.1
    });
    const contactText = 'Contact: Bharat Radiya | Phone: 9825492079 | Email: mahadevfilaments@gmail.com';
    const contactTextWidth = font.widthOfTextAtSize(contactText, 9);
    drawTextAndMeasureHeight(contactText, leftMargin + (contentWidth - contactTextWidth) / 2, y, { size: 9, spacingAfter: 0, color: rgb(0.3, 0.3, 0.3) });

    // Save PDF to file
    const pdfBytes = await pdfDoc.save();
    const outputDir = path.join(__dirname, '..', 'generated_debit_notes', 'pdf');
    await fsPromises.mkdir(outputDir, { recursive: true });
    const pdfFileName = `DebitNote-${debitNote.debitNoteNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const pdfFilePath = path.join(outputDir, pdfFileName);

    await fsPromises.writeFile(pdfFilePath, pdfBytes);
    debitNote.pdfFilePath = pdfFilePath;
    await debitNote.save();

    log(`PDF generated for debit note ${debitNote.debitNoteNumber}: ${pdfFilePath}`, 'info');

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
    const stats = await fsPromises.stat(pdfFilePath);
    res.setHeader('Content-Length', stats.size);

    // Stream the file
    const fileStream = fs.createReadStream(pdfFilePath);
    fileStream.pipe(res);

    fileStream.on('error', (streamErr) => {
      log(`Error streaming PDF file for debit note ${debitNote.debitNoteNumber}: ${streamErr.message}`, 'error');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to stream PDF file.' });
      }
    });

    fileStream.on('end', () => {
      log(`PDF file streamed successfully for debit note ${debitNote.debitNoteNumber}`, 'info');
    });

  } catch (error) {
    log(`Error generating PDF for debit note ID ${debitNoteId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error while generating PDF debit note.' });
    }
  }
};

// @desc    Get all debit notes
// @route   GET /api/debit-notes
// @access  Private/Admin
const getDebitNotes = async (req, res) => {
 const { companyId, startDate, endDate } = req.query;
  const query = {};

  if (companyId) query.company = companyId;

  if (startDate && endDate) {
    query.issueDate = { 
      $gte: new Date(startDate), 
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
    };
  } else if (startDate) {
    query.issueDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.issueDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  try {
    const debitNotes = await DebitNote.find(query)
      .populate('company', 'name gstNumber')
      .populate('originalBill', 'billNumber billDate')
      .populate('createdBy', 'username email')
      .sort({ issueDate: -1, createdAt: -1 });

    log(`Fetched debit notes with query ${JSON.stringify(query)} by ${req.user.email}`, 'info');
    res.json(debitNotes);
  } catch (error) {
    log(`Error fetching debit notes: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching debit notes.' });
  }
};

// @desc    Get a single debit note by ID
// @route   GET /api/debit-notes/:id
// @access  Private/Admin
const getDebitNoteById = async (req, res) => {
  try {
    const debitNote = await DebitNote.findById(req.params.id)
      .populate('company', 'name address gstNumber mobileNumber')
      .populate('originalBill', 'billNumber billDate totalAmount')
      .populate('createdBy', 'username email');

    if (!debitNote) {
      log(`Debit note not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Debit note not found' });
    }
    log(`Fetched debit note by ID: ${debitNote.debitNoteNumber} by ${req.user.email}`, 'info');
    res.json(debitNote);
  } catch (error) {
    log(`Error fetching debit note ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching debit note.' });
  }
};

// @desc    Update a debit note
// @route   PUT /api/debit-notes/:id
// @access  Private/Admin
const updateDebitNote = async (req, res) => {
  const debitNoteId = req.params.id;
  const {
    paymentDate,
    overrideInterestRate,
    overrideCgstPercentage,
    overrideSgstPercentage,
    overrideTdsPercentage,
    amountInWords
  } = req.body;

  try {
    const debitNote = await DebitNote.findById(debitNoteId);
    if (!debitNote) {
      log(`Debit note update failed: Not found with ID: ${debitNoteId}`, 'warn');
      return res.status(404).json({ message: 'Debit note not found' });
    }

    // Update fields that trigger recalculation
    if (paymentDate !== undefined) debitNote.paymentDate = new Date(paymentDate);
    if (overrideInterestRate !== undefined) debitNote.interestRatePerDay = overrideInterestRate;
    if (overrideCgstPercentage !== undefined) debitNote.cgstPercentage = overrideCgstPercentage;
    if (overrideSgstPercentage !== undefined) debitNote.sgstPercentage = overrideSgstPercentage;
    if (overrideTdsPercentage !== undefined) debitNote.tdsPercentage = overrideTdsPercentage;
    if (amountInWords !== undefined) debitNote.amountInWords = amountInWords;

    // The pre-save hook will recalculate all amounts based on the updated fields
    const updatedDebitNote = await debitNote.save();

    log(`Debit note updated: ${updatedDebitNote.debitNoteNumber} by ${req.user.email}`, 'info');
    res.json(updatedDebitNote);

  } catch (error) {
    log(`Error updating debit note ID ${debitNoteId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating debit note.' });
  }
};

// @desc    Delete a debit note
// @route   DELETE /api/debit-notes/:id
// @access  Private/Admin
const deleteDebitNote = async (req, res) => {
  try {
    const debitNote = await DebitNote.findById(req.params.id);
    if (!debitNote) {
      log(`Debit note deletion failed: Not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Debit note not found' });
    }

    // Delete associated files if they exist
    try {
      if (debitNote.excelFilePath) {
        await fsPromises.unlink(debitNote.excelFilePath);
      }
      if (debitNote.pdfFilePath) {
        await fsPromises.unlink(debitNote.pdfFilePath);
      }
    } catch (fileError) {
      log(`Error deleting files for debit note ${debitNote.debitNoteNumber}: ${fileError.message}`, 'warn');
    }

    await debitNote.deleteOne();
    log(`Debit note deleted: ${debitNote.debitNoteNumber} by ${req.user.email}`, 'info');
    res.json({ message: 'Debit note removed successfully.' });
  } catch (error) {
    log(`Error deleting debit note ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while deleting debit note.' });
  }
};

// @desc    Get debit notes for a specific bill
// @route   GET /api/bills/:billId/debit-notes
// @access  Private/Admin
const getDebitNotesForBill = async (req, res) => {
  try {
    const debitNotes = await DebitNote.find({ originalBill: req.params.billId })
      .populate('company', 'name gstNumber')
      .populate('createdBy', 'username email')
      .sort({ issueDate: -1 });

    log(`Fetched debit notes for bill ID ${req.params.billId} by ${req.user.email}`, 'info');
    res.json(debitNotes);
  } catch (error) {
    log(`Error fetching debit notes for bill ID ${req.params.billId}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching debit notes for bill.' });
  }
};

// @desc    Check if a bill has late payment and can have a debit note
// @route   GET /api/bills/:billId/can-have-debit-note
// @access  Private/Admin
const checkBillCanHaveDebitNote = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId);
    if (!bill) {
      log(`Bill not found with ID: ${req.params.billId}`, 'warn');
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Check if bill is fully paid
    if (bill.totalAmount > bill.totalPaidAmount) {
      return res.json({ canHaveDebitNote: false, reason: 'Bill is not fully paid yet' });
    }

    // Check if payment was late
    const dueDate = new Date(bill.billDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const lastPaymentDate = bill.paymentRecords.reduce((latest, record) => {
      const recordDate = new Date(record.paymentDate);
      return recordDate > latest ? recordDate : latest;
    }, new Date(0));

    const lateDays = Math.max(0, Math.floor((lastPaymentDate - dueDate) / (1000 * 60 * 60 * 24)));
    if (lateDays <= 0) {
      return res.json({ canHaveDebitNote: false, reason: 'Payment was not late' });
    }

    // Check if debit note already exists for this late payment
    const existingDebitNote = await DebitNote.findOne({ 
      originalBill: bill._id,
      paymentDate: { $gte: dueDate }
    });

    if (existingDebitNote) {
      return res.json({ 
        canHaveDebitNote: false, 
        reason: 'Debit note already exists for this late payment',
        existingDebitNoteId: existingDebitNote._id
      });
    }

    res.json({ 
      canHaveDebitNote: true,
      dueDate,
      lastPaymentDate,
      lateDays,
      principalAmount: bill.totalAmount - bill.totalPaidAmount
    });

  } catch (error) {
    log(`Error checking if bill can have debit note ID ${req.params.billId}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while checking debit note eligibility.' });
  }
};

module.exports = {
  createDebitNote,
  getDebitNotes,
  getDebitNoteById,
  updateDebitNote,
  deleteDebitNote,
  generateDebitNoteExcel,
  generateDebitNotePdf,
  getDebitNotesForBill,
  checkBillCanHaveDebitNote
};