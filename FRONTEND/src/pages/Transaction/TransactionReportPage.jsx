import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ReportService from '../../services/ReportService';
import CompanyService from '../../services/CompanyService';

const TransactionReportPage = () => {
  // Helper function to format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function for current month's date range
  const getCurrentMonthDateRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      startDate: formatDateForInput(firstDay),
      endDate: formatDateForInput(lastDay)
    };
  };

  const [reportData, setReportData] = useState({ transactions: [], summary: { totalIn: 0, totalOut: 0, netFlow: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  
  const initialDates = getCurrentMonthDateRange();
  const [filters, setFilters] = useState({
    companyId: '',
    type: '',
    paymentMethod: '',
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    descriptionSearch: '',
  });
  
  const paymentMethods = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Other'];

  useEffect(() => {
    CompanyService.getAllCompanies()
      .then(response => setCompanies(response.data))
      .catch(err => console.error("Failed to fetch companies for filter:", err));
  }, []);

  const fetchTransactionReport = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (currentFilters.companyId) params.companyId = currentFilters.companyId;
      if (currentFilters.type) params.type = currentFilters.type;
      if (currentFilters.paymentMethod) params.paymentMethod = currentFilters.paymentMethod;
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;
      if (currentFilters.descriptionSearch) params.descriptionSearch = currentFilters.descriptionSearch;

      const response = await ReportService.getTransactionReport(params);
      setReportData(response.data || { transactions: [], summary: { totalIn: 0, totalOut: 0, netFlow: 0 } });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch transaction report.';
      setError(errMsg);
      setReportData({ transactions: [], summary: { totalIn: 0, totalOut: 0, netFlow: 0 } });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchTransactionReport(filters);
    }
  }, [filters.startDate, filters.endDate]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for start date to adjust end date to end of month
    if (name === 'startDate') {
      const selectedDate = new Date(value);
      const lastDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0
      );
      setFilters(prev => ({
        ...prev,
        startDate: value,
        endDate: formatDateForInput(lastDay)
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleApplyFilters = () => {
    fetchTransactionReport(filters);
  };
  
  const handleClearFilters = () => {
    const currentMonthDates = getCurrentMonthDateRange();
    const clearedFilters = {
      companyId: '', 
      type: '', 
      paymentMethod: '',
      startDate: currentMonthDates.startDate,
      endDate: currentMonthDates.endDate,
      descriptionSearch: ''
    };
    setFilters(clearedFilters);
    fetchTransactionReport(clearedFilters);
  };

  const handleMonthChange = (direction) => {
    const currentDate = new Date(filters.startDate);
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

    setFilters(prev => ({
      ...prev,
      startDate: formatDateForInput(newFirstDay),
      endDate: formatDateForInput(newLastDay)
    }));
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    setError('');
    try {
      await ReportService.exportTransactionReportCSV(filters);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to export CSV.';
      setError(errMsg);
    } finally {
      setIsExporting(false);
    }
  };
  
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <motion.div
      className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 text-center sm:text-left"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Transaction Report
        </motion.h1>
        <Link
          to="/dashboard"
          className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filters Section */}
      <motion.div
        className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Company Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <label htmlFor="companyId" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company</label>
            <select
              id="companyId"
              name="companyId"
              value={filters.companyId}
              onChange={handleFilterChange}
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company._id} value={company._id}>{company.name}</option>
              ))}
            </select>
          </motion.div>

          {/* Type Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="IN">IN (Received)</option>
              <option value="OUT">OUT (Paid)</option>
            </select>
          </motion.div>

          {/* Payment Method Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <label htmlFor="paymentMethod" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            >
              <option value="">All Methods</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </motion.div>

          {/* Date Range Filters with Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <button 
              onClick={() => handleMonthChange('prev')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isLoading || isExporting}
            >
              &lt;
            </button>
            <div className="flex-1">
              <label htmlFor="startDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="flex-1">
              <label htmlFor="endDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
              />
            </div>
            <button 
              onClick={() => handleMonthChange('next')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isLoading || isExporting}
            >
              &gt;
            </button>
          </motion.div>

          {/* Description Search */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <label htmlFor="descriptionSearch" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              id="descriptionSearch"
              name="descriptionSearch"
              value={filters.descriptionSearch}
              onChange={handleFilterChange}
              placeholder="Search in description..."
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-2 sm:gap-4 col-span-full sm:col-span-2 lg:col-span-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
              disabled={isLoading || isExporting}
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105"
              disabled={isLoading || isExporting}
            >
              Clear Filters
            </button>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            className="text-center text-red-500 mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 rounded-lg text-xs sm:text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Error: {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Summary Totals */}
      {!isLoading && !error && (
        <motion.div
          className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {[
            { label: 'Total Income', value: reportData.summary?.totalIn, color: 'green' },
            { label: 'Total Expenses', value: reportData.summary?.totalOut, color: 'red' },
            { label: 'Net Flow', value: reportData.summary?.netFlow, color: 'blue' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className={`p-4 sm:p-6 bg-white rounded-lg shadow border-t-4 border-${item.color}-500`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <p className={`text-xs sm:text-sm font-medium text-${item.color}-600`}>{item.label}</p>
              <p className={`text-xl sm:text-2xl font-bold text-${item.color}-700`}>
                ₹{item.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {isLoading && (
        <motion.div
          className="text-center py-10 text-gray-500 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Loading report...
        </motion.div>
      )}

      {!isLoading && !error && reportData.transactions.length === 0 && (
        <motion.div
          className="text-center py-8 sm:py-12 bg-white shadow-lg rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-500 text-sm sm:text-base">No transactions found matching your criteria.</p>
        </motion.div>
      )}

      {!isLoading && reportData.transactions.length > 0 && (
        <>
          <motion.div
            className="flex justify-end mb-4 sm:mb-6 gap-2 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={handleExportCSV}
              disabled={isExporting || isLoading}
              className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </motion.div>
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
                    {['Date', 'Type', 'Description', 'Company', 'Amount', 'Method', 'Ref. No.', 'Notes'].map((header) => (
                      <th
                        key={header}
                        className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Amount' ? 'text-right' : ''}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.transactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction._id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        {formatDisplayDate(transaction.paymentDate)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`font-semibold ${transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-normal text-xs sm:text-sm text-gray-700 max-w-[150px] sm:max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        {transaction.company?.name || 'N/A'}
                      </td>
                      <td className={`px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-right font-medium ${transaction.type === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                        ₹{transaction.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        {transaction.paymentMethod}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 truncate max-w-[80px] sm:max-w-[100px]" title={transaction.referenceNumber}>
                        {transaction.referenceNumber || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-normal text-xs sm:text-sm text-gray-600 max-w-[150px] sm:max-w-xs truncate" title={transaction.notes}>
                        {transaction.notes || 'N/A'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default TransactionReportPage;