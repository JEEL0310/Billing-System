import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PurchaseService from '../../services/PurchaseService';

const ViewPurchasePage = () => {
  const { id: purchaseId } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPurchaseDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await PurchaseService.getPurchaseById(purchaseId);
      setPurchase(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch purchase details.';
      setError(errMsg);
      console.error("Fetch purchase details error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    fetchPurchaseDetails();
  }, [fetchPurchaseDetails]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'unpaid': return 'bg-red-100 text-red-700';
      case 'partially paid': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-600 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-center items-center gap-1 sm:gap-2">
          <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading purchase details...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-red-500 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Error: {error}
      </motion.div>
    );
  }

  if (!purchase) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-600 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Purchase record not found.
      </motion.div>
    );
  }

  const { supplierDetailsSnapshot: supplier } = purchase;

  return (
    <motion.div
      className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-2 sm:gap-4">
        <motion.h1
          className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800 text-center sm:text-left"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Purchase Details: Bill #{purchase.purchaseBillNumber}
        </motion.h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          <Link to={`/purchases/edit/${purchase._id}`} className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Edit Purchase
          </Link>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <Link to="/purchases" className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap">
            ← Back to Purchase List
          </Link>
        </div>
      </div>

      <motion.div
        className="bg-white shadow-lg rounded-xl p-4 sm:p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header and Supplier Info */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Supplier</h2>
            <p className="font-medium text-sm sm:text-base text-gray-800">{supplier?.name || 'N/A'}</p>
            <p className="text-xs sm:text-sm text-gray-600">{supplier?.address || 'N/A'}</p>
            <p className="text-xs sm:text-sm text-gray-600">GSTIN: {supplier?.gstNumber || 'N/A'}</p>
          </div>
          <div className="text-left md:text-right space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Supplier Bill Date:</span> {formatDate(purchase.purchaseBillDate)}</p>
            {purchase.challanNumber && (
              <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Challan No:</span> {purchase.challanNumber}</p>
            )}
            {purchase.challanDate && (
              <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Challan Date:</span> {formatDate(purchase.challanDate)}</p>
            )}
            <p className="text-xs sm:text-sm text-gray-600"><span className="font-medium">Due Date:</span> {formatDate(purchase.dueDate)}</p>
            <p className="text-xs sm:text-sm font-semibold">
              <span className="font-medium">Payment Status:</span>{' '}
              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getStatusColor(purchase.paymentStatus)}`}>
                {purchase.paymentStatus}
              </span>
            </p>
          </div>
        </motion.div>

        {/* Material and Weight Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Material & Weight Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200 text-xs sm:text-sm">
            <div><span className="font-medium text-gray-600">Denier:</span> {purchase.denier || 'N/A'}</div>
            <div><span className="font-medium text-gray-600">Grade:</span> {purchase.grade || 'N/A'}</div>
            <div><span className="font-medium text-gray-600">Gross Wt.:</span> {purchase.totalGrossWeight?.toFixed(3)} Kg</div>
            <div><span className="font-medium text-gray-600">Tare Wt.:</span> {purchase.tareWeight?.toFixed(3)} Kg</div>
            <div className="font-medium"><span className="font-medium text-gray-600">Net Wt.:</span> {purchase.netWeight?.toFixed(3)} Kg</div>
          </div>
        </motion.div>

        {/* Financial Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Financials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
            <div><span className="font-medium text-gray-600">Rate per Unit:</span> ₹{purchase.ratePerUnit?.toFixed(2)}</div>
            <div className="font-bold text-base sm:text-lg"><span className="font-medium text-gray-600">Total Amount:</span> ₹{purchase.amount?.toFixed(2)}</div>
          </div>
        </motion.div>

        {purchase.notes && (
          <motion.div
            className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Notes</h3>
            <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap">{purchase.notes}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <motion.button
            onClick={() => navigate(`/purchases/edit/${purchase._id}`)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Edit Purchase
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ViewPurchasePage;