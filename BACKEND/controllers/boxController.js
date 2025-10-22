// const Box = require('../models/Box');
// const Settings = require('../models/Settings');
// const { log } = require('../middleware/logger');
// const mongoose = require('mongoose');

// // @desc    Create a new box
// // @route   POST /api/boxes
// // @access  Private/Admin
// const createBox = async (req, res) => {
//   const { boxNumber, descriptionOfGoods, grossWeight, tareWeight, netWeight, cops, grade } = req.body;

//   if (!boxNumber || !descriptionOfGoods || grossWeight === undefined || tareWeight === undefined || netWeight === undefined || cops === undefined) {
//     return res.status(400).json({ message: 'Missing required fields: boxNumber, descriptionOfGoods, grossWeight, tareWeight, netWeight, cops.' });
//   }

//   try {
//     // Validate description against settings
//     const settings = await Settings.getSettings();
//     const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
//     if (!validDescription) {
//       return res.status(400).json({ message: 'Description of Goods must be from predefined settings.' });
//     }

//     const newBox = new Box({
//       boxNumber,
//       descriptionOfGoods,
//       grossWeight,
//       tareWeight,
//       netWeight,
//       cops,
//       grade,
//       createdBy: req.user._id,
//     });

//     const savedBox = await newBox.save();
//     log(`Box created successfully: ${savedBox.boxNumber} by ${req.user.email}`, 'info');
//     res.status(201).json(savedBox);
//   } catch (error) {
//     log(`Error creating box: ${error.message} - Stack: ${error.stack}`, 'error');
//     if (error.code === 11000 || error.message.includes('duplicate key')) {
//       return res.status(400).json({ message: `Box number '${boxNumber}' already exists.` });
//     }
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({ message: error.message });
//     }
//     res.status(500).json({ message: 'Server error while creating box.' });
//   }
// };

// // @desc    Get all boxes (with optional filters)
// // @route   GET /api/boxes
// // @access  Private/Admin
// // const getBoxes = async (req, res) => {
// //   const { descriptionOfGoods, isUsed, search } = req.query;
// //   const query = {};

// //   try {
// //     // Handle descriptionOfGoods filter
// //     if (descriptionOfGoods && descriptionOfGoods !== 'All Descriptions') {
// //       const settings = await Settings.getSettings();
// //       const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
// //       if (!validDescription) {
// //         return res.status(400).json({ message: 'Invalid description of goods.' });
// //       }
// //       query.descriptionOfGoods = descriptionOfGoods;
// //     }

// //     // Handle isUsed filter
// //     if (isUsed !== undefined && isUsed !== '') {
// //       if (isUsed !== 'true' && isUsed !== 'false') {
// //         return res.status(400).json({ message: 'Invalid isUsed value. Must be "true" or "false".' });
// //       }
// //       query.isUsed = isUsed === 'true';
// //     }

// //     // Handle search filter
// //     if (search && search.trim()) {
// //       query.boxNumber = { $regex: search.trim(), $options: 'i' }; // Case-insensitive search
// //     }

// //     console.log('Backend query:', query); // Debug log

// //     const boxes = await Box.find(query)
// //       .populate('createdBy', 'username email')
// //       .sort({ createdAt: -1 });

// //     log(`Fetched ${boxes.length} boxes with query ${JSON.stringify(query)} by ${req.user.email}`, 'info');
// //     res.json(boxes);
// //   } catch (error) {
// //     log(`Error fetching boxes: ${error.message} - Stack: ${error.stack}`, 'error');
// //     res.status(500).json({ message: 'Server error while fetching boxes.' });
// //   }
// // };

// const getBoxes = async (req, res) => {
//   const { descriptionOfGoods, isUsed, search } = req.query;
//   const query = {};

//   console.log('Raw query parameters:', req.query); // Debug raw query params

//   try {
//     // Handle descriptionOfGoods filter
//     if (descriptionOfGoods && descriptionOfGoods !== 'All Descriptions') {
//       const settings = await Settings.getSettings();
//       const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
//       if (!validDescription) {
//         return res.status(400).json({ message: 'Invalid description of goods.' });
//       }
//       query.descriptionOfGoods = descriptionOfGoods;
//     }

//     // Handle isUsed filter
//     if (isUsed !== undefined && isUsed !== '') {
//       if (isUsed !== 'true' && isUsed !== 'false') {
//         return res.status(400).json({ message: 'Invalid isUsed value. Must be "true" or "false".' });
//       }
//       query.isUsed = isUsed === 'true';
//     }

//     // Handle search filter
//     if (search && search.trim()) {
//       query.boxNumber = { $regex: search.trim(), $options: 'i' }; // Case-insensitive search
//     }

//     console.log('Backend query:', query); // Debug log

//     const boxes = await Box.find(query)
//       .populate('createdBy', 'username email')
//       .sort({ createdAt: -1 });

//     log(`Fetched ${boxes.length} boxes with query ${JSON.stringify(query)} by ${req.user.email}`, 'info');
//     res.json(boxes);
//   } catch (error) {
//     log(`Error fetching boxes: ${error.message} - Stack: ${error.stack}`, 'error');
//     res.status(500).json({ message: 'Server error while fetching boxes.' });
//   }
// };

// // @desc    Get available boxes by description (not used)
// // @route   GET /api/boxes/available
// // @access  Private/Admin
// const getAvailableBoxes = async (req, res) => {
//   try {
//     let { descriptionOfGoods } = req.query;
    
//     if (!descriptionOfGoods) {
//       return res.status(400).json({ 
//         message: 'descriptionOfGoods query parameter is required',
//         code: 'MISSING_DESCRIPTION'
//       });
//     }

//     // Decode and clean the description
//     descriptionOfGoods = decodeURIComponent(descriptionOfGoods)
//       .replace(/\+/g, ' ')
//       .trim();

//     // Get settings and validate description
//     const settings = await Settings.getSettings();
//     const validDescription = settings.itemConfigurations.find(
//       item => item.description === descriptionOfGoods
//     );
    
//     if (!validDescription) {
//       return res.status(400).json({ 
//         message: 'Invalid description of goods',
//         code: 'INVALID_DESCRIPTION',
//         availableDescriptions: settings.itemConfigurations.map(item => item.description),
//         receivedDescription: descriptionOfGoods
//       });
//     }

//     // Find available boxes
//     const boxes = await Box.find({ 
//       descriptionOfGoods,
//       isUsed: false,
//     }).sort({ boxNumber: 1 });
    
//     res.json(boxes);
//   } catch (error) {
//     console.error("Error fetching available boxes:", error);
//     res.status(500).json({ 
//       message: "Server error while fetching available boxes.",
//       code: 'SERVER_ERROR',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // @desc    Get a single box by ID
// // @route   GET /api/boxes/:id
// // @access  Private/Admin
// const getBoxById = async (req, res) => {
//   const boxId = req.params.id;

//   if (!mongoose.Types.ObjectId.isValid(boxId)) {
//     return res.status(400).json({ message: 'Invalid box ID format.' });
//   }

//   try {
//     const box = await Box.findById(boxId)
//       .populate('createdBy', 'username email');

//     if (!box) {
//       return res.status(404).json({ message: 'Box not found' });
//     }

//     res.json(box);
//   } catch (error) {
//     log(`Error fetching box ID ${boxId}: ${error.message}`, 'error');
//     res.status(500).json({ message: 'Server error while fetching box.' });
//   }
// };

// // @desc    Update a box
// // @route   PUT /api/boxes/:id
// // @access  Private/Admin
// const updateBox = async (req, res) => {
//   const boxId = req.params.id;
//   const { boxNumber, descriptionOfGoods, grossWeight, tareWeight, cops, grade } = req.body;

//   try {
//     const box = await Box.findById(boxId);
//     if (!box) {
//       log(`Box update failed: Not found with ID: ${boxId}`, 'warn');
//       return res.status(404).json({ message: 'Box not found' });
//     }

//     if (box.isUsed) {
//       return res.status(400).json({ message: 'Cannot modify a box that is already used in a challan.' });
//     }

//     if (boxNumber && boxNumber !== box.boxNumber) {
//       const existingBox = await Box.findOne({ boxNumber });
//       if (existingBox && existingBox._id.toString() !== boxId) {
//         return res.status(400).json({ message: `Box number '${boxNumber}' already exists.` });
//       }
//       box.boxNumber = boxNumber;
//     }

//     if (descriptionOfGoods) {
//       const settings = await Settings.getSettings();
//       const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
//       if (!validDescription) {
//         return res.status(400).json({ message: 'Description of Goods must be from predefined settings.' });
//       }
//       box.descriptionOfGoods = descriptionOfGoods;
//     }

//     if (grossWeight !== undefined) box.grossWeight = grossWeight;
//     if (tareWeight !== undefined) box.tareWeight = tareWeight;
//     if (cops !== undefined) box.cops = cops;
//     if (grade !== undefined) box.grade = grade;

//     const updatedBox = await box.save();
//     log(`Box updated: ${updatedBox.boxNumber} by ${req.user.email}`, 'info');
//     res.json(updatedBox);
//   } catch (error) {
//     log(`Error updating box ID ${boxId}: ${error.message} - Stack: ${error.stack}`, 'error');
//     if (error.code === 11000 || error.message.includes('duplicate key')) {
//       return res.status(400).json({ message: `Box number '${boxNumber}' already exists.` });
//     }
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({ message: error.message });
//     }
//     res.status(500).json({ message: 'Server error while updating box.' });
//   }
// };

// // @desc    Delete a box
// // @route   DELETE /api/boxes/:id
// // @access  Private/Admin
// const deleteBox = async (req, res) => {
//   try {
//     const box = await Box.findById(req.params.id);
//     if (!box) {
//       log(`Box deletion failed: Not found with ID: ${req.params.id}`, 'warn');
//       return res.status(404).json({ message: 'Box not found' });
//     }

//     if (box.isUsed) {
//       return res.status(400).json({ message: 'Cannot delete box; it is used in a challan.' });
//     }

//     await box.deleteOne();
//     log(`Box deleted: ${box.boxNumber} by ${req.user.email}`, 'info');
//     res.json({ message: 'Box removed successfully.' });
//   } catch (error) {
//     log(`Error deleting box ID ${req.params.id}: ${error.message}`, 'error');
//     res.status(500).json({ message: 'Server error while deleting box.' });
//   }
// };

// module.exports = {
//   createBox,
//   getBoxes,
//   getBoxById,
//   updateBox,
//   deleteBox,
//   getAvailableBoxes,
// };

const Box = require('../models/Box');
const Settings = require('../models/Settings');
const { log } = require('../middleware/logger');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

// Helper function to build query filters
const buildQueryFilters = async (filters) => {
  const { descriptionOfGoods, isUsed, search, startDate, endDate } = filters;
  const query = {};

  // Handle descriptionOfGoods filter
  if (descriptionOfGoods && descriptionOfGoods !== 'All Descriptions') {
    const settings = await Settings.getSettings();
    const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
    if (!validDescription) {
      throw new Error('Invalid description of goods.');
    }
    query.descriptionOfGoods = descriptionOfGoods;
  }

  // Handle isUsed filter
  if (isUsed !== undefined && isUsed !== '') {
    if (isUsed !== 'true' && isUsed !== 'false') {
      throw new Error('Invalid isUsed value. Must be "true" or "false".');
    }
    query.isUsed = isUsed === 'true';
  }

  // Handle search filter
  if (search && search.trim()) {
    query.boxNumber = { $regex: search.trim(), $options: 'i' }; // Case-insensitive search
  }

  // Handle date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  return query;
};

// Helper function to fetch boxes with all filters applied
const fetchFilteredBoxes = async (filters, includeUserInfo = false) => {
  const { startBox, endBox } = filters;
  const query = await buildQueryFilters(filters);

  console.log('Built query filters:', query);

  let boxes;
  
  if (startBox || endBox) {
    // Use aggregation pipeline for box number range filtering
    const aggregationPipeline = [];

    // Apply basic filters first
    if (Object.keys(query).length > 0) {
      aggregationPipeline.push({ $match: query });
    }

    // Add numeric box number field for range filtering
    aggregationPipeline.push({
      $addFields: {
        numericBoxNumber: { $toInt: "$boxNumber" }
      }
    });

    // Apply box number range filter
    const rangeFilter = {};
    if (startBox) {
      rangeFilter.numericBoxNumber = { $gte: parseInt(startBox) };
    }
    if (endBox) {
      if (rangeFilter.numericBoxNumber) {
        rangeFilter.numericBoxNumber.$lte = parseInt(endBox);
      } else {
        rangeFilter.numericBoxNumber = { $lte: parseInt(endBox) };
      }
    }
    
    if (Object.keys(rangeFilter).length > 0) {
      aggregationPipeline.push({ $match: rangeFilter });
    }

    // Sort by creation date
    aggregationPipeline.push({ $sort: { createdAt: -1 } });

    // Include user info if requested
    if (includeUserInfo) {
      aggregationPipeline.push({
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          pipeline: [
            { $project: { username: 1, email: 1, _id: 0 } }
          ],
          as: 'createdBy'
        }
      });
      aggregationPipeline.push({ $unwind: '$createdBy' });
    }

    // Remove the temporary numeric field
    aggregationPipeline.push({
      $project: {
        numericBoxNumber: 0
      }
    });

    console.log('Aggregation pipeline:', JSON.stringify(aggregationPipeline, null, 2));
    boxes = await Box.aggregate(aggregationPipeline);
  } else {
    // Use regular find for non-range queries
    let boxQuery = Box.find(query);
    
    if (includeUserInfo) {
      boxQuery = boxQuery.populate('createdBy', 'username email');
    }
    
    boxes = await boxQuery.sort({ createdAt: -1 });
  }

  return boxes;
};

// @desc    Create a new box
// @route   POST /api/boxes
// @access  Private/Admin
const createBox = async (req, res) => {
  const { boxNumber, descriptionOfGoods, grossWeight, tareWeight, netWeight, cops, grade } = req.body;

  if (!boxNumber || !descriptionOfGoods || grossWeight === undefined || tareWeight === undefined || netWeight === undefined || cops === undefined) {
    return res.status(400).json({ message: 'Missing required fields: boxNumber, descriptionOfGoods, grossWeight, tareWeight, netWeight, cops.' });
  }

  try {
    // Validate description against settings
    const settings = await Settings.getSettings();
    const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
    if (!validDescription) {
      return res.status(400).json({ message: 'Description of Goods must be from predefined settings.' });
    }

    const newBox = new Box({
      boxNumber,
      descriptionOfGoods,
      grossWeight,
      tareWeight,
      netWeight,
      cops,
      grade,
      createdBy: req.user._id,
    });

    const savedBox = await newBox.save();
    log(`Box created successfully: ${savedBox.boxNumber} by ${req.user.email}`, 'info');
    res.status(201).json(savedBox);
  } catch (error) {
    log(`Error creating box: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      return res.status(400).json({ message: `Box number '${boxNumber}' already exists.` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating box.' });
  }
};

// @desc    Get all boxes (with optional filters)
// @route   GET /api/boxes
// @access  Private/Admin
const getBoxes = async (req, res) => {
  const { descriptionOfGoods, isUsed, search, startBox, endBox, startDate, endDate } = req.query;

  console.log('Raw query parameters:', req.query); // Debug raw query params

  try {
    const filters = { descriptionOfGoods, isUsed, search, startBox, endBox, startDate, endDate };
    const boxes = await fetchFilteredBoxes(filters, true); // Include user info for display

    log(`Fetched ${boxes.length} boxes with filters ${JSON.stringify(filters)} by ${req.user.email}`, 'info');
    res.json(boxes);
  } catch (error) {
    log(`Error fetching boxes: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.message === 'Invalid description of goods.' || error.message === 'Invalid isUsed value. Must be "true" or "false".') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while fetching boxes.' });
  }
};

// @desc    Generate PDF report for boxes
// @route   POST /api/boxes/generate-pdf
// @access  Private/Admin
const generateBoxesPDF = async (req, res) => {
  const { descriptionOfGoods, isUsed, search, startBox, endBox, startDate, endDate } = req.body;

  try {
    const filters = { descriptionOfGoods, isUsed, search, startBox, endBox, startDate, endDate };
    
    console.log('PDF Generation filters:', filters); // Debug log
    
    // Use the same filtering logic as getBoxes
    const boxes = await fetchFilteredBoxes(filters, false); // Don't need user info for PDF
    
    console.log(`Found ${boxes.length} boxes for PDF generation`); // Debug log

    // Calculate total net weight
    const totalNetWeight = boxes.reduce((sum, box) => sum + (box.netWeight || 0), 0);

    // Generate PDF
    generatePDFResponse(res, boxes, totalNetWeight, filters);
    
    log(`PDF generated with ${boxes.length} boxes and total net weight ${totalNetWeight.toFixed(2)} by ${req.user.email}`, 'info');
  } catch (error) {
    log(`Error generating PDF: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.message === 'Invalid description of goods.' || error.message === 'Invalid isUsed value. Must be "true" or "false".') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while generating PDF.' });
  }
};

// @desc    Get available boxes by description (not used)
// @route   GET /api/boxes/available
// @access  Private/Admin
const getAvailableBoxes = async (req, res) => {
  try {
    let { descriptionOfGoods } = req.query;
    
    if (!descriptionOfGoods) {
      return res.status(400).json({ 
        message: 'descriptionOfGoods query parameter is required',
        code: 'MISSING_DESCRIPTION'
      });
    }

    // Decode and clean the description
    descriptionOfGoods = decodeURIComponent(descriptionOfGoods)
      .replace(/\+/g, ' ')
      .trim();

    // Get settings and validate description
    const settings = await Settings.getSettings();
    const validDescription = settings.itemConfigurations.find(
      item => item.description === descriptionOfGoods
    );
    
    if (!validDescription) {
      return res.status(400).json({ 
        message: 'Invalid description of goods',
        code: 'INVALID_DESCRIPTION',
        availableDescriptions: settings.itemConfigurations.map(item => item.description),
        receivedDescription: descriptionOfGoods
      });
    }

    // Find available boxes
    const boxes = await Box.find({ 
      descriptionOfGoods,
      isUsed: false,
    }).sort({ boxNumber: 1 });
    
    res.json(boxes);
  } catch (error) {
    console.error("Error fetching available boxes:", error);
    res.status(500).json({ 
      message: "Server error while fetching available boxes.",
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get a single box by ID
// @route   GET /api/boxes/:id
// @access  Private/Admin
const getBoxById = async (req, res) => {
  const boxId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(boxId)) {
    return res.status(400).json({ message: 'Invalid box ID format.' });
  }

  try {
    const box = await Box.findById(boxId)
      .populate('createdBy', 'username email');

    if (!box) {
      return res.status(404).json({ message: 'Box not found' });
    }

    res.json(box);
  } catch (error) {
    log(`Error fetching box ID ${boxId}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching box.' });
  }
};

// @desc    Update a box
// @route   PUT /api/boxes/:id
// @access  Private/Admin
const updateBox = async (req, res) => {
  const boxId = req.params.id;
  const { boxNumber, descriptionOfGoods, grossWeight, tareWeight, cops, grade } = req.body;

  try {
    const box = await Box.findById(boxId);
    if (!box) {
      log(`Box update failed: Not found with ID: ${boxId}`, 'warn');
      return res.status(404).json({ message: 'Box not found' });
    }

    if (box.isUsed) {
      return res.status(400).json({ message: 'Cannot modify a box that is already used in a challan.' });
    }

    if (boxNumber && boxNumber !== box.boxNumber) {
      const existingBox = await Box.findOne({ boxNumber });
      if (existingBox && existingBox._id.toString() !== boxId) {
        return res.status(400).json({ message: `Box number '${boxNumber}' already exists.` });
      }
      box.boxNumber = boxNumber;
    }

    if (descriptionOfGoods) {
      const settings = await Settings.getSettings();
      const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
      if (!validDescription) {
        return res.status(400).json({ message: 'Description of Goods must be from predefined settings.' });
      }
      box.descriptionOfGoods = descriptionOfGoods;
    }

    if (grossWeight !== undefined) box.grossWeight = grossWeight;
    if (tareWeight !== undefined) box.tareWeight = tareWeight;
    if (cops !== undefined) box.cops = cops;
    if (grade !== undefined) box.grade = grade;

    const updatedBox = await box.save();
    log(`Box updated: ${updatedBox.boxNumber} by ${req.user.email}`, 'info');
    res.json(updatedBox);
  } catch (error) {
    log(`Error updating box ID ${boxId}: ${error.message} - Stack: ${error.stack}`, 'error');
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      return res.status(400).json({ message: `Box number '${boxNumber}' already exists.` });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating box.' });
  }
};

// @desc    Delete a box
// @route   DELETE /api/boxes/:id
// @access  Private/Admin
const deleteBox = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) {
      log(`Box deletion failed: Not found with ID: ${req.params.id}`, 'warn');
      return res.status(404).json({ message: 'Box not found' });
    }

    if (box.isUsed) {
      return res.status(400).json({ message: 'Cannot delete box; it is used in a challan.' });
    }

    await box.deleteOne();
    log(`Box deleted: ${box.boxNumber} by ${req.user.email}`, 'info');
    res.json({ message: 'Box removed successfully.' });
  } catch (error) {
    log(`Error deleting box ID ${req.params.id}: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while deleting box.' });
  }
};

// Helper function to generate PDF response
const generatePDFResponse = (res, boxes, totalNetWeight, filters) => {
  const { descriptionOfGoods, isUsed, search, startBox, endBox, startDate, endDate } = filters;
  
  // Create PDF document with better margins
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4'
  });
  
  const filename = `boxes-report-${Date.now()}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // Colors for styling
  const colors = {
    primary: '#2563eb',      // Blue
    secondary: '#64748b',    // Gray
    success: '#16a34a',      // Green
    warning: '#d97706',      // Orange
    danger: '#dc2626',       // Red
    light: '#f8fafc',        // Light gray
    dark: '#1e293b'          // Dark gray
  };

  // Helper function to draw a colored rectangle
  const drawRect = (x, y, width, height, color, opacity = 1) => {
    doc.save();
    doc.fillColor(color).fillOpacity(opacity);
    doc.rect(x, y, width, height).fill();
    doc.restore();
  };

  // Helper function to add a section separator
  const addSectionSeparator = () => {
    const currentY = doc.y;
    doc.moveTo(40, currentY)
       .lineTo(555, currentY)
       .strokeColor(colors.secondary)
       .strokeOpacity(0.3)
       .lineWidth(1)
       .stroke();
    doc.moveDown(0.5);
  };

  // Company Header with background
  drawRect(0, 0, 595, 80, colors.primary);
  
  doc.fillColor('white')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('MAHADEV FILAMENTS', 40, 25);
  
  doc.fontSize(14)
     .font('Helvetica')
     .text('Box Inventory Report', 40, 55);

  // Reset position after header
  doc.y = 100;
  doc.fillColor(colors.dark);

  // Report title and date
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(colors.primary)
     .text('Boxes Report', { align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(colors.secondary)
     .text(`Generated on ${new Date().toLocaleDateString('en-US', { 
       weekday: 'long', 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     })}`, { align: 'center' });
  
  doc.moveDown(2);

  // Applied Filters Section (if any filters are active)
  const activeFilters = [];
  if (descriptionOfGoods && descriptionOfGoods !== 'All Descriptions') {
    activeFilters.push(`Description: ${descriptionOfGoods}`);
  }
  if (isUsed !== undefined && isUsed !== '') {
    activeFilters.push(`Status: ${isUsed === 'true' ? 'Used' : 'Available'}`);
  }
  if (search && search.trim()) {
    activeFilters.push(`Search: "${search.trim()}"`);
  }
  if (startBox || endBox) {
    activeFilters.push(`Box Range: ${startBox || 'Start'} to ${endBox || 'End'}`);
  }
  if (startDate || endDate) {
    const startStr = startDate ? new Date(startDate).toLocaleDateString() : 'Start';
    const endStr = endDate ? new Date(endDate).toLocaleDateString() : 'End';
    activeFilters.push(`Date Range: ${startStr} to ${endStr}`);
  }

  if (activeFilters.length > 0) {
    // Filter section background
    const filterSectionY = doc.y;
    drawRect(40, filterSectionY - 5, 515, 25 + (activeFilters.length * 15), colors.light, 0.5);
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text('Applied Filters:', 50, filterSectionY + 5);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(colors.dark);
    
    activeFilters.forEach((filter, index) => {
      doc.text(`• ${filter}`, 60, filterSectionY + 25 + (index * 15));
    });
    
    doc.y = filterSectionY + 35 + (activeFilters.length * 15);
    doc.moveDown(1);
  }

  // Summary Cards Section
  const summaryY = doc.y;
  const cardWidth = 160;
  const cardHeight = 60;
  const cardSpacing = 20;
  
  // Card 1: Total Boxes
  drawRect(40, summaryY, cardWidth, cardHeight, colors.primary, 0.1);
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(colors.primary)
     .text('Total Boxes', 45, summaryY + 10);
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(colors.primary)
     .text(boxes.length.toString(), 45, summaryY + 25);
  
  // Card 2: Total Net Weight
  const card2X = 40 + cardWidth + cardSpacing;
  drawRect(card2X, summaryY, cardWidth, cardHeight, colors.success, 0.1);
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(colors.success)
     .text('Total Net Weight', card2X + 5, summaryY + 10);
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor(colors.success)
     .text(`${totalNetWeight.toFixed(2)} kg`, card2X + 5, summaryY + 28);
  
  // Card 3: Available Boxes
  const availableBoxes = boxes.filter(box => !box.isUsed).length;
  const card3X = card2X + cardWidth + cardSpacing;
  drawRect(card3X, summaryY, cardWidth, cardHeight, colors.warning, 0.1);
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(colors.warning)
     .text('Available Boxes', card3X + 5, summaryY + 10);
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(colors.warning)
     .text(availableBoxes.toString(), card3X + 5, summaryY + 25);

  // Move to next section
  doc.y = summaryY + cardHeight + 30;

  // Check if there are boxes to display
  if (boxes.length === 0) {
    drawRect(40, doc.y - 10, 515, 80, colors.light, 0.5);
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text('No boxes found matching the selected filters.', { align: 'center' });
    doc.end();
    return;
  }

  addSectionSeparator();

  // Table Header
  const tableStartY = doc.y + 10;
  const tableLeft = 40;
  const colWidths = [70, 140, 70, 70, 70, 80, 80]; // Adjusted widths
  let currentX = tableLeft;

  // Header background
  drawRect(tableLeft, tableStartY - 5, colWidths.reduce((a, b) => a + b, 0), 25, colors.primary, 0.9);

  // Table headers
  const headers = ['Box No.', 'Description', 'Gross Wt.', 'Tare Wt.', 'Net Wt.', 'COPS', 'Date'];
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('white');

  headers.forEach((header, index) => {
    doc.text(header, currentX + 5, tableStartY + 2, {
      width: colWidths[index] - 10,
      align: index > 1 ? 'center' : 'left'
    });
    currentX += colWidths[index];
  });

  // Reset for table rows
  doc.fillColor(colors.dark);
  let y = tableStartY + 35;
  let rowCount = 0;

  // Add table rows with alternating background colors
  boxes.forEach((box, i) => {
    // Check if we need a new page
    if (y > 720) {
      doc.addPage();
      y = 80;
      
      // Re-draw table header on new page
      drawRect(tableLeft, y - 5, colWidths.reduce((a, b) => a + b, 0), 25, colors.primary, 0.9);
      currentX = tableLeft;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('white');

      headers.forEach((header, index) => {
        doc.text(header, currentX + 5, y + 2, {
          width: colWidths[index] - 10,
          align: index > 1 ? 'center' : 'left'
        });
        currentX += colWidths[index];
      });
      
      y += 35;
      rowCount = 0;
      doc.fillColor(colors.dark);
    }
    
    // Alternate row background
    if (rowCount % 2 === 0) {
      drawRect(tableLeft, y - 3, colWidths.reduce((a, b) => a + b, 0), 22, colors.light, 0.3);
    }
    
    // Handle both mongoose documents and plain objects from aggregation
    const boxData = box.toObject ? box.toObject() : box;
    const createdAt = boxData.createdAt ? new Date(boxData.createdAt) : new Date();
    
    // Row data
    const rowData = [
      boxData.boxNumber.toString(),
      boxData.descriptionOfGoods,
      `${boxData.grossWeight?.toFixed(2) || 'N/A'}`,
      `${boxData.tareWeight?.toFixed(2) || 'N/A'}`,
      `${boxData.netWeight?.toFixed(2) || 'N/A'}`,
      boxData.cops.toString(),
      createdAt.toLocaleDateString()
    ];
    
    currentX = tableLeft;
    doc.fontSize(9)
       .font('Helvetica');
    
    rowData.forEach((data, index) => {
      // Color code the status or special values
      if (index === 0) { // Box number - make it bold
        doc.font('Helvetica-Bold').fillColor(colors.primary);
      } else if (index >= 2 && index <= 4) { // Weight columns
        doc.font('Helvetica').fillColor(colors.success);
      } else {
        doc.font('Helvetica').fillColor(colors.dark);
      }
      
      doc.text(data, currentX + 5, y + 2, {
        width: colWidths[index] - 10,
        align: index > 1 ? 'center' : 'left',
        ellipsis: true
      });
      currentX += colWidths[index];
    });
    
    y += 22;
    rowCount++;
  });

  // Footer
  doc.y = y + 20;
  addSectionSeparator();
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(colors.secondary)
     .text(`Report generated by MAHADEV FILAMENTS - ${new Date().toLocaleDateString()}`, 40, doc.y + 10);
  
  doc.text('This is a computer-generated document.', { align: 'right' });

  doc.end();
};

module.exports = {
  createBox,
  getBoxes,
  getBoxById,
  updateBox,
  deleteBox,
  getAvailableBoxes,
  generateBoxesPDF,
};