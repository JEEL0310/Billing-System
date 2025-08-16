import  React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, PencilIcon, TrashIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import TransactionService from '../../services/TransactionService';
import CompanyService from '../../services/CompanyService';
import WorkerService from '../../services/WorkerService';
import DashboardService from '../../services/DashboardService';

const TransactionListPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [topTransactions, setTopTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [overallSummary, setOverallSummary] = useState(null);
  const [filteredPeriodSummary, setFilteredPeriodSummary] = useState({ filteredTotalIn: 0, filteredTotalOut: 0 });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterWorkerId, setFilterWorkerId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const paymentMethods = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Other'];
  const categories = [
    { value: 'BillPayment', label: 'Bill Payment' },
    { value: 'PurchasePayment', label: 'Purchase Payment' },
    { value: 'Salary', label: 'Salary' },
    { value: 'MiscellaneousIncome', label: 'Misc. Income' },
    { value: 'MiscellaneousExpense', label: 'Misc. Expense' },
    { value: 'Other', label: 'Other' }
  ];

  // Helper function to format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set initial date filters to current month (proper boundaries)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingSummary(true);
      try {
        const companyRes = await CompanyService.getAllCompanies();
        setCompanies(companyRes.data);
        const workerRes = await WorkerService.getAllWorkers();
        setWorkers(workerRes.data);
        const overallSummaryRes = await DashboardService.getAccountSummary();
        setOverallSummary(overallSummaryRes.data);
      } catch (err) {
        setError("Failed to load initial page data.");
      }
      setIsLoadingSummary(false);
    };
    fetchInitialData();
  }, []);

  const handleMonthChange = (direction) => {
    const currentDate = new Date(filterStartDate);
    let newYear = currentDate.getFullYear();
    let newMonth = currentDate.getMonth();

    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    }

    const newFirstDay = new Date(newYear, newMonth, 1);
    const newLastDay = new Date(newYear, newMonth + 1, 0);

    setFilterStartDate(formatDateForInput(newFirstDay));
    setFilterEndDate(formatDateForInput(newLastDay));
  };

  const fetchTransactionsAndPeriodSummary = useCallback(async () => {
    if (!filterStartDate || !filterEndDate) return;
    setIsLoading(true);
    setError('');
    const params = {};
    if (filterCompanyId) params.companyId = filterCompanyId;
    if (filterWorkerId) params.workerId = filterWorkerId;
    if (filterCategory) params.category = filterCategory;
    if (filterType) params.type = filterType;
    if (filterPaymentMethod) params.paymentMethod = filterPaymentMethod;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;

    try {
      const [transactionsResponse, periodSummaryResponse] = await Promise.all([
        TransactionService.getAllTransactions(params),
        TransactionService.getFilteredSummary(params)
      ]);
      setTransactions(transactionsResponse.data);
      setFilteredPeriodSummary(periodSummaryResponse.data);

      // Calculate top 10 transactions for the selected month
      const selectedMonthTransactions = transactionsResponse.data
        .filter(t => new Date(t.paymentDate).getMonth() === new Date(filterStartDate).getMonth())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
      setTopTransactions(selectedMonthTransactions);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch transaction data.';
      setError(errMsg);
      setFilteredPeriodSummary({ filteredTotalIn: 0, filteredTotalOut: 0 });
      setTopTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterCompanyId, filterWorkerId, filterCategory, filterType, filterPaymentMethod, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchTransactionsAndPeriodSummary();
  }, [fetchTransactionsAndPeriodSummary]);

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction? This will attempt to reverse linked payments on bills/purchases.')) {
      setIsLoading(true);
      try {
        await TransactionService.deleteTransaction(transactionId);
        setTransactions(prevTransactions => prevTransactions.filter(t => t._id !== transactionId));
        setTopTransactions(prevTop => prevTop.filter(t => t._id !== transactionId));
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete transaction.';
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewTransaction = (transactionId) => {
    const transaction = transactions.find(t => t._id === transactionId) || topTransactions.find(t => t._id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const clearFilters = () => {
    setFilterCompanyId('');
    setFilterWorkerId('');
    setFilterCategory('');
    setFilterType('');
    setFilterPaymentMethod('');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
  };

  // Export functions
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      const params = buildExportParams();
      await TransactionService.exportToExcel(params, `transactions_${filterStartDate}_to_${filterEndDate}`);
    } catch (err) {
      setExportError(err.message || 'Failed to export to Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      const params = buildExportParams();
      await TransactionService.exportToPDF(params, `transactions_${filterStartDate}_to_${filterEndDate}`);
    } catch (err) {
      setExportError(err.message || 'Failed to export to PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const buildExportParams = () => {
    const params = {};
    if (filterCompanyId) params.companyId = filterCompanyId;
    if (filterWorkerId) params.workerId = filterWorkerId;
    if (filterCategory) params.category = filterCategory;
    if (filterType) params.type = filterType;
    if (filterPaymentMethod) params.paymentMethod = filterPaymentMethod;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    return params;
  };

  if ((isLoading || isLoadingSummary) && transactions.length === 0) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading data...
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <motion.h1
          className="text-4xl font-extrabold text-gray-800"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          All Transactions
        </motion.h1>
        <Link
          to="/transactions/add"
          className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
        >
          Add New Transaction
        </Link>
      </div>

      {/* Summaries Section */}
      <motion.div
        className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[
          { label: 'Overall Current Balance', value: overallSummary?.overall?.currentBalance, color: 'blue', loading: isLoadingSummary },
          { label: 'Selected Period: Total IN', value: filteredPeriodSummary?.filteredTotalIn, color: 'green', loading: isLoading },
          { label: 'Selected Period: Total OUT', value: filteredPeriodSummary?.filteredTotalOut, color: 'red', loading: isLoading },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            className={`p-6 bg-white rounded-xl shadow-lg border-t-4 border-${item.color}-500`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <h3 className={`text-sm font-medium text-${item.color}-600`}>{item.label}</h3>
            {item.loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : (
              <p className={`text-2xl font-bold text-${item.color}-700`}>
                INR {item.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </p>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Export Error Display */}
      <AnimatePresence>
        {exportError && (
          <motion.div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p>Export Error: {exportError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Section with Export Buttons */}
      <motion.div
        className="bg-white shadow-lg rounded-xl p-6 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          <div className="flex gap-2">
            <motion.button
              onClick={handleExportExcel}
              disabled={isExporting || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export Excel
            </motion.button>
            <motion.button
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export PDF
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Start Date with Month Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <button 
              onClick={() => handleMonthChange('prev')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              &lt;
            </button>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const lastDay = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1,
                    0
                  );
                  setFilterStartDate(e.target.value);
                  setFilterEndDate(formatDateForInput(lastDay));
                }}
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </motion.div>

          {/* End Date with Month Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <button 
              onClick={() => handleMonthChange('next')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              &gt;
            </button>
          </motion.div>

          {/* Other Filter Fields */}
          {[
            { label: 'Category', value: filterCategory, onChange: setFilterCategory, options: [{ value: '', label: 'All Categories' }, ...categories] },
            { label: 'Type', value: filterType, onChange: setFilterType, options: [{ value: '', label: 'All Types' }, { value: 'IN', label: 'IN (Received)' }, { value: 'OUT', label: 'OUT (Paid)' }] },
            { label: 'Company', value: filterCompanyId, onChange: setFilterCompanyId, options: [{ value: '', label: 'All Companies' }, ...companies.map(c => ({ value: c._id, label: c.name }))] },
            { label: 'Worker', value: filterWorkerId, onChange: setFilterWorkerId, options: [{ value: '', label: 'All Workers' }, ...workers.map(w => ({ value: w._id, label: w.name }))] },
            { label: 'Method', value: filterPaymentMethod, onChange: setFilterPaymentMethod, options: [{ value: '', label: 'All Methods' }, ...paymentMethods.map(m => ({ value: m, label: m }))] },
          ].map((field, index) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: (index + 2) * 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </motion.div>
          ))}

          <motion.div
            className="flex gap-4 sm:col-span-2 lg:col-span-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <button
              onClick={fetchTransactionsAndPeriodSummary}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
              disabled={isLoading}
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105"
              disabled={isLoading}
            >
              Reset Filters
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Modal for Transaction Details */}
      <AnimatePresence>
        {isModalOpen && selectedTransaction && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Transaction Details</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {selectedTransaction._id}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {formatDisplayDate(selectedTransaction.paymentDate)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {selectedTransaction.type}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Amount:</span> ₹{selectedTransaction.amount?.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Method:</span> {selectedTransaction.paymentMethod}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {selectedTransaction.description}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {selectedTransaction.notes || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Company/Worker:</span> {selectedTransaction.company?.name || selectedTransaction.worker?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reference:</span> {selectedTransaction.referenceNumber || 'N/A'}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-center text-red-500 mb-6 p-4 bg-red-50 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Error: {error}
          </motion.p>
        )}
      </AnimatePresence>

      {!isLoading && !error && transactions.length === 0 && (
        <motion.div
          className="text-center py-12 bg-white shadow-lg rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-500 text-lg">No transactions found matching your criteria.</p>
        </motion.div>
      )}

      {transactions.length > 0 && (
        <motion.div
          className="bg-white shadow-lg rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="overflow-x-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {['Date', 'Type', 'Category', 'Description', 'Company / Worker', 'Amount', 'Method', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Amount' || header === 'Actions' ? 'text-right' : ''}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction._id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-4 py-4 text-sm text-gray-600">{formatDisplayDate(transaction.paymentDate)}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`font-semibold ${transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{transaction.category}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 max-w-[200px] truncate" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[150px] truncate">
                      {transaction.company?.name || transaction.worker?.name || 'N/A'}
                    </td>
                    <td className={`px-4 py-4 text-sm text-right font-medium ${transaction.type === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                      {transaction.amount?.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{transaction.paymentMethod}</td>
                    <td className="px-4 py-4 text-right text-sm font-medium flex justify-end space-x-2">
                      <motion.button
                        onClick={() => handleViewTransaction(transaction._id)}
                        className="relative text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Details"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <EyeIcon className="h-5 w-5" />
                        <span className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                      </motion.button>
                      <motion.button
                        onClick={() => navigate(`/transactions/edit/${transaction._id}`)}
                        className="relative text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Edit Transaction"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <PencilIcon className="h-5 w-5" />
                        <span className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteTransaction(transaction._id)}
                        className="relative text-red-600 hover:text-red-900 transition-colors"
                        disabled={isLoading}
                        title="Delete Transaction"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <TrashIcon className="h-5 w-5" />
                        <span className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">Delete</span>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default TransactionListPage;