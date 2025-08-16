const Bill = require('../models/Bill');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const { log } = require('../middleware/logger');

// @desc    Get overdue sales bills (pending or partially paid and past due date)
// @route   GET /api/dashboard/overdue-bills
// @access  Private/Admin
const   getOverdueBills = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare with start of today

    const overdueBills = await Bill.find({
      dueDate: { $lt: today },
      status: { $in: ['Pending', 'Partially Paid', 'Overdue'] } // 'Overdue' might be set by a cron job too
    })
    .populate('company', 'name')
    .select('billNumber billDate dueDate totalAmount totalPaidAmount status company')
    .sort({ dueDate: 1 }); // Show oldest due first

    // Optionally, update status to 'Overdue' if not already set and conditions met
    // This can also be a separate scheduled task for better performance
    for (const bill of overdueBills) {
        if (bill.status !== 'Overdue' && bill.status !== 'Paid' && bill.status !== 'Cancelled') {
            const billDueDate = new Date(bill.dueDate);
            billDueDate.setHours(0,0,0,0);
            if (billDueDate < today) {
                bill.status = 'Overdue';
                // Not saving here to keep this a GET request. Status update should be via PUT or a job.
                // await bill.save(); 
            }
        }
    }

    log(`Fetched overdue bills for dashboard by ${req.user.email}`, 'info');
    res.json(overdueBills);
  } catch (error) {
    log(`Error fetching overdue bills: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching overdue bills.' });
  }
};

// @desc    Get overdue purchase bills (unpaid or partially paid and past due date)
// @route   GET /api/dashboard/overdue-purchases
// @access  Private/Admin
const   getOverduePurchases = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overduePurchases = await Purchase.find({
      dueDate: { $lt: today },
      paymentStatus: { $in: ['Unpaid', 'Partially Paid'] }
    })
    .populate('supplierCompany', 'name')
    .select('purchaseBillNumber purchaseBillDate dueDate amount totalPaidAmount paymentStatus supplierCompany')
    .sort({ dueDate: 1 });
    
    // Similar to bills, a status like 'Purchase Overdue' could be added/updated here or by a job.

    log(`Fetched overdue purchases for dashboard by ${req.user.email}`, 'info');
    res.json(overduePurchases);
  } catch (error) {
    log(`Error fetching overdue purchases: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching overdue purchases.' });
  }
};

// @desc    Get account summary (Total IN, Total OUT, Current Balance)
// @route   GET /api/dashboard/account-summary
// @access  Private/Admin
const   getAccountSummary = async (req, res) => {
  try {
    const totalInTransactions = await Transaction.aggregate([
      { $match: { type: 'IN' } },
      { $group: { _id: null, totalIn: { $sum: '$amount' } } }
    ]);

    const totalOutTransactions = await Transaction.aggregate([
      { $match: { type: 'OUT' } },
      { $group: { _id: null, totalOut: { $sum: '$amount' } } }
    ]);

    const totalIn = totalInTransactions.length > 0 ? totalInTransactions[0].totalIn : 0;
    const totalOut = totalOutTransactions.length > 0 ? totalOutTransactions[0].totalOut : 0;
    const currentBalance = totalIn - totalOut;

    // For monthly summary (example for current month)
    const now = new Date();
    const firstDayCurrentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const lastDayCurrentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    const monthlyIn = await Transaction.aggregate([
        { $match: { type: 'IN', paymentDate: { $gte: firstDayCurrentMonth, $lte: lastDayCurrentMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyOut = await Transaction.aggregate([
        { $match: { type: 'OUT', paymentDate: { $gte: firstDayCurrentMonth, $lte: lastDayCurrentMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    log(`Fetched account summary for dashboard by ${req.user.email}`, 'info');
    res.json({
      overall: {
        totalIn: parseFloat(totalIn.toFixed(2)),
        totalOut: parseFloat(totalOut.toFixed(2)),
        currentBalance: parseFloat(currentBalance.toFixed(2)),
      },
      currentMonth: {
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        totalIn: parseFloat((monthlyIn[0]?.total || 0).toFixed(2)),
        totalOut: parseFloat((monthlyOut[0]?.total || 0).toFixed(2)),
      }
    });
  } catch (error) {
    log(`Error fetching account summary: ${error.message}`, 'error');
    res.status(500).json({ message: 'Server error while fetching account summary.' });
  }
};

// @desc    Get monthly IN/OUT transaction summary for the last 12 months
// @route   GET /api/dashboard/monthly-transaction-summary
// @access  Private/Admin
const   getMonthlyTransactionSummary = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11); // Go back 11 months to include current month as 12th
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const results = await Transaction.aggregate([
      {
        $match: {
          paymentDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
            type: '$type',
          },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Format data for chart
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize data arrays for all 12 months
    let currentMonth = new Date(twelveMonthsAgo);
    for (let i = 0; i < 12; i++) {
        labels.push(`${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear().toString().slice(-2)}`);
        incomeData.push(0);
        expenseData.push(0);
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    results.forEach(result => {
      const monthIndex = (result._id.year - twelveMonthsAgo.getFullYear()) * 12 + (result._id.month - (twelveMonthsAgo.getMonth() + 1));
      if (monthIndex >= 0 && monthIndex < 12) { // Ensure it's within our 12-month window
          if (result._id.type === 'IN') {
            incomeData[monthIndex] = parseFloat(result.totalAmount.toFixed(2));
          } else if (result._id.type === 'OUT') {
            expenseData[monthIndex] = parseFloat(result.totalAmount.toFixed(2));
          }
      }
    });

    log(`Fetched monthly transaction summary for dashboard by ${req.user.email}`, 'info');
    res.json({ labels, incomeData, expenseData });

  } catch (error) {
    log(`Error fetching monthly transaction summary: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching monthly transaction summary.' });
  }
};


// @desc    Get monthly sell/buy quantity summary for the last 12 months
// @route   GET /api/dashboard/monthly-material-flow
// @access  Private/Admin
const   getMonthlyMaterialFlowSummary = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Aggregate Sales (from Bills)
    const salesDataRaw = await Bill.aggregate([
      { $match: { billDate: { $gte: twelveMonthsAgo }, status: { $ne: 'Cancelled' } } }, // Exclude cancelled bills
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' },
          },
          totalQuantitySold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Aggregate Purchases (from Purchases)
    const purchaseDataRaw = await Purchase.aggregate([
      { $match: { purchaseBillDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$purchaseBillDate' },
            month: { $month: '$purchaseBillDate' },
          },
          totalQuantityPurchased: { $sum: '$netWeight' }, // Summing netWeight for purchases
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    
    const labels = [];
    const soldData = [];
    const boughtData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let currentMonth = new Date(twelveMonthsAgo);
    for (let i = 0; i < 12; i++) {
        labels.push(`${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear().toString().slice(-2)}`);
        soldData.push(0);
        boughtData.push(0);
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    salesDataRaw.forEach(result => {
      const monthIndex = (result._id.year - twelveMonthsAgo.getFullYear()) * 12 + (result._id.month - (twelveMonthsAgo.getMonth() + 1));
      if (monthIndex >= 0 && monthIndex < 12) {
        soldData[monthIndex] = parseFloat(result.totalQuantitySold.toFixed(3)); // Assuming quantity can have decimals
      }
    });

    purchaseDataRaw.forEach(result => {
      const monthIndex = (result._id.year - twelveMonthsAgo.getFullYear()) * 12 + (result._id.month - (twelveMonthsAgo.getMonth() + 1));
      if (monthIndex >= 0 && monthIndex < 12) {
        boughtData[monthIndex] = parseFloat(result.totalQuantityPurchased.toFixed(3));
      }
    });

    log(`Fetched monthly material flow summary for dashboard by ${req.user.email}`, 'info');
    res.json({ labels, soldData, boughtData });

  } catch (error) {
    log(`Error fetching monthly material flow summary: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching monthly material flow summary.' });
  }
};

// @desc    Get sales bills due in the next 5 days
// @route   GET /api/dashboard/upcoming-bill-dues
// @access  Private/Admin
const   getUpcomingBillDues = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);
    fiveDaysFromNow.setHours(23, 59, 59, 999);

    const upcomingDues = await Bill.find({
      dueDate: { $gte: today, $lte: fiveDaysFromNow },
      status: { $in: ['Pending', 'Partially Paid'] }
    })
    .populate('company', 'name')
    .select('billNumber billDate dueDate totalAmount totalPaidAmount status company')
    .sort({ dueDate: 1 });

    log(`Fetched upcoming bill dues for dashboard by ${req.user.email}`, 'info');
    res.json(upcomingDues);
  } catch (error) {
    log(`Error fetching upcoming bill dues: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching upcoming bill dues.' });
  }
};

// @desc    Get purchase bills due in the next 5 days
// @route   GET /api/dashboard/upcoming-purchase-dues
// @access  Private/Admin
const   getUpcomingPurchaseDues = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);
    fiveDaysFromNow.setHours(23, 59, 59, 999);

    const upcomingDues = await Purchase.find({
      dueDate: { $gte: today, $lte: fiveDaysFromNow },
      paymentStatus: { $in: ['Unpaid', 'Partially Paid'] }
    })
    .populate('supplierCompany', 'name')
    .select('purchaseBillNumber purchaseBillDate dueDate amount totalPaidAmount paymentStatus supplierCompany')
    .sort({ dueDate: 1 });

    log(`Fetched upcoming purchase dues for dashboard by ${req.user.email}`, 'info');
    res.json(upcomingDues);
  } catch (error) {
    log(`Error fetching upcoming purchase dues: ${error.message} - Stack: ${error.stack}`, 'error');
    res.status(500).json({ message: 'Server error while fetching upcoming purchase dues.' });
  }
};

module.exports = {
  getOverdueBills,
  getOverduePurchases,
  getAccountSummary,
  getMonthlyTransactionSummary,
  getMonthlyMaterialFlowSummary,
  getUpcomingBillDues,
  getUpcomingPurchaseDues
};
