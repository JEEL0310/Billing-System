import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import PurchaseService from '../../services/PurchaseService';
import CompanyService from '../../services/CompanyService';

const PurchaseListPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [suppliers, setSuppliers] = useState([]);
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partially paid', label: 'Partially Paid' },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(true); // Show filters by default on desktop
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

    // Fetch suppliers - only those that are Buyers or Both
    const fetchSuppliers = async () => {
      try {
        const response = await CompanyService.getAllCompanies();
        const filteredSuppliers = response.data.filter(
          (company) => company.companyType === 'Buyer' || company.companyType === 'Both'
        );
        setSuppliers(filteredSuppliers);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
      }
    };
    fetchSuppliers();
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

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        startDate: filterStartDate,
        endDate: filterEndDate,
        supplierId: filterSupplierId,
        status: filterStatus,
      };
      const response = await PurchaseService.getAllPurchases(params);
      setPurchases(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch purchase records.';
      setError(errMsg);
      console.error('Fetch purchases error:', errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterSupplierId, filterStatus]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleDownloadExcel = async () => {
    try {
      setIsLoading(true);
      const filters = {
        startDate: filterStartDate,
        endDate: filterEndDate,
        supplierId: filterSupplierId,
        status: filterStatus,
      };
      const response = await PurchaseService.downloadPurchasesExcel(filters);

      let fileName = 'Purchases';
      if (filterStartDate && filterEndDate) {
        fileName += `_${filterStartDate}_to_${filterEndDate}`;
      }
      if (filterSupplierId) {
        const supplier = suppliers.find((s) => s._id === filterSupplierId);
        fileName += `_${supplier?.name || filterSupplierId}`;
      }
      fileName += '.xlsx';

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to download Excel.';
      setError(errMsg);
      console.error('Excel download error:', errMsg);
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
        supplierId: filterSupplierId,
        status: filterStatus,
      };
      const response = await PurchaseService.downloadPurchasesPdf(filters);

      let fileName = 'Purchases';
      if (filterStartDate && filterEndDate) {
        fileName += `_${filterStartDate}_to_${filterEndDate}`;
      }
      if (filterSupplierId) {
        const supplier = suppliers.find((s) => s._id === filterSupplierId);
        fileName += `_${supplier?.name || filterSupplierId}`;
      }
      fileName += '.pdf';

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to download PDF.';
      setError(errMsg);
      console.error('PDF download error:', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (window.confirm('Are you sure you want to delete this purchase record? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await PurchaseService.deletePurchase(purchaseId);
        setPurchases((prevPurchases) => prevPurchases.filter((p) => p._id !== purchaseId));
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete purchase record.';
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewPurchase = (purchaseId) => {
    navigate(`/purchases/${purchaseId}`);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'partially paid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setFilterSupplierId('');
    setFilterStatus('');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
    if (isMobile) setShowFilters(false);
  };

  if (isLoading && purchases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <p className="text-gray-600">Loading purchases...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Raw Material Purchases</h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing purchases from {formatDisplayDate(filterStartDate)} to {formatDisplayDate(filterEndDate)}
            </p>
          </div>
          <div className="flex gap-2">
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
                    <FunnelIcon className="h-4 w-4" />
                    Show Filters
                  </>
                )}
              </button>
            )}
            <Link
              to="/purchases/add"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <DocumentTextIcon className="h-4 w-4" />
              {!isMobile && 'Add Purchase'}
            </Link>
          </div>
        </motion.div>

        {/* Filters Section */}
        {(showFilters || !isMobile) && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Excel
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Range Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <button
                    onClick={() => handleMonthChange('prev')}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                    aria-label="Previous month"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
                      setFilterStartDate(e.target.value);
                      setFilterEndDate(formatDateForInput(lastDay));
                    }}
                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-white"
                    disabled={isLoading}
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-white"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleMonthChange('next')}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                    aria-label="Next month"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Supplier Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <select
                  value={filterSupplierId}
                  onChange={(e) => setFilterSupplierId(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-white"
                  disabled={isLoading}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} ({supplier.companyType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-white"
                  disabled={isLoading}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={fetchPurchases}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  <FunnelIcon className="h-4 w-4" />
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Reset Filters
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
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
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
        {!isLoading && !error && purchases.length === 0 && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No purchases found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create a new purchase.</p>
            <div className="mt-6">
              <Link
                to="/purchases/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add New Purchase
              </Link>
            </div>
          </motion.div>
        )}

        {/* Purchases Table */}
        {purchases.length > 0 && (
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill #
                    </th>
                    {!isMobile && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net Wt. (Kg)
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase, index) => (
                    <motion.tr
                      key={purchase._id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        <button onClick={() => handleViewPurchase(purchase._id)} className="hover:underline">
                          {purchase.purchaseBillNumber}
                        </button>
                      </td>
                      {!isMobile && (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.supplierCompany?.name || purchase.supplierDetailsSnapshot?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDisplayDate(purchase.purchaseBillDate)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {purchase.netWeight?.toFixed(3)}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        ₹{purchase.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            purchase.paymentStatus
                          )}`}
                        >
                          {purchase.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <motion.button
                            onClick={() => handleViewPurchase(purchase._id)}
                            className="text-blue-600 hover:text-blue-900"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => navigate(`/purchases/edit/${purchase._id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          {!isMobile && (
                            <motion.button
                              onClick={() => handleDeletePurchase(purchase._id)}
                              className="text-red-600 hover:text-red-900"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          )}
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
              to="/purchases/add"
              className="w-14 h-14 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white"
              aria-label="Add new purchase"
            >
              <DocumentTextIcon className="h-6 w-6" />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PurchaseListPage;