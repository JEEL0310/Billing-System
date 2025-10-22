import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, PencilIcon, TrashIcon, XMarkIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  Filter,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import AddTransactionPage from './AddTransactionPage';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);
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

  // Indices for mobile carousels
  const [currentTransactionIndex, setCurrentTransactionIndex] = useState(0);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(true);
      } else {
        setShowFilters(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset index when transactions change
  useEffect(() => {
    setCurrentTransactionIndex(0);
  }, [transactions]);

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
        const [companyRes, workerRes, overallSummaryRes] = await Promise.all([
          CompanyService.getAllCompanies(),
          WorkerService.getAllWorkers(),
          DashboardService.getAccountSummary()
        ]);
        setCompanies(companyRes.data);
        setWorkers(workerRes.data);
        setOverallSummary(overallSummaryRes.data);
      } catch (error) {
          console.error('Failed to load initial page data', error);
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
      console.log('Filtered Period Summary:', periodSummaryResponse.data);

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
    if (isMobile) setShowFilters(false);
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

// Local StatCard component (styled like CompanyPage) - Updated for mobile
const StatCard = ({ title, value, icon, gradient = 'from-slate-500 to-slate-600', bgGradient = 'from-slate-50 to-slate-100', loading }) => (
  <motion.div
    className={`relative p-6 bg-gradient-to-br ${bgGradient} rounded-xl shadow-lg border border-slate-200/50 overflow-hidden group ${isMobile ? 'p-4 min-w-[80%] snap-center' : ''}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    whileHover={{ y: isMobile ? 0 : -2 }}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
    <div className={`relative z-10 ${isMobile ? 'text-center' : 'flex items-start justify-between'}`}>
      {!isMobile && (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-lg`}>{icon}</div>
        </div>
      )}
      <div className={isMobile ? '' : 'ml-auto text-right'}>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {loading ? (
          <p className="text-gray-400 text-sm mt-1">Loading...</p>
        ) : (
          <p className={`font-bold text-slate-800 mt-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>INR {value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
        )}
      </div>
    </div>
  </motion.div>
);

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

  // Mobile View Renderer
  const renderMobileView = () => {
    const summaryItems = [
      {
        title: "Balance",
        value: filteredPeriodSummary?.filteredTotalIn - filteredPeriodSummary?.filteredTotalOut,
        gradient: "from-slate-500 to-slate-600",
        bgGradient: "from-slate-50 to-slate-100",
      },
      {
        title: "Total IN",
        value: filteredPeriodSummary?.filteredTotalIn,
        gradient: "from-emerald-500 to-emerald-600",
        bgGradient: "from-emerald-50 to-emerald-100",
      },
      {
        title: "Total OUT",
        value: filteredPeriodSummary?.filteredTotalOut,
        gradient: "from-rose-500 to-rose-600",
        bgGradient: "from-rose-50 to-rose-100",
      }
    ];

    return (
      <>
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl">
                <ArrowDownTrayIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <motion.h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent" initial={{ y: -20 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
                  Transaction Management
                </motion.h1>
                <p className="text-slate-500 text-xs font-medium">Manage transactions</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-200 ${
                showFilters
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  : "bg-white text-slate-700 hover:bg-slate-50 shadow-md border border-slate-200"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showFilters ? (
                <>
                  <X className="h-4 w-4 mr-2 inline" />
                  Hide Filters
                </>
              ) : (
                <>
                  <SlidersHorizontal className="h-4 w-4 mr-2 inline" />
                  Filters
                </>
              )}
            </motion.button>

            {isMobile && (
              <>
                      <motion.button
                        onClick={() => setShowAddModal(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <Plus className="h-6 w-6" />
                      </motion.button>

                      <motion.button
                    onClick={handleExportExcel}
                    className="px-3 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    disabled={isLoading || isExporting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs">Excel</span>
                  </motion.button>

                  <motion.button
                    onClick={handleExportPDF}
                    className="px-3 py-2 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-all flex items-center space-x-2"
                    disabled={isLoading || isExporting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">PDF</span>
                  </motion.button>
                      </>
                    )}

            
          </div>
        </div>

        {/* Export Error Display */}
        <AnimatePresence>
          {exportError && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-1 rounded-full bg-red-100">
                <X className="h-4 w-4" />
              </div>
              Export Error: {exportError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-50 rounded-xl">
                    <Filter className="h-5 w-5 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Filters</h2>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Action Buttons Mobile */}
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    onClick={fetchTransactionsAndPeriodSummary}
                    className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="text-xs">Apply</span>
                  </motion.button>

                  <motion.button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center space-x-2"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="h-4 w-4" />
                    <span className="text-xs">Clear</span>
                  </motion.button>
                </div>

                {/* Date Range */}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => handleMonthChange("prev")}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </motion.button>

                    <div className="flex space-x-2 flex-1">
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="px-2 py-2.5 text-sm border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white w-full"
                      />
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="px-2 py-2.5 text-sm border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white w-full"
                      />
                    </div>

                    <motion.button
                      onClick={() => handleMonthChange("next")}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </motion.button>
                  </div>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-2 gap-4'>
                {/* Type Filter */}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-2 py-2.5 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="IN">IN (Received)</option>
                    <option value="OUT">OUT (Paid)</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-2 py-2.5 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Company Filter */}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
                  <select
                    value={filterCompanyId}
                    onChange={(e) => setFilterCompanyId(e.target.value)}
                    className="w-full px-2 py-2.5 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                  >
                    <option value="">All Companies</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Worker Filter */}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Worker</label>
                  <select
                    value={filterWorkerId}
                    onChange={(e) => setFilterWorkerId(e.target.value)}
                    className="w-full px-2 py-2.5 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                  >
                    <option value="">All Workers</option>
                    {workers.map((worker) => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method Filter */}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                  <select
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                    className="w-full px-2 py-2.5 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                  >
                    <option value="">All Methods</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards - Simple Grid for Mobile */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {summaryItems.map((item, idx) => (
            <StatCard
              key={idx}
              title={item.title}
              value={item.value}
              gradient={item.gradient}
              bgGradient={item.bgGradient}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Transaction Cards with Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 mb-6">
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase">Transactions</h3>
              <p className="text-xs text-slate-500">{currentTransactionIndex + 1} of {transactions.length || 0}</p>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="relative">
              <motion.div
                key={transactions[currentTransactionIndex]._id}
                className="bg-white/80 backdrop-blur-sm rounded-xl border p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">
                      {transactions[currentTransactionIndex].company?.name || transactions[currentTransactionIndex].worker?.name || 'N/A'}
                    </h3>
                    <p className="text-xs text-slate-500">{transactions[currentTransactionIndex].category}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                      transactions[currentTransactionIndex].type === 'IN'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {transactions[currentTransactionIndex].type}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-600 mb-3">
                  <p><b>Date:</b> {formatDisplayDate(transactions[currentTransactionIndex].paymentDate)}</p>
                  <p><b>Amount:</b> ₹{transactions[currentTransactionIndex].amount?.toFixed(2)}</p>
                  <p><b>Method:</b> {transactions[currentTransactionIndex].paymentMethod}</p>
                  <p><b>Description:</b> {transactions[currentTransactionIndex].description || '-'}</p>
                </div>

                <div className="flex justify-between gap-2">
                  <motion.button
                    onClick={() => handleViewTransaction(transactions[currentTransactionIndex]._id)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    <EyeIcon className="h-4 w-4" /> View
                  </motion.button>
                  <motion.button
                    onClick={() => navigate(`/transactions/edit/${transactions[currentTransactionIndex]._id}`)}
                    className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    <PencilIcon className="h-4 w-4" /> Edit
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeleteTransaction(transactions[currentTransactionIndex]._id)}
                    className="flex-1 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl font-medium hover:bg-rose-100 transition-colors flex items-center justify-center gap-1 text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    <TrashIcon className="h-4 w-4" /> Delete
                  </motion.button>
                </div>
              </motion.div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-4 px-2">
                <motion.button
                  onClick={() => setCurrentTransactionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentTransactionIndex === 0}
                  className={`p-2 rounded-lg ${
                    currentTransactionIndex === 0
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  } transition-colors`}
                  whileHover={currentTransactionIndex !== 0 ? { scale: 1.05 } : {}}
                  whileTap={currentTransactionIndex !== 0 ? { scale: 0.95 } : {}}
                >
                  <ChevronLeft className="h-5 w-5" />
                </motion.button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, transactions.length))].map((_, i) => {
                    const pageIndex = Math.floor(currentTransactionIndex / 5) * 5 + i;
                    if (pageIndex >= transactions.length) return null;
                    return (
                      <motion.button
                        key={pageIndex}
                        onClick={() => setCurrentTransactionIndex(pageIndex)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentTransactionIndex === pageIndex
                            ? 'bg-violet-600 scale-125'
                            : 'bg-slate-300 hover:bg-violet-400'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                      />
                    );
                  })}
                </div>
                <motion.button
                  onClick={() => setCurrentTransactionIndex(prev => 
                    Math.min(transactions.length - 1, prev + 1)
                  )}
                  disabled={currentTransactionIndex === transactions.length - 1}
                  className={`p-2 rounded-lg ${
                    currentTransactionIndex === transactions.length - 1
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  } transition-colors`}
                  whileHover={currentTransactionIndex !== transactions.length - 1 ? { scale: 1.05 } : {}}
                  whileTap={currentTransactionIndex !== transactions.length - 1 ? { scale: 0.95 } : {}}
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No transactions found</p>
          )}
        </div>

        <div className="text-center text-slate-500 text-xs mt-6 pb-6 italic">
          For better experience, open this page on Desktop
        </div>
      </>
    );
  };

  return (
    <motion.div
      className="container mx-auto p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Add Transaction Modal - Available for both mobile and desktop */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              className={`relative bg-white light:bg-gray-800 rounded-2xl w-full ${isMobile ? 'max-w-[95%] max-h-[95vh]' : 'max-w-4xl max-h-[90vh]'} overflow-hidden shadow-2xl border border-gray-200/50 light:border-gray-700/50`}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Glass Effect */}
              <div className="sticky top-0 z-10 backdrop-blur-md bg-white/90 light:bg-gray-800/90 border-b border-gray-200/50 light:border-gray-700/50 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg">
                      <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 light:from-white light:to-gray-200 bg-clip-text text-transparent">
                        Add New Transaction
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 light:text-gray-400 font-medium">
                        Enter the details for your new transaction
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 light:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 light:text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content with Scroll */}
              <div className={`relative px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto ${isMobile ? 'max-h-[calc(95vh-100px)]' : 'max-h-[calc(90vh-120px)]'}`}>
                <AddTransactionPage 
                  onSuccess={() => {
                    setShowAddModal(false);
                    fetchTransactionsAndPeriodSummary();
                  }} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile ? (
        renderMobileView()
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl">
                  <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <motion.h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent" initial={{ y: -20 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
                    Transaction Management
                  </motion.h1>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">Manage transactions, reports and adds</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">

              <div className="flex">
                <motion.button
                  onClick={() => setShowAddModal(true)}
                  className="group px-3 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-xs sm:text-base">Add Transaction</span>
                </motion.button>
              </div>
            </div>
          </div>

      {/* Summaries Section */}
      <div>
          <motion.div
            className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StatCard
              title="Overall Current Month Balance"
              value={filteredPeriodSummary?.filteredTotalIn - filteredPeriodSummary?.filteredTotalOut}
              icon={<svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>}
              gradient="from-slate-500 to-slate-600"
              bgGradient="from-slate-50 to-slate-100"
              loading={isLoadingSummary}
            />

            <StatCard
              title="Selected Period: Total IN"
              value={filteredPeriodSummary?.filteredTotalIn}
              icon={<svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              gradient="from-emerald-500 to-emerald-600"
              bgGradient="from-emerald-50 to-emerald-100"
              loading={isLoading}
            />

            <StatCard
              title="Selected Period: Total OUT"
              value={filteredPeriodSummary?.filteredTotalOut}
              icon={<svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>}
              gradient="from-rose-500 to-rose-600"
              bgGradient="from-rose-50 to-rose-100"
              loading={isLoading}
            />
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

          {/* Filters Section */}
          <AnimatePresence>
            {(showFilters || !isMobile) && (
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 mb-8"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-50 rounded-xl">
                      <Filter className="h-5 w-5 text-violet-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Filters</h2>
                  </div>

                  {/* Action Buttons Desktop */}
                  <div className="hidden md:flex flex-wrap gap-3">
                    <motion.button
                      onClick={fetchTransactionsAndPeriodSummary}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Filter className="h-4 w-4" />
                      <span>Apply Filters</span>
                    </motion.button>

                    <motion.button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center space-x-2"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <X className="h-4 w-4" />
                      <span>Reset</span>
                    </motion.button>

                    <motion.button
                      onClick={handleExportExcel}
                      className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-2"
                      disabled={isLoading || isExporting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className="h-4 w-4" />
                      <span>Excel</span>
                    </motion.button>

                    <motion.button
                      onClick={handleExportPDF}
                      className="px-6 py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-all flex items-center space-x-2"
                      disabled={isLoading || isExporting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FileText className="h-4 w-4" />
                      <span>PDF</span>
                    </motion.button>
                  </div>
                </div>

                <div className="flex md:flex-row flex-col md:items-end items-start gap-4 md:flex-wrap">
                  {/* Action Buttons Mobile */}
                  <div className="md:hidden flex flex-wrap gap-2 md:gap-3">
                    <motion.button
                      onClick={fetchTransactionsAndPeriodSummary}
                      className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      <span className="text-xs">Apply</span>
                    </motion.button>

                    <motion.button
                      onClick={clearFilters}
                      className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center space-x-2"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <X className="h-4 w-4" />
                      <span className="text-xs">Clear</span>
                    </motion.button>
                  </div>

                  {/* Date Range */}
                  <div className="w-full md:flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => handleMonthChange("prev")}
                        className="p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                      </motion.button>

                      <div className="flex space-x-2 flex-1">
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="px-2 py-2.5 text-sm border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white md:w-40 w-full"
                        />
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="px-2 py-2.5 text-sm border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white md:w-40 w-full"
                        />
                      </div>

                      <motion.button
                        onClick={() => handleMonthChange("next")}
                        className="p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div className="w-full md:flex-1 md:min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-2 py-2.5 md:px-4 md:py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="IN">IN (Received)</option>
                      <option value="OUT">OUT (Paid)</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="w-full md:flex-1 md:min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-2 py-2.5 md:px-4 md:py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Company Filter */}
                  <div className="w-full md:flex-1 md:min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
                    <select
                      value={filterCompanyId}
                      onChange={(e) => setFilterCompanyId(e.target.value)}
                      className="w-full px-2 py-2.5 md:px-4 md:py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                    >
                      <option value="">All Companies</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Worker Filter */}
                  <div className="w-full md:flex-1 md:min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Worker</label>
                    <select
                      value={filterWorkerId}
                      onChange={(e) => setFilterWorkerId(e.target.value)}
                      className="w-full px-2 py-2.5 md:px-4 md:py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                    >
                      <option value="">All Workers</option>
                      {workers.map((worker) => (
                        <option key={worker._id} value={worker._id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method Filter */}
                  <div className="w-full md:flex-1 md:min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                    <select
                      value={filterPaymentMethod}
                      onChange={(e) => setFilterPaymentMethod(e.target.value)}
                      className="w-full px-2 py-2.5 md:px-4 md:py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                    >
                      <option value="">All Methods</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              <div className="overflow-x-auto">
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
                          </motion.button>
                          <motion.button
                            onClick={() => navigate(`/transactions/edit/${transaction._id}`)}
                            className="relative text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Edit Transaction"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
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
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
        </>
      )}
    </motion.div>
  );
};

export default TransactionListPage;