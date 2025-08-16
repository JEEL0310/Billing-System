const Box = require('../models/Box');
const Settings = require('../models/Settings');
const { log } = require('../middleware/logger');
const mongoose = require('mongoose');

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
// const getBoxes = async (req, res) => {
//   const { descriptionOfGoods, isUsed, search } = req.query;
//   const query = {};

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

const getBoxes = async (req, res) => {
  const { descriptionOfGoods, isUsed, search } = req.query;
  const query = {};

  console.log('Raw query parameters:', req.query); // Debug raw query params

  try {
    // Handle descriptionOfGoods filter
    if (descriptionOfGoods && descriptionOfGoods !== 'All Descriptions') {
      const settings = await Settings.getSettings();
      const validDescription = settings.itemConfigurations.some(item => item.description === descriptionOfGoods);
      if (!validDescription) {
        return res.status(400).json({ message: 'Invalid description of goods.' });
      }
      query.descriptionOfGoods = descriptionOfGoods;
    }

    // Handle isUsed filter
    if (isUsed !== undefined && isUsed !== '') {
      if (isUsed !== 'true' && isUsed !== 'false') {
        return res.status(400).json({ message: 'Invalid isUsed value. Must be "true" or "false".' });
      }
      query.isUsed = isUsed === 'true';
    }

    // Handle search filter
    if (search && search.trim()) {
      query.boxNumber = { $regex: search.trim(), $options: 'i' }; // Case-insensitive search
    }

    console.log('Backend query:', query); // Debug log

    const boxes = await Box.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    log(`Fetched ${boxes.length} boxes with query ${JSON.stringify(query)} by ${req.user.email}`, 'info');
    res.json(boxes);
  } catch (error) {
    log(`Error fetching boxes: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching boxes.' });
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

module.exports = {
  createBox,
  getBoxes,
  getBoxById,
  updateBox,
  deleteBox,
  getAvailableBoxes,
};