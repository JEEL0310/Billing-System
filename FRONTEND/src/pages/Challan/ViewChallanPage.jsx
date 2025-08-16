import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChallanService from '../../services/ChallanService';
import fileDownload from 'js-file-download';

const ViewChallanPage = () => {
  const { id: challanId } = useParams();
  const [challan, setChallan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const fetchChallanDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await ChallanService.getChallanById(challanId);
      setChallan(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch challan details.';
      setError(errMsg);
      console.error("Fetch challan details error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [challanId]);

  useEffect(() => {
    fetchChallanDetails();
  }, [fetchChallanDetails]);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    setError('');
    try {
      const response = await ChallanService.downloadChallan(challanId);
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Challan-${challan?.challanNumber || challanId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      fileDownload(response.data, filename);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to download PDF file.';
      setError(errMsg);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusStyles = (isUsed) => {
    return isUsed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
  };

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-600 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center items-center gap-2">
          <svg className="animate-spin h-4 sm:h-6 w-4 sm:w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading challan details...</span>
        </div>
      </motion.div>
    );
  }

  if (error && !challan) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-red-500 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Error: {error}
      </motion.div>
    );
  }

  if (!challan) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-600 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Challan not found.
      </motion.div>
    );
  }

  const { companyDetailsSnapshot: company, boxDetails = [] } = challan;

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
          Challan Details: {challan.challanNumber}
        </motion.h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          <Link to={`/challans/edit/${challan._id}`} className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Edit Challan
          </Link>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <Link to="/challans" className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            ← Back to Challan List
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-500 rounded-lg text-xs sm:text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="bg-white shadow-lg rounded-xl p-4 sm:p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header and Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Company:</h2>
            <p className="font-medium text-gray-800 text-sm sm:text-base">{company?.name || 'N/A'}</p>
            <p className="text-xs sm:text-sm text-gray-600">{company?.address || 'N/A'}</p>
            <p className="text-xs sm:text-sm text-gray-600">GSTIN: {company?.gstNumber || 'N/A'}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs sm:text-sm text-gray-600"><strong>Challan Date:</strong> {formatDate(challan.challanDate)}</p>
            <p className="text-xs sm:text-sm text-gray-600"><strong>Broker:</strong> {challan.broker || 'direct'}</p>
            <p className="text-xs sm:text-sm font-semibold">
              Status: <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyles(challan.isUsed)}`}>{challan.isUsed ? 'Used in Bill' : 'Not Used'}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <motion.div
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Description:</h3>
          <p className="text-sm sm:text-base text-gray-800">{challan.descriptionOfGoods}</p>
        </motion.div>

        {/* Box Details Table */}
        <motion.div
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Box Details:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-[600px] divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Box Number</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Weight (kg)</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cops</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {boxDetails.map((box, index) => (
                    <motion.tr
                      key={box._id || index}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">{box.boxNumber}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">{box.netWeight?.toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 text-right">{box.cops}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Totals Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="md:col-span-2">
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              <strong>Created By:</strong> {challan.createdBy?.username || challan.createdBy?.email || 'System'}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              <strong>Created At:</strong> {formatDate(challan.createdAt)}
            </p>
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-gray-700">
            <div className="flex justify-between"><span>Total Boxes:</span> <span>{boxDetails.length}</span></div>
            <div className="flex justify-between font-medium border-t border-gray-200 pt-1">
              <span>Total Net Weight:</span> 
              <span>{challan.totalNetWeight?.toFixed(2) || '0.00'} kg</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total Cops:</span> 
              <span>{challan.totalCops || '0'}</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <motion.button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isDownloadingPdf ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading PDF...
              </div>
            ) : (
              'Download PDF Challan'
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ViewChallanPage;