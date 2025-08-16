const Challan = require('../models/Challan');
const Company = require('../models/Company');
const Settings = require('../models/Settings');
const Bill = require('../models/Bill');
const { log } = require('../middleware/logger');
const Box = require('../models/Box');
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const ExcelJS = require('exceljs');

// Helper function to calculate challan totals
const calculateChallanTotals = (boxDetails) => {
  const totalNetWeight = boxDetails.reduce((acc, box) => acc + box.netWeight, 0);
  const totalCops = boxDetails.reduce((acc, box) => acc + box.cops, 0);
  return {
    totalNetWeight: parseFloat(totalNetWeight.toFixed(2)),
    totalCops,
  };
};

// @desc    Create a new challan
// @route   POST /api/challans
// @access  Private/Admin
const createChallan = async (req, res) => {
  const {
    challanNumber,
    challanDate,
    companyId,
    descriptionOfGoods,
    broker = 'direct',
    boxDetails,
    boxIds = [],
  } = req.body;

  if (!challanNumber || !companyId || !descriptionOfGoods || 
      (!boxDetails && !boxIds.length)) {
    return res.status(400).json({ 
      message: 'Missing required fields: challanNumber, companyId, descriptionOfGoods, and either boxDetails or boxIds.' 
    });
  }

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      log(`Challan creation failed: Company not found - ID: ${companyId}`, 'warn');
      return res.status(404).json({ message: 'Company not found.' });
    }

    const settings = await Settings.getSettings();
    const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
    if (!validDescription) {
      return res.status(400).json({ message: 'Description of Goods must be from predefined settings.' });
    }

    const companyDetailsSnapshot = {
      name: company.name,
      address: company.address,
      gstNumber: company.gstNumber,
    };

    let finalBoxDetails = [];
    
    if (boxIds && boxIds.length > 0) {
      const boxes = await Box.find({ _id: { $in: boxIds }, isUsed: false });
      
      if (boxes.length !== boxIds.length) {
        return res.status(400).json({ message: 'One or more boxes are already used or not found.' });
      }

      finalBoxDetails = boxes.map(box => ({
        boxNumber: box.boxNumber,
        netWeight: box.netWeight,
        cops: box.cops,
      }));

      await Box.updateMany(
        { _id: { $in: boxIds } },
        { $set: { isUsed: true } }
      );
    } 
    else if (boxDetails && Array.isArray(boxDetails) && boxDetails.length > 0) {
      finalBoxDetails = boxDetails.map(box => ({
        boxNumber: box.boxNumber,
        netWeight: box.netWeight,
        cops: box.cops,
      }));
    }

    const calculated = calculateChallanTotals(finalBoxDetails);

    const newChallan = new Challan({
      challanNumber,
      challanDate: challanDate ? new Date(challanDate) : new Date(),
      company: companyId,
      companyDetailsSnapshot,
      descriptionOfGoods,
      broker,
      boxDetails: finalBoxDetails,
      totalNetWeight: calculated.totalNetWeight,
      totalCops: calculated.totalCops,
      createdBy: req.user._id,
      isUsed: false,
    });

    const savedChallan = await newChallan.save();
    log(`Challan created successfully: ${savedChallan.challanNumber} by ${req.user.email}`, 'info');
    res.status(201).json(savedChallan);
  } catch (error) {
    log(`Error creating challan: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      return res.status(400).json({ message: `Challan number '${challanNumber}' already exists.` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating challan.' });
  }
};

// @desc    Get all challans (with optional filters)
// @route   GET /api/challans
// @access  Private/Admin
const getChallans = async (req, res) => {
  const { companyId, startDate, endDate } = req.query;
  const query = {};

  if (companyId) query.company = companyId;
  if (startDate && endDate) {
    query.challanDate = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  } else if (startDate) {
    query.challanDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.challanDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  try {
    const challans = await Challan.find(query)
      .populate('company', 'name gstNumber')
      .populate('createdBy', 'username email')
      .sort({ challanDate: -1, createdAt: -1 });

    log(`Fetched challans with query ${JSON.stringify(query)} by ${req.user.email}`, 'info');
    res.json(challans);
  } catch (error) {
    log(`Error fetching challans: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching challans.' });
  }
};

// @desc    Get all available challans for a company (not used in any bill)
// @route   GET /api/challans?companyId=:companyId
// @access  Private/Admin
const getChallansByCompany = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      log('Company ID is required for fetching challans', 'warn');
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Fetch challans for the company that are not used
    const usedChallans = await Bill.find({ company: companyId, challan: { $ne: null } }).distinct('challan');
    const challans = await Challan.find({
      company: companyId,
      isUsed: false,
      _id: { $nin: usedChallans }
    })
      .populate('company', 'name address gstNumber')
      .populate('createdBy', 'username email')
      .select('challanNumber challanDate descriptionOfGoods totalNetWeight totalCops');

    if (!challans.length) {
      log(`No available challans found for company ID: ${companyId}`, 'info');
      return res.status(200).json([]);
    }

    log(`Fetched ${challans.length} available challans for company ID: ${companyId} by ${req.user.email}`, 'info');
    res.json(challans);
  } catch (error) {
    log(`Error fetching challans for company ID ${req.query.companyId}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching challans.' });
  }
};

// @desc    Get a single challan by ID
// @route   GET /api/challans/:id
// @access  Private/Admin
const getChallanById = async (req, res) => {
  try {
    const challan = await Challan.findById(req.params.id)
      .populate('company', 'name address gstNumber')
      .populate('createdBy', 'username email');

    if (!challan) {
      log(`Challan not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Challan not found' });
    }
    log(`Fetched challan by ID: ${challan.challanNumber} by ${req.user.email}`, 'info');
    res.json(challan);
  } catch (error) {
    log(`Error fetching challan ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching challan.' });
  }
};

// @desc    Update a challan
// @route   PUT /api/challans/:id
// @access  Private/Admin
const updateChallan = async (req, res) => {
  const challanId = req.params.id;
  const { challanNumber, challanDate, companyId, descriptionOfGoods, broker, boxDetails } = req.body;

  try {
    const challan = await Challan.findById(challanId);
    if (!challan) {
      log(`Challan update failed: Not found with ID: ${challanId}`, 'warn');
      return res.status(404).json({ message: 'Challan not found' });
    }

    if (challan.isUsed) {
      return res.status(400).json({ message: 'Cannot modify a challan that is used in a bill.' });
    }

    if (challanNumber && challanNumber !== challan.challanNumber) {
      const existingChallan = await Challan.findOne({ challanNumber });
      if (existingChallan && existingChallan._id.toString() !== challanId) {
        return res.status(400).json({ message: `Challan number '${challanNumber}' already exists.` });
      }
      challan.challanNumber = challanNumber;
    }
    if (challanDate) challan.challanDate = new Date(challanDate);
    if (broker !== undefined) challan.broker = broker;

    if (companyId && companyId !== challan.company.toString()) {
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found.' });
      }
      challan.company = companyId;
      challan.companyDetailsSnapshot = {
        name: company.name,
        address: company.address,
        gstNumber: company.gstNumber,
      };
    }

    if (descriptionOfGoods) {
      const settings = await Settings.getSettings();
      const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
      if (!validDescription) {
        return res.status(400).json({ message: 'Description of Goods must be from predefined settings.' });
      }
      challan.descriptionOfGoods = descriptionOfGoods;
    }

    if (boxDetails && Array.isArray(boxDetails)) {
      challan.boxDetails = boxDetails;
      const calculated = calculateChallanTotals(boxDetails);
      challan.totalNetWeight = calculated.totalNetWeight;
      challan.totalCops = calculated.totalCops;
    }

    const updatedChallan = await challan.save();
    log(`Challan updated: ${updatedChallan.challanNumber} by ${req.user.email}`, 'info');
    res.json(updatedChallan);
  } catch (error) {
    log(`Error updating challan ID ${challanId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      return res.status(400).json({ message: `Challan number '${challanNumber}' already exists.` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating challan.' });
  }
};

// @desc    Delete a challan
// @route   DELETE /api/challans/:id
// @access  Private/Admin
const deleteChallan = async (req, res) => {
  try {
    const challan = await Challan.findById(req.params.id);
    if (!challan) {
      log(`Challan deletion failed: Not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Challan not found' });
    }

    if (challan.isUsed) {
      return res.status(400).json({ message: 'Cannot delete challan; it is used in a bill.' });
    }

    await challan.deleteOne();
    log(`Challan deleted: ${challan.challanNumber} by ${req.user.email}`, 'info');
    res.json({ message: 'Challan removed successfully.' });
  } catch (error) {
    log(`Error deleting challan ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while deleting challan.' });
  }
};

// @desc    Generate PDF for a challan
// @route   GET /api/challans/:id/pdf
// @access  Private/Admin
// const generateChallanPdf = async (req, res) => {
//   const challanId = req.params.id;
//   try {
//     const challan = await Challan.findById(challanId).populate('company');
//     if (!challan) {
//       log(`PDF generation failed: Challan not found - ID: ${challanId}`, 'warn');
//       return res.status(404).json({ message: 'Challan not found.' });
//     }

//     const pdfDoc = await PDFDocument.create();
//     let page = pdfDoc.addPage([595, 842]); // A4 size in points
//     const { width, height } = page.getSize();
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     // Configuration constants
//     let y = height - 40; // Adjusted top margin
//     const leftMargin = 40;
//     const rightMargin = width - 40;
//     const contentWidth = rightMargin - leftMargin;

//     const CONFIG = {
//       leftMargin: 30,
//       rightMargin: width - 30,
//       contentWidth: width - 60,
//       initialY: height - 40,
//       lineSpacing: 12,
//       smallLineSpacing: 8,
//       itemLineSpacing: 10,
//       itemFontSize: 7,
//       headerFontSize: 8,
//       textFontSize: 9,
//       titleFontSize: 25,
//       columnGap: 10, // Reduced column gap to allow more space for columns
//       boxPerColumn: 25,
//       columnsPerPage: 3,
//       detailsRightMargin: width - 200
//     };

//     const drawTextAndMeasureHeight = (text, xPos, currentY, options = {}) => {
//       const textToDraw = String(text ?? '').replace(/₹/g, 'INR ');
//       const FONT_TO_USE = options.font || font;
//       const SIZE = options.size || CONFIG.textFontSize;
//       const COLOR = options.color || rgb(0, 0, 0);
//       const LINE_HEIGHT = options.lineHeight || SIZE * 1.2;
//       const MAX_WIDTH = options.maxWidth;
//       const SPACING_AFTER = options.spacingAfter !== undefined ? options.spacingAfter : 2;
//       const ALIGN = options.align || 'left';

//       let actualXPos = xPos;
//       if (ALIGN === 'center' && MAX_WIDTH) {
//         const textWidth = FONT_TO_USE.widthOfTextAtSize(textToDraw, SIZE);
//         actualXPos = xPos + (MAX_WIDTH - textWidth) / 2;
//       } else if (ALIGN === 'center') {
//         const textWidth = FONT_TO_USE.widthOfTextAtSize(textToDraw, SIZE);
//         actualXPos = CONFIG.leftMargin + (CONFIG.contentWidth - textWidth) / 2;
//       }

//       page.drawText(textToDraw, {
//         x: actualXPos,
//         y: currentY,
//         font: FONT_TO_USE,
//         size: SIZE,
//         color: COLOR,
//         lineHeight: LINE_HEIGHT,
//         maxWidth: MAX_WIDTH,
//         wordBreaks: [' ', '-', '/'],
//       });

//       let numLines = 1;
//       if (MAX_WIDTH && FONT_TO_USE.widthOfTextAtSize(textToDraw.replace(/\n/g, ' '), SIZE) > MAX_WIDTH) {
//         const segments = textToDraw.split('\n');
//         numLines = 0;
//         segments.forEach(segment => {
//           if (segment.trim() === '') {
//             numLines++;
//             return;
//           }
//           let currentLine = '';
//           let linesForSegment = 1;
//           const words = segment.split(' ');
//           for (const word of words) {
//             const testLine = currentLine ? `${currentLine} ${word}` : word;
//             if (FONT_TO_USE.widthOfTextAtSize(testLine, SIZE) > MAX_WIDTH) {
//               linesForSegment++;
//               currentLine = word;
//             } else {
//               currentLine = testLine;
//             }
//           }
//           numLines += linesForSegment;
//         });
//         if (textToDraw.endsWith('\n') && segments[segments.length - 1].trim() !== '') numLines++;
//         if (numLines === 0 && textToDraw.trim() !== '') numLines = 1;
//       } else {
//         numLines = textToDraw.split('\n').length;
//         if (numLines === 0 && textToDraw.trim() !== '') numLines = 1;
//       }

//       const textHeight = textToDraw.trim() === '' ? 0 : numLines * LINE_HEIGHT;
//       return textHeight + SPACING_AFTER;
//     };

//     let currentY = y;

//     // Line 1: "SHREE GANESHAY NAMAH" (Center) and "TAX INVOICE" (Right)
//     const topHeaderTextY = currentY;
//     const shreeGaneshText = 'SHREE GANESHAY NAMAH';
//     const shreeGaneshFontSize = 10;
//     const shreeGaneshOptions = { font: boldFont, size: shreeGaneshFontSize, align: 'center', color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
//     const shreeGaneshHeight = drawTextAndMeasureHeight(shreeGaneshText, leftMargin, topHeaderTextY, shreeGaneshOptions);

//     const taxInvoiceText = 'TEXT CHALLAN';
//     const taxInvoiceFontSize = 14;
//     const taxInvoiceWidth = boldFont.widthOfTextAtSize(taxInvoiceText, taxInvoiceFontSize);
//     const taxInvoiceOptions = { font: boldFont, size: taxInvoiceFontSize, color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
//     const taxInvoiceHeight = drawTextAndMeasureHeight(taxInvoiceText, rightMargin - taxInvoiceWidth, topHeaderTextY, taxInvoiceOptions);

//     currentY -= Math.max(shreeGaneshHeight, taxInvoiceHeight) + 18;

//     // Company Name - Centered
//     const companyNameText = 'MAHADEV FILAMENTS';
//     const companyNameFontSize = 25;
//     currentY -= drawTextAndMeasureHeight(companyNameText, leftMargin, currentY, { font: boldFont, size: companyNameFontSize, align: 'center', color: rgb(0.1, 0.3, 0.5) });

//     // Address - Centered
//     const addressText = 'BLOCK NO - 15, 1ST FLOOR, AMBIKA VIBHAG - 2, NEAR NAVJIVAN CIRCLE, U.M. ROAD, SURAT - 395007';
//     const addressFontSize = 9;
//     currentY -= drawTextAndMeasureHeight(addressText, leftMargin, currentY + 14, { size: addressFontSize, align: 'center', maxWidth: contentWidth, spacingAfter: 4 });

//     // GSTIN - Centered
//     const gstinText = 'GSTIN: 24AABEFM9966E1ZZ';
//     const gstinFontSize = 10;
//     currentY -= drawTextAndMeasureHeight(gstinText, leftMargin, currentY + 14, { size: gstinFontSize, align: 'center', spacingAfter: 15 });

//     y = currentY;

//     // Consignee and Challan Details Section
//     const clientName = challan.companyDetailsSnapshot?.name || challan.company?.name || 'N/A';
//     const clientAddress = challan.companyDetailsSnapshot?.address || challan.company?.address || 'N/A';
//     const clientGstin = challan.companyDetailsSnapshot?.gstNumber || challan.company?.gstNumber || 'N/A';

//     // Consignee Section (left side)
//     const consigneeRectY = y - 84;
//     if (!isNaN(consigneeRectY)) {
//       page.drawRectangle({
//         x: CONFIG.leftMargin,
//         y: consigneeRectY,
//         width: CONFIG.contentWidth / 2 + 20,
//         height: 100,
//         color: rgb(0.95, 0.95, 0.95),
//         opacity: 0.5,
//       });
//     }

//     let consigneeY = y;
//     consigneeY -= drawTextAndMeasureHeight(`Consignee:`, CONFIG.leftMargin + 5, consigneeY, { 
//       font: boldFont, 
//       size: 11, 
//       spacingAfter: 4 
//     });
//     consigneeY -= drawTextAndMeasureHeight(clientName, CONFIG.leftMargin + 5, consigneeY, { 
//       font: boldFont, 
//       size: 10, 
//       spacingAfter: 4, 
//       maxWidth: CONFIG.contentWidth / 2 
//     });
//     consigneeY -= drawTextAndMeasureHeight(clientAddress, CONFIG.leftMargin + 5, consigneeY, { 
//       size: CONFIG.textFontSize, 
//       spacingAfter: 4, 
//       maxWidth: CONFIG.contentWidth / 2 
//     });
//     consigneeY -= drawTextAndMeasureHeight(`GSTIN: ${clientGstin}`, CONFIG.leftMargin + 5, consigneeY, { 
//       font: boldFont, 
//       size: CONFIG.textFontSize, 
//       spacingAfter: 4, 
//       maxWidth: CONFIG.contentWidth / 2 
//     });

//     // Challan Details (right side)
//     let detailsY = y;
//     detailsY -= drawTextAndMeasureHeight(`Challan No.: ${challan.challanNumber || 'N/A'}`, CONFIG.detailsRightMargin, detailsY, { 
//       size: CONFIG.textFontSize, 
//       spacingAfter: 4,
//       align: 'right'
//     });
//     detailsY -= drawTextAndMeasureHeight(`Date: ${new Date(challan.challanDate).toLocaleDateString('en-IN')}`, CONFIG.detailsRightMargin, detailsY, { 
//       size: CONFIG.textFontSize, 
//       spacingAfter: 4,
//       align: 'right'
//     });
//     detailsY -= drawTextAndMeasureHeight(`Description: ${challan.descriptionOfGoods || 'N/A'}`, CONFIG.detailsRightMargin, detailsY, { 
//       size: CONFIG.textFontSize, 
//       spacingAfter: 4,
//       align: 'right',
//       maxWidth: 180
//     });
//     detailsY -= drawTextAndMeasureHeight(`Broker: ${challan.broker || 'direct'}`, CONFIG.detailsRightMargin, detailsY, { 
//       size: CONFIG.textFontSize, 
//       spacingAfter: 10,
//       align: 'right'
//     });


//     // Use the lower of the two Y positions to continue
//     y = Math.min(consigneeY, detailsY) - CONFIG.lineSpacing;

//     // Calculate column positions and widths
//     const columnWidth = (CONFIG.contentWidth - (CONFIG.columnGap * (CONFIG.columnsPerPage - 1))) / CONFIG.columnsPerPage;
//     const columnPositions = Array.from({ length: CONFIG.columnsPerPage }, (_, i) => 
//       CONFIG.leftMargin + (i * (columnWidth + CONFIG.columnGap))
//     );

//     // Draw table headers for each column
//     const headerY = y - 22;
//     if (!isNaN(headerY)) {
//       columnPositions.forEach(colX => {
//         page.drawRectangle({
//           x: colX,
//           y: headerY,
//           width: columnWidth,
//           height: 20,
//           color: rgb(0.1, 0.3, 0.5),
//           opacity: 0.1,
//         });
//       });
//     }
    
//     columnPositions.forEach(colX => {
//       const headerOptions = { 
//         font: boldFont, 
//         size: CONFIG.headerFontSize, 
//         spacingAfter: 0, 
//         color: rgb(0.1, 0.1, 0.1) 
//       };
      
//       const colHeaderX = colX + 5;
//       drawTextAndMeasureHeight('Sr No.', colHeaderX, y, headerOptions);
//       drawTextAndMeasureHeight('Box No.', colHeaderX + 30, y, headerOptions);
//       drawTextAndMeasureHeight('Weight', colHeaderX + 80, y, headerOptions); // Increased gap to Weight
//       drawTextAndMeasureHeight('Cops', colHeaderX + 110, y, headerOptions); // Adjusted to reduce gap to next Sr No.
//     });

//     y -= CONFIG.smallLineSpacing;
//     page.drawLine({ 
//       start: { x: CONFIG.leftMargin, y: y }, 
//       end: { x: CONFIG.rightMargin, y: y }, 
//       thickness: 1, 
//       color: rgb(0.2, 0.2, 0.2) 
//     });
//     y -= CONFIG.itemLineSpacing;

//     // Draw items in multiple columns (25 per column)
//     const totalItems = challan.boxDetails.length;
//     const totalColumnsNeeded = Math.ceil(totalItems / CONFIG.boxPerColumn);
//     let currentColumn = 0;
//     let currentItem = 0;
//     let currentColumnY = y;

//     while (currentItem < totalItems) {
//       if (currentColumn >= CONFIG.columnsPerPage) {
//         // Move to next page
//         page = pdfDoc.addPage([595, 842]);
//         currentColumn = 0;
//         currentColumnY = height - 40;
        
//         // Draw headers on new page
//         const newHeaderY = currentColumnY - 22;
//         if (!isNaN(newHeaderY)) {
//           columnPositions.forEach(colX => {
//             page.drawRectangle({
//               x: colX,
//               y: newHeaderY,
//               width: columnWidth,
//               height: 20,
//               color: rgb(0.1, 0.3, 0.5),
//               opacity: 0.1,
//             });
//           });
//         }
        
//         columnPositions.forEach(colX => {
//           const headerOptions = { 
//             font: boldFont, 
//             size: CONFIG.headerFontSize, 
//             spacingAfter: 0, 
//             color: rgb(0.1, 0.1, 0.1) 
//           };
          
//           const colHeaderX = colX + 5;
//           drawTextAndMeasureHeight('Sr No.', colHeaderX, currentColumnY, headerOptions);
//           drawTextAndMeasureHeight('Box No.', colHeaderX + 30, currentColumnY, headerOptions);
//           drawTextAndMeasureHeight('Weight', colHeaderX + 80, currentColumnY, headerOptions); // Increased gap to exiled
//           drawTextAndMeasureHeight('Cops', colHeaderX + 110, currentColumnY, headerOptions); // Adjusted to reduce gap to next Sr No.
//         });
        
//         currentColumnY -= CONFIG.smallLineSpacing;
//         page.drawLine({ 
//           start: { x: CONFIG.leftMargin, y: currentColumnY }, 
//           end: { x: CONFIG.rightMargin, y: currentColumnY }, 
//           thickness: 1, 
//           color: rgb(0.2, 0.2, 0.2) 
//         });
//         currentColumnY -= CONFIG.itemLineSpacing;
//       }

//       const itemsInThisColumn = Math.min(CONFIG.boxPerColumn, totalItems - currentItem);
//       let columnY = currentColumnY;
      
//       for (let i = 0; i < itemsInThisColumn; i++) {
//         const box = challan.boxDetails[currentItem];
//         const colX = columnPositions[currentColumn];
        
//         const rectY = columnY - 5;
//         if (!isNaN(rectY)) {
//           if (i % 2 === 0) {
//             page.drawRectangle({
//               x: colX,
//               y: rectY,
//               width: columnWidth,
//               height: -8,
//               color: rgb(0.98, 0.98, 0.98),
//               opacity: 0.5,
//             });
//           }
//         }

//         const itemRowOptions = { 
//           size: CONFIG.itemFontSize, 
//           spacingAfter: 0 
//         };
        
//         const colItemX = colX + 5;
//         drawTextAndMeasureHeight(String(currentItem + 1), colItemX, columnY, itemRowOptions);
//         drawTextAndMeasureHeight(box.boxNumber, colItemX + 30, columnY, itemRowOptions);
//         drawTextAndMeasureHeight(String(box.netWeight.toFixed(2)), colItemX + 80, columnY, itemRowOptions); // Increased gap to Weight
//         drawTextAndMeasureHeight(String(box.cops), colItemX + 110, columnY, itemRowOptions); // Adjusted to reduce gap to next Sr No.
        
//         columnY -= CONFIG.itemLineSpacing;
//         currentItem++;
//       }
      
//       currentColumn++;
//       currentColumnY = Math.min(currentColumnY, columnY);
//     }

//     // Totals section with adjusted Y position
//     const totalsY = currentColumnY - CONFIG.lineSpacing * 25;
//     if (!isNaN(totalsY)) {
//       page.drawLine({ 
//         start: { x: CONFIG.leftMargin, y: totalsY }, 
//         end: { x: CONFIG.rightMargin, y: totalsY }, 
//         thickness: 1.5, 
//         color: rgb(0.2, 0.2, 0.2) 
//       });
//     }

//     let totalsTextY = totalsY - CONFIG.smallLineSpacing;
//     if (!isNaN(totalsTextY)) {
//       totalsTextY -= drawTextAndMeasureHeight(`Total Cops: ${challan.totalCops}`, CONFIG.leftMargin, totalsTextY, { 
//         font: boldFont, 
//         size: CONFIG.textFontSize, 
//         spacingAfter: 4 
//       });
//       totalsTextY -= drawTextAndMeasureHeight(`Total Weight: ${challan.totalNetWeight.toFixed(2)}`, CONFIG.leftMargin, totalsTextY, { 
//         font: boldFont, 
//         size: CONFIG.textFontSize, 
//         spacingAfter: 10 
//       });
//     }

//     // Conditions of Sale and Declaration
//     const conditionsY = totalsTextY - CONFIG.lineSpacing;
//     if (!isNaN(conditionsY)) {
//       page.drawLine({ 
//         start: { x: CONFIG.leftMargin, y: conditionsY }, 
//         end: { x: CONFIG.rightMargin, y: conditionsY }, 
//         thickness: 1, 
//         color: rgb(0.2, 0.2, 0.2) 
//       });

//       let declarationY = conditionsY - CONFIG.smallLineSpacing;
//       declarationY -= drawTextAndMeasureHeight('Conditions of Sale:', CONFIG.leftMargin, declarationY, { 
//         font: boldFont, 
//         size: CONFIG.textFontSize, 
//         spacingAfter: 4 
//       });
//       declarationY -= drawTextAndMeasureHeight('Complaint regarding Goods Should be reported within 24 hours on the receipt of goods.', CONFIG.leftMargin, declarationY, { 
//         size: CONFIG.textFontSize, 
//         spacingAfter: 8, 
//         maxWidth: CONFIG.contentWidth 
//       });

//       // Company Stamp/Signature
//       const stampY = declarationY - 20;
//       if (!isNaN(stampY)) {
//         drawTextAndMeasureHeight('For MAHADEV FILAMENTS', CONFIG.rightMargin - 150, stampY, { 
//           font: boldFont, 
//           size: CONFIG.textFontSize, 
//           spacingAfter: 0 
//         });
//       }
//     }

//     // Contact Info
//     const contactY = 30;
//     if (!isNaN(contactY)) {
//       page.drawRectangle({
//         x: CONFIG.leftMargin,
//         y: contactY - 8,
//         width: CONFIG.contentWidth,
//         height: 20,
//         color: rgb(0.1, 0.3, 0.5),
//         opacity: 0.1,
//       });
//       const contactText = 'Contact: Bharat Radiya | Phone: 9825492079 | Email: mahadevfilaments@gmail.com';
//       const contactTextWidth = font.widthOfTextAtSize(contactText, CONFIG.textFontSize);
//       drawTextAndMeasureHeight(contactText, CONFIG.leftMargin + (CONFIG.contentWidth - contactTextWidth) / 2, contactY, { 
//         size: CONFIG.textFontSize, 
//         spacingAfter: 0, 
//         color: rgb(0.3, 0.3, 0.3) 
//       });
//     }

//     // Save PDF
//     const pdfBytes = await pdfDoc.save();
//     const outputDir = path.join(__dirname, '..', 'generated_challans', 'pdf');
//     await fsPromises.mkdir(outputDir, { recursive: true });

//     const pdfFileName = `Challan-${challan.challanNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
//     const pdfFilePath = path.join(outputDir, pdfFileName);

//     await fsPromises.writeFile(pdfFilePath, pdfBytes);
//     challan.pdfFilePath = pdfFilePath;
//     await challan.save();

//     log(`PDF generated for challan ${challan.challanNumber}: ${pdfFilePath}`, 'info');

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);

//     const fileStream = fs.createReadStream(pdfFilePath);
//     fileStream.pipe(res);

//     fileStream.on('error', (streamErr) => {
//       log(`Error streaming PDF file for challan ${challan.challanNumber}: ${streamErr.message}`, 'error');
//       if (!res.headersSent) {
//         res.status(500).json({ message: 'Failed to stream PDF file.' });
//       }
//     });

//     fileStream.on('end', () => {
//       log(`PDF file streamed for challan ${challan.challanNumber}`, 'info');
//       res.end();
//     });
//   } catch (error) {
//     log(`Error generating PDF for challan ID ${challanId}: ${error.message} - Stack: ${error.stack}`, 'error');
//     if (!res.headersSent) {
//       res.status(500).json({ message: 'Server error while generating PDF challan.' });
//     }
//   }
// };


const generateChallanPdf = async (req, res) => {
  const challanId = req.params.id;
  try {
    const challan = await Challan.findById(challanId).populate('company');
    if (!challan) {
      log(`PDF generation failed: Challan not found - ID: ${challanId}`, 'warn');
      return res.status(404).json({ message: 'Challan not found.' });
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Configuration constants
    let y = height - 40; // Adjusted top margin
    const leftMargin = 40;
    const rightMargin = width - 40;
    const contentWidth = rightMargin - leftMargin;

    const CONFIG = {
      leftMargin: 30,
      rightMargin: width - 30,
      contentWidth: width - 60,
      initialY: height - 40,
      lineSpacing: 12,
      smallLineSpacing: 8,
      itemLineSpacing: 12, // Increased spacing between box details
      itemFontSize: 9,
      headerFontSize: 8,
      textFontSize: 9,
      titleFontSize: 25,
      columnGap: 10,
      boxPerColumn: 22,
      columnsPerPage: 3,
      detailsRightMargin: width - 200
    };

    const drawTextAndMeasureHeight = (text, xPos, currentY, options = {}) => {
      const textToDraw = String(text ?? '').replace(/₹/g, 'INR ');
      const FONT_TO_USE = options.font || font;
      const SIZE = options.size || CONFIG.textFontSize;
      const COLOR = options.color || rgb(0, 0, 0);
      const LINE_HEIGHT = options.lineHeight || SIZE * 1.2;
      const MAX_WIDTH = options.maxWidth;
      const SPACING_AFTER = options.spacingAfter !== undefined ? options.spacingAfter : 2;
      const ALIGN = options.align || 'left';

      let actualXPos = xPos;
      if (ALIGN === 'center' && MAX_WIDTH) {
        const textWidth = FONT_TO_USE.widthOfTextAtSize(textToDraw, SIZE);
        actualXPos = xPos + (MAX_WIDTH - textWidth) / 2;
      } else if (ALIGN === 'center') {
        const textWidth = FONT_TO_USE.widthOfTextAtSize(textToDraw, SIZE);
        actualXPos = CONFIG.leftMargin + (CONFIG.contentWidth - textWidth) / 2;
      }

      page.drawText(textToDraw, {
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
      if (MAX_WIDTH && FONT_TO_USE.widthOfTextAtSize(textToDraw.replace(/\n/g, ' '), SIZE) > MAX_WIDTH) {
        const segments = textToDraw.split('\n');
        numLines = 0;
        segments.forEach(segment => {
          if (segment.trim() === '') {
            numLines++;
            return;
          }
          let currentLine = '';
          let linesForSegment = 1;
          const words = segment.split(' ');
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (FONT_TO_USE.widthOfTextAtSize(testLine, SIZE) > MAX_WIDTH) {
              linesForSegment++;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          numLines += linesForSegment;
        });
        if (textToDraw.endsWith('\n') && segments[segments.length - 1].trim() !== '') numLines++;
        if (numLines === 0 && textToDraw.trim() !== '') numLines = 1;
      } else {
        numLines = textToDraw.split('\n').length;
        if (numLines === 0 && textToDraw.trim() !== '') numLines = 1;
      }

      const textHeight = textToDraw.trim() === '' ? 0 : numLines * LINE_HEIGHT;
      return textHeight + SPACING_AFTER;
    };

    let currentY = y;

    // Line 1: "SHREE GANESHAY NAMAH" (Center) and "TEXT CHALLAN" (Right)
    const topHeaderTextY = currentY;
    const shreeGaneshText = 'SHREE GANESHAY NAMAH';
    const shreeGaneshFontSize = 10;
    const shreeGaneshOptions = { font: boldFont, size: shreeGaneshFontSize, align: 'center', color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
    const shreeGaneshHeight = drawTextAndMeasureHeight(shreeGaneshText, leftMargin, topHeaderTextY, shreeGaneshOptions);

    const taxInvoiceText = 'TEXT CHALLAN';
    const taxInvoiceFontSize = 14;
    const taxInvoiceWidth = boldFont.widthOfTextAtSize(taxInvoiceText, taxInvoiceFontSize);
    const taxInvoiceOptions = { font: boldFont, size: taxInvoiceFontSize, color: rgb(0.2, 0.2, 0.2), spacingAfter: 0 };
    const taxInvoiceHeight = drawTextAndMeasureHeight(taxInvoiceText, rightMargin - taxInvoiceWidth, topHeaderTextY, taxInvoiceOptions);

    currentY -= Math.max(shreeGaneshHeight, taxInvoiceHeight) + 18;

    // Company Name - Centered
    const companyNameText = 'MAHADEV FILAMENTS';
    const companyNameFontSize = 25;
    currentY -= drawTextAndMeasureHeight(companyNameText, leftMargin, currentY, { font: boldFont, size: companyNameFontSize, align: 'center', color: rgb(0.1, 0.3, 0.5) });

    // Address - Centered
    const addressText = 'BLOCK NO - 15, 1ST FLOOR, AMBIKA VIBHAG - 2, NEAR NAVJIVAN CIRCLE, U.M. ROAD, SURAT - 395007';
    const addressFontSize = 9;
    currentY -= drawTextAndMeasureHeight(addressText, leftMargin, currentY + 14, { size: addressFontSize, align: 'center', maxWidth: contentWidth, spacingAfter: 4 });

    // GSTIN - Centered
    const gstinText = 'GSTIN: 24AABEFM9966E1ZZ';
    const gstinFontSize = 10;
    currentY -= drawTextAndMeasureHeight(gstinText, leftMargin, currentY + 14, { size: gstinFontSize, align: 'center', spacingAfter: 15 });

    y = currentY;

    // Consignee and Challan Details Section
    const clientName = challan.companyDetailsSnapshot?.name || challan.company?.name || 'N/A';
    const clientAddress = challan.companyDetailsSnapshot?.address || challan.company?.address || 'N/A';
    const clientGstin = challan.companyDetailsSnapshot?.gstNumber || challan.company?.gstNumber || 'N/A';

    // Consignee Section (left side)
    const consigneeRectY = y - 84;
    if (!isNaN(consigneeRectY)) {
      page.drawRectangle({
        x: CONFIG.leftMargin,
        y: consigneeRectY,
        width: CONFIG.contentWidth / 2 + 20,
        height: 100,
        color: rgb(0.95, 0.95, 0.95),
        opacity: 0.5,
      });
    }

    let consigneeY = y;
    consigneeY -= drawTextAndMeasureHeight(`Consignee:`, CONFIG.leftMargin + 5, consigneeY, { 
      font: boldFont, 
      size: 11, 
      spacingAfter: 4 
    });
    consigneeY -= drawTextAndMeasureHeight(clientName, CONFIG.leftMargin + 5, consigneeY, { 
      font: boldFont, 
      size: 10, 
      spacingAfter: 4, 
      maxWidth: CONFIG.contentWidth / 2 
    });
    consigneeY -= drawTextAndMeasureHeight(clientAddress, CONFIG.leftMargin + 5, consigneeY, { 
      size: CONFIG.textFontSize, 
      spacingAfter: 4, 
      maxWidth: CONFIG.contentWidth / 2 
    });
    consigneeY -= drawTextAndMeasureHeight(`GSTIN: ${clientGstin}`, CONFIG.leftMargin + 5, consigneeY, { 
      font: boldFont, 
      size: CONFIG.textFontSize, 
      spacingAfter: 4, 
      maxWidth: CONFIG.contentWidth / 2 
    });

    // Challan Details (right side) with background
    const detailsRectY = y - 64;
    if (!isNaN(detailsRectY)) {
      page.drawRectangle({
        x: CONFIG.detailsRightMargin - 10,
        y: detailsRectY,
        width: CONFIG.contentWidth / 4 + 20,
        height: 80,
        color: rgb(0.95, 0.95, 0.95),
        opacity: 0.5,
      });
    }

    let detailsY = y;
    detailsY -= drawTextAndMeasureHeight(`Challan No.: ${challan.challanNumber || 'N/A'}`, CONFIG.detailsRightMargin, detailsY, { 
      font: boldFont, // Bold text
      size: CONFIG.textFontSize, 
      spacingAfter: 4,
      align: 'right'
    });
    detailsY -= drawTextAndMeasureHeight(`Date: ${new Date(challan.challanDate).toLocaleDateString('en-IN')}`, CONFIG.detailsRightMargin, detailsY, { 
      font: boldFont, // Bold text
      size: CONFIG.textFontSize, 
      spacingAfter: 4,
      align: 'right'
    });
    detailsY -= drawTextAndMeasureHeight(`Description: ${challan.descriptionOfGoods || 'N/A'}`, CONFIG.detailsRightMargin, detailsY, { 
      font: boldFont, // Bold text
      size: CONFIG.textFontSize, 
      spacingAfter: 4,
      align: 'right',
      maxWidth: 180
    });
    detailsY -= drawTextAndMeasureHeight(`Broker: ${challan.broker || 'direct'}`, CONFIG.detailsRightMargin, detailsY, { 
      font: boldFont, // Bold text
      size: CONFIG.textFontSize, 
      spacingAfter: 10,
      align: 'right'
    });

    // Use the lower of the two Y positions to continue
    y = Math.min(consigneeY, detailsY) - CONFIG.lineSpacing;

    // Calculate column positions and widths with equal spacing
    const columnWidth = (CONFIG.contentWidth - (CONFIG.columnGap * (CONFIG.columnsPerPage - 1))) / CONFIG.columnsPerPage;
    const columnPositions = Array.from({ length: CONFIG.columnsPerPage }, (_, i) => 
      CONFIG.leftMargin + (i * (columnWidth + CONFIG.columnGap))
    );

    // Draw table headers for each column
    const headerY = y - 22;
    columnPositions.forEach(colX => {
      const headerOptions = { 
        font: boldFont, 
        size: CONFIG.headerFontSize, 
        spacingAfter: 0, 
        color: rgb(0.1, 0.1, 0.1) 
      };
      
      const colHeaderX = colX + 5;
      const headerSpacing = (columnWidth - 15) / 4; // Equal spacing for 4 headers
      drawTextAndMeasureHeight('Sr No.', colHeaderX, y, headerOptions);
      drawTextAndMeasureHeight('Box No.', colHeaderX + headerSpacing, y, headerOptions);
      drawTextAndMeasureHeight('Weight', colHeaderX + headerSpacing * 2, y, headerOptions);
      drawTextAndMeasureHeight('Cops', colHeaderX + headerSpacing * 3, y, headerOptions);
    });

    y -= CONFIG.smallLineSpacing;
    page.drawLine({ 
      start: { x: CONFIG.leftMargin, y: y }, 
      end: { x: CONFIG.rightMargin, y: y }, 
      thickness: 1, 
      color: rgb(0.2, 0.2, 0.2) 
    });
    y -= CONFIG.itemLineSpacing;

    // Draw items in multiple columns (22 per column)
    const totalItems = challan.boxDetails.length;
    const totalColumnsNeeded = Math.ceil(totalItems / CONFIG.boxPerColumn);
    let currentColumn = 0;
    let currentItem = 0;
    let currentColumnY = y;

    while (currentItem < totalItems) {
      if (currentColumn >= CONFIG.columnsPerPage) {
        // Move to next page
        page = pdfDoc.addPage([595, 842]);
        currentColumn = 0;
        currentColumnY = height - 40;
        
        // Draw headers on new page
        const newHeaderY = currentColumnY - 22;
        columnPositions.forEach(colX => {
          const headerOptions = { 
            font: boldFont, 
            size: CONFIG.headerFontSize, 
            spacingAfter: 0, 
            color: rgb(0.1, 0.1, 0.1) 
          };
          
          const colHeaderX = colX + 5;
          const headerSpacing = (columnWidth - 15) / 4; // Equal spacing for 4 headers
          drawTextAndMeasureHeight('Sr No.', colHeaderX, currentColumnY, headerOptions);
          drawTextAndMeasureHeight('Box No.', colHeaderX + headerSpacing, currentColumnY, headerOptions);
          drawTextAndMeasureHeight('Weight', colHeaderX + headerSpacing * 2, currentColumnY, headerOptions);
          drawTextAndMeasureHeight('Cops', colHeaderX + headerSpacing * 3, currentColumnY, headerOptions);
        });
        
        currentColumnY -= CONFIG.smallLineSpacing;
        page.drawLine({ 
          start: { x: CONFIG.leftMargin, y: currentColumnY }, 
          end: { x: CONFIG.rightMargin, y: currentColumnY }, 
          thickness: 1, 
          color: rgb(0.2, 0.2, 0.2) 
        });
        currentColumnY -= CONFIG.itemLineSpacing;
      }

      const itemsInThisColumn = Math.min(CONFIG.boxPerColumn, totalItems - currentItem);
      let columnY = currentColumnY;
      
      for (let i = 0; i < itemsInThisColumn; i++) {
        const box = challan.boxDetails[currentItem];
        const colX = columnPositions[currentColumn];
        
        const itemRowOptions = { 
          size: CONFIG.itemFontSize, 
          spacingAfter: 0 
        };
        
        const colItemX = colX + 5;
        const itemSpacing = (columnWidth - 15) / 4; // Equal spacing for 4 items
        drawTextAndMeasureHeight(String(currentItem + 1), colItemX, columnY, itemRowOptions);
        drawTextAndMeasureHeight(box.boxNumber, colItemX + itemSpacing, columnY, itemRowOptions);
        drawTextAndMeasureHeight(String(box.netWeight.toFixed(2)), colItemX + itemSpacing * 2, columnY, itemRowOptions);
        drawTextAndMeasureHeight(String(box.cops), colItemX + itemSpacing * 3, columnY, itemRowOptions);
        
        columnY -= CONFIG.itemLineSpacing;
        currentItem++;
      }
      
      currentColumn++;
      currentColumnY = Math.min(currentColumnY, columnY);
    }

    // Totals section with adjusted Y position
    const totalsY = currentColumnY - CONFIG.lineSpacing * 30;
    if (!isNaN(totalsY)) {
      page.drawLine({ 
        start: { x: CONFIG.leftMargin, y: totalsY }, 
        end: { x: CONFIG.rightMargin, y: totalsY }, 
        thickness: 1.5, 
        color: rgb(0.2, 0.2, 0.2) 
      });
    }

    let totalsTextY = totalsY - CONFIG.smallLineSpacing - 2;
    if (!isNaN(totalsTextY)) {
      totalsTextY -= drawTextAndMeasureHeight(`Total Cops: ${challan.totalCops}`, CONFIG.leftMargin, totalsTextY, { 
        font: boldFont, 
        size: CONFIG.textFontSize, 
        spacingAfter: 4 
      });
      totalsTextY -= drawTextAndMeasureHeight(`Total Weight: ${challan.totalNetWeight.toFixed(2)}`, CONFIG.leftMargin, totalsTextY, { 
        font: boldFont, 
        size: CONFIG.textFontSize, 
        spacingAfter: 10 
      });
    }

    // Conditions of Sale and Declaration
    const conditionsY = totalsTextY - CONFIG.lineSpacing;
    if (!isNaN(conditionsY)) {
      page.drawLine({ 
        start: { x: CONFIG.leftMargin, y: conditionsY }, 
        end: { x: CONFIG.rightMargin, y: conditionsY }, 
        thickness: 1, 
        color: rgb(0.2, 0.2, 0.2) 
      });

      let declarationY = conditionsY - CONFIG.smallLineSpacing;
      declarationY -= drawTextAndMeasureHeight('Conditions of Sale:', CONFIG.leftMargin, declarationY, { 
        font: boldFont, 
        size: CONFIG.textFontSize, 
        spacingAfter: 4 
      });
      declarationY -= drawTextAndMeasureHeight('Complaint regarding Goods Should be reported within 24 hours on the receipt of goods.', CONFIG.leftMargin, declarationY, { 
        size: CONFIG.textFontSize, 
        spacingAfter: 8, 
        maxWidth: CONFIG.contentWidth 
      });

      // Company Stamp/Signature
      const stampY = declarationY - 20;
      if (!isNaN(stampY)) {
        drawTextAndMeasureHeight('For MAHADEV FILAMENTS', CONFIG.rightMargin - 150, stampY, { 
          font: boldFont, 
          size: CONFIG.textFontSize, 
          spacingAfter: 0 
        });
      }
    }

    // Contact Info
    const contactY = 30;
    if (!isNaN(contactY)) {
      page.drawRectangle({
        x: CONFIG.leftMargin,
        y: contactY - 8,
        width: CONFIG.contentWidth,
        height: 20,
        color: rgb(0.1, 0.3, 0.5),
        opacity: 0.1,
      });
      const contactText = 'Contact: Bharat Radiya | Phone: 9825492079 | Email: mahadevfilaments@gmail.com';
      const contactTextWidth = font.widthOfTextAtSize(contactText, CONFIG.textFontSize);
      drawTextAndMeasureHeight(contactText, CONFIG.leftMargin + (CONFIG.contentWidth - contactTextWidth) / 2, contactY, { 
        size: CONFIG.textFontSize, 
        spacingAfter: 0, 
        color: rgb(0.3, 0.3, 0.3) 
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const outputDir = path.join(__dirname, '..', 'generated_challans', 'pdf');
    await fsPromises.mkdir(outputDir, { recursive: true });

    const pdfFileName = `Challan-${challan.challanNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const pdfFilePath = path.join(outputDir, pdfFileName);

    await fsPromises.writeFile(pdfFilePath, pdfBytes);
    challan.pdfFilePath = pdfFilePath;
    await challan.save();

    log(`PDF generated for challan ${challan.challanNumber}: ${pdfFilePath}`, 'info');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);

    const fileStream = fs.createReadStream(pdfFilePath);
    fileStream.pipe(res);

    fileStream.on('error', (streamErr) => {
      log(`Error streaming PDF file for challan ${challan.challanNumber}: ${streamErr.message}`, 'error');
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to stream PDF file.' });
      }
    });

    fileStream.on('end', () => {
      log(`PDF file streamed for challan ${challan.challanNumber}`, 'info');
      res.end();
    });
  } catch (error) {
    log(`Error generating PDF for challan ID ${challanId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error while generating PDF challan.' });
    }
  }
};

// @desc    Download challans as Excel with filters
// @route   GET /api/challans/download/excel
// @access  Private/Admin
const downloadChallansExcel = async (req, res) => {
  const { companyId, startDate, endDate, status, month, year } = req.query;
  const query = {};

  if (companyId) query.company = companyId;
  if (status) query.status = status;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    query.challanDate = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    query.challanDate = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
  } else if (startDate) {
    query.challanDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.challanDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  try {
    const challans = await Challan.find(query)
      .populate('company', 'name gstNumber address')
      .sort({ challanDate: 1, challanNumber: 1 });

    if (!challans || challans.length === 0) {
      return res.status(404).json({ message: 'No challans found matching the criteria' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Challans');

    worksheet.columns = [
      { header: 'Challan No.', key: 'challanNumber', width: 15 },
      { header: 'Date', key: 'challanDate', width: 12 },
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'Company GST', key: 'companyGst', width: 20 },
      { header: 'Company Address', key: 'companyAddress', width: 40 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Total Weight', key: 'totalWeight', width: 12 },
      { header: 'Total Cops', key: 'totalCops', width: 12 },
      { header: 'Used', key: 'isUsed', width: 10 },
    ];

    challans.forEach((challan) => {
      const rowData = {
        challanNumber: challan.challanNumber,
        challanDate: challan.challanDate.toLocaleDateString('en-IN'),
        companyName: challan.company?.name || challan.companyDetailsSnapshot?.name,
        companyGst: challan.company?.gstNumber || challan.companyDetailsSnapshot?.gstNumber,
        companyAddress: challan.company?.address || challan.companyDetailsSnapshot?.address,
        description: challan.descriptionOfGoods,
        totalWeight: challan.totalNetWeight.toFixed(2),
        totalCops: challan.totalCops,
        isUsed: challan.isUsed ? 'Yes' : 'No',
      };
      worksheet.addRow(rowData);
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    let fileName = 'Challans';
    if (month && year) {
      fileName += `_${month}-${year}`;
    } else if (startDate && endDate) {
      fileName += `_${startDate}_to_${endDate}`;
    } else if (companyId) {
      fileName += `_Company_${companyId}`;
    }
    fileName += '.xlsx';

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    log(`Error generating Excel: ${error.message}`, 'error');
    res.status(500).json({ message: 'Error generating Excel file', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Download challans as PDF with filters
// @route   GET /api/challans/download/pdf
// @access  Private/Admin
const downloadChallansPdf = async (req, res) => {
  const { companyId, startDate, endDate, month, year } = req.query;
  const query = {};

  if (companyId) query.company = companyId;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    query.challanDate = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    query.challanDate = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
  } else if (startDate) {
    query.challanDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.challanDate = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  try {
    const challans = await Challan.find(query)
      .populate('company', 'name gstNumber address')
      .sort({ challanDate: 1, challanNumber: 1 });

    if (!challans || challans.length === 0) {
      return res.status(404).json({ message: 'No challans found matching the criteria' });
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 40;
    const tableWidth = width - margin * 2;
    const contentWidth = tableWidth;

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
        wordBreaks: [' ', '/', '-', ','],
      });

      let numLines = 1;
      if (maxWidth && currentFont.widthOfTextAtSize(safeText.replace(/\n/g, ' '), size) > maxWidth) {
        const segments = safeText.split('\n');
        numLines = 0;
        segments.forEach(segment => {
          if (segment.trim() === '') {
            numLines++;
            return;
          }
          let currentLine = '';
          let linesForSegment = 1;
          const words = segment.split(' ');
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (currentFont.widthOfTextAtSize(testLine, size) > maxWidth) {
              linesForSegment++;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          numLines += linesForSegment;
        });
        if (safeText.endsWith('\n') && segments[segments.length - 1].trim() !== '') numLines++;
        if (numLines === 0 && safeText.trim() !== '') numLines = 1;
      } else {
        numLines = safeText.split('\n').length;
        if (numLines === 0 && safeText.trim() !== '') numLines = 1;
      }

      return numLines * (size * 1.3) + 2;
    };

    let y = height - margin;

    let reportTitle = 'CHALLANS REPORT';
    if (month && year) {
      reportTitle += ` (${month}/${year})`;
    } else if (startDate && endDate) {
      reportTitle += ` (${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')})`;
    }
    y -= drawText(reportTitle, margin, y, 18, true, tableWidth, 'center');

    let filterInfo = '';
    if (companyId) {
      filterInfo += `Company: ${challans[0]?.company?.name || challans[0]?.companyDetailsSnapshot?.name || companyId}`;
    }
    if (filterInfo) {
      y -= drawText(filterInfo, margin, y, 10, false, tableWidth, 'center');
    }

    y -= 20;

    const colWidths = {
      challanNo: 80,
      date: 80,
      company: 180,
      description: 100,
      weight: 80,
    };

    const colPositions = {
      challanNo: margin,
      date: margin + colWidths.challanNo,
      company: margin + colWidths.challanNo + colWidths.date,
      description: margin + colWidths.challanNo + colWidths.date + colWidths.company,
      weight: margin + colWidths.challanNo + colWidths.date + colWidths.company + colWidths.description,
    };

    const drawTableHeader = () => {
      page.drawRectangle({
        x: margin,
        y: y - 10,
        width: tableWidth,
        height: 25,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.7,
      });

      drawText('Challan No.', colPositions.challanNo + 5, y, 10, true, colWidths.challanNo - 10);
      drawText('Date', colPositions.date + 5, y, 10, true, colWidths.date - 10);
      drawText('Company', colPositions.company + 5, y, 10, true, colWidths.company - 10);
      drawText('Description', colPositions.description + 5, y, 10, true, colWidths.description - 10);
      drawText('Weight', colPositions.weight + 5, y, 10, true, colWidths.weight - 10, 'right');
      y -= 30;
    };

    drawTableHeader();

    for (const challan of challans) {
      const rowHeight = 20;
      if (y - rowHeight < margin) {
        page = pdfDoc.addPage([595, 842]);
        y = height - margin;
        drawTableHeader();
      }

      drawText(challan.challanNumber, colPositions.challanNo + 5, y, 9, false, colWidths.challanNo - 10);
      drawText(challan.challanDate.toLocaleDateString('en-IN'), colPositions.date + 5, y, 9, false, colWidths.date - 10);
      const companyName = challan.company?.name || challan.companyDetailsSnapshot?.name || 'N/A';
      const companyText = companyName.length > 30 ? companyName.substring(0, 27) + '...' : companyName;
      drawText(companyText, colPositions.company + 5, y, 9, false, colWidths.company - 10);
      const descText = challan.descriptionOfGoods.length > 20 ? challan.descriptionOfGoods.substring(0, 17) + '...' : challan.descriptionOfGoods;
      drawText(descText, colPositions.description + 5, y, 9, false, colWidths.description - 10);
      drawText(challan.totalNetWeight.toFixed(2), colPositions.weight + 5, y, 9, false, colWidths.weight - 10, 'right');
      y -= 20;

      page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      y -= 10;
    }

    y -= 20;
    drawText(`Generated on ${new Date().toLocaleDateString('en-IN')}`, margin, margin - 30, 9);
    drawText(`Total Challans: ${challans.length}`, width - margin - 150, margin - 30, 9, true);

    res.setHeader('Content-Type', 'application/pdf');
    let fileName = 'Challans';
    if (month && year) {
      fileName += `_${month}-${year}`;
    } else if (startDate && endDate) {
      fileName += `_${startDate}_to_${endDate}`;
    } else if (companyId) {
      fileName += `_Company_${companyId}`;
    }
    fileName += '.pdf';
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const pdfBytes = await pdfDoc.save();
    res.write(pdfBytes);
    res.end();
  } catch (error) {
    log(`Error generating PDF: ${error.message}`, 'error');
    res.status(500).json({ message: 'Error generating PDF file', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};


module.exports = {
  createChallan,
  getChallans,
  getChallanById,
  updateChallan,
  deleteChallan,
  generateChallanPdf,
  downloadChallansExcel,
  downloadChallansPdf,
  getChallansByCompany,
};