import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentPlusIcon, 
  ArrowPathIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import BillService from '../../services/BillService';
import DebitService from '../../services/DebitService';
import CompanyService from '../../services/CompanyService';

const BillListPage = () => {
  const [bills, setBills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await CompanyService.getAllCompanies();
        setCompanies(response.data);
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set initial date filters to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
  }, []);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const params = {};
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    if (filterCompany) params.companyId = filterCompany;
    if (filterStatus) params.status = filterStatus;

    try {
      const response = await BillService.getAllBills(params);
      setBills(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch bills.';
      setError(errMsg);
      console.error("Fetch bills error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterCompany, filterStatus]);

  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      fetchBills();
    }
  }, [fetchBills, filterStartDate, filterEndDate]);

  const handleDownloadExcel = async () => {
    try {
      setIsLoading(true);
      const filters = {
        startDate: filterStartDate,
        endDate: filterEndDate,
        companyId: filterCompany,
        status: filterStatus
      };
      const response = await BillService.downloadBulkExcel(filters);
      
      // Generate filename
      let fileName = 'Bills';
      if (filterStartDate && filterEndDate) {
        fileName += `_${filterStartDate}_to_${filterEndDate}`;
      }
      if (filterCompany) {
        const company = companies.find(c => c._id === filterCompany);
        fileName += `_${company?.name || filterCompany}`;
      }
      fileName += '.xlsx';
      
      BillService.triggerDownload(response.data, fileName);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to download Excel.';
      setError(errMsg);
      console.error("Excel download error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsLoading(true);
      const filters = {
        startDate: filterStartDate,
        endDate: filterEndDate,
        companyId: filterCompany,
        status: filterStatus
      };
      const response = await BillService.downloadBulkPdf(filters);
      
      // Generate filename
      let fileName = 'Bills';
      if (filterStartDate && filterEndDate) {
        fileName += `_${filterStartDate}_to_${filterEndDate}`;
      }
      if (filterCompany) {
        const company = companies.find(c => c._id === filterCompany);
        fileName += `_${company?.name || filterCompany}`;
      }
      fileName += '.pdf';
      
      BillService.triggerDownload(response.data, fileName);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to download PDF.';
      setError(errMsg);
      console.error("PDF download error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBill = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await BillService.deleteBill(billId);
        setBills(prevBills => prevBills.filter(b => b._id !== billId));
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete bill.';
        setError(errMsg);
        console.error("Delete bill error:", errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewBill = (billId) => {
    navigate(`/bills/${billId}`);
  };

  const handleCreateDebitNote = async (billId) => {
    try {
      const canHaveDebitNote = await DebitService.checkBillCanHaveDebitNote(billId);
      
      if (canHaveDebitNote.data.canHaveDebitNote) {
        navigate(`/debit-notes/create/${billId}`);
      } else {
        alert(canHaveDebitNote.data.reason || 'Cannot create debit note for this bill');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to check debit note eligibility.';
      setError(errMsg);
      console.error("Check debit note error:", errMsg);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partially paid': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const clearFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
    setFilterCompany('');
    setFilterStatus('');
    if (isMobile) setShowFilters(false);
  };

  if (isLoading && bills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bill Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing bills from {formatDisplayDate(filterStartDate)} to {formatDisplayDate(filterEndDate)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isMobile && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {showFilters ? (
                  <>
                    <XMarkIcon className="h-4 w-4" />
                    Hide Filters
                  </>
                ) : (
                  <>
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    Show Filters
                  </>
                )}
              </button>
            )}
            <div className="flex gap-2">
              <Link
                to="/bills/create"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <DocumentPlusIcon className="h-4 w-4" />
                {!isMobile && 'Create New Bill'}
              </Link>
              <Link
                to="/debit-notes"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                {!isMobile && 'View Debit Notes'}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        {(showFilters || !isMobile) && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
              {isMobile && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date Range Selector */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleMonthChange('prev')}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      disabled={isLoading}
                      aria-label="Previous month"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    <span className="text-gray-400 mx-1">to</span>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    <button 
                      onClick={() => handleMonthChange('next')}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      disabled={isLoading}
                      aria-label="Next month"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Company and Status Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="">All Companies</option>
                    {companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={fetchBills}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <FunnelIcon className="h-4 w-4" />
                  Apply
                </button>
                {!isMobile && (
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Reset
                  </button>
                )}
                <button
                  onClick={handleDownloadExcel}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  {!isMobile && 'Excel'}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  {!isMobile && 'PDF'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && !error && bills.length === 0 && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No bills found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create a new bill.</p>
            <div className="mt-6">
              <Link
                to="/bills/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Bill
              </Link>
            </div>
          </motion.div>
        )}

        {/* Bills Table */}
        {bills.length > 0 && (
          <motion.div
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill #</th>
                    {!isMobile && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill, index) => (
                    <motion.tr
                      key={bill._id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        <button onClick={() => handleViewBill(bill._id)} className="hover:underline">
                          {bill.billNumber}
                        </button>
                      </td>
                      {!isMobile && (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bill.company?.name || bill.companyDetailsSnapshot?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDisplayDate(bill.billDate)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDisplayDate(bill.dueDate)}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        ₹{bill.totalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <motion.button
                            onClick={() => handleViewBill(bill._id)}
                            className="text-blue-600 hover:text-blue-900"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => navigate(`/bills/edit/${bill._id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          {!isMobile && (
                            <motion.button
                              onClick={() => handleCreateDebitNote(bill._id)}
                              className="text-amber-600 hover:text-amber-900"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Create Debit Note"
                            >
                              <DocumentPlusIcon className="h-5 w-5" />
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => handleDeleteBill(bill._id)}
                            className="text-red-600 hover:text-red-900"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <motion.div
            className="fixed bottom-6 right-6 z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Link
              to="/bills/create"
              className="w-14 h-14 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white"
              aria-label="Create new bill"
            >
              <DocumentPlusIcon className="h-6 w-6" />
            </Link>
          </motion.div>
        )}

        {/* Back to Dashboard Link */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BillListPage;