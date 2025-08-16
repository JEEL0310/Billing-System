const Log = require('../models/Log'); // Assuming Log model exists at ../models/Log
const { log: systemLog } = require('../middleware/logger'); // Renaming to avoid conflict

// @desc    Get all logs (Admin only)
// @route   GET /api/logs
// @access  Private/Admin
exports.getAllLogs = async (req, res) => {
  try {
    // Add pagination for logs as they can grow very large
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default to 100 logs per page
    const skip = (page - 1) * limit;

    const logs = await Log.find({})
      .sort({ timestamp: -1 }) // Show newest logs first
      .skip(skip)
      .limit(limit);
    
    const totalLogs = await Log.countDocuments();

    systemLog(`Admin ${req.user.email} fetched logs page ${page} with limit ${limit}.`, 'info');
    res.json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(totalLogs / limit),
      totalLogs,
    });
  } catch (error) {
    systemLog(`Error fetching all logs: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching logs.' });
  }
};