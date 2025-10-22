import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BillService from '../../services/BillService';
import fileDownload from 'js-file-download';

const handleViewBill = () => {
  const { id: billId } = useParams();
  const [bill, setBill] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState('');

  const fetchBillDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await BillService.getBillById(billId);
      setBill(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch bill details.';
      setError(errMsg);
      console.error("Fetch bill details error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchBillDetails();
  }, [fetchBillDetails]);

  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    setError('');
    try {
      const response = await BillService.downloadBillExcel(billId);
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Bill-${bill?.billNumber || billId}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      fileDownload(response.data, filename);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to download Excel file.';
      setError(errMsg);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    setPdfMessage('');
    setError('');
    try {
      const response = await BillService.downloadBillPdf(billId);
      if (response.data instanceof Blob && response.data.type === 'application/pdf') {
        const contentDisposition = response.headers['content-disposition'];
        let filename = `Bill-${bill?.billNumber || billId}.pdf`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
          }
        }
        fileDownload(response.data, filename);
        setPdfMessage('');
      } else if (response.data && response.data.message) {
        setPdfMessage(response.data.message);
        setError('');
        // Auto-dismiss PDF message after 5 seconds
        setTimeout(() => {
          setPdfMessage('');
        }, 5000);
      } else {
        setError('Unexpected response from server during PDF download.');
        setPdfMessage('');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to process PDF request.';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Partially Paid':
        return 'bg-blue-100 text-blue-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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
          <span>Loading bill details...</span>
        </div>
      </motion.div>
    );
  }

  if (error && !bill) {
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

  if (!bill) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-600 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Bill not found.
      </motion.div>
    );
  }

  const { companyDetailsSnapshot: company, items = [] } = bill;

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
          Bill Details: {bill.billNumber}
        </motion.h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          <Link to={`/bills/edit/${bill._id}`} className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Edit Bill
          </Link>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <Link to="/bills" className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            ← Back to Bill List
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

      <AnimatePresence>
        {pdfMessage && (
          <motion.div
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 text-blue-600 rounded-lg text-xs sm:text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {pdfMessage}
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
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Billed To:</h2>
            <p className="font-medium text-gray-800 text-sm sm:text-base">{company?.name || 'N/A'}</p>
            <p className="text-xs sm:text-sm text-gray-600">{company?.address || 'N/A'}</p>
            <p className="text-xs sm:text-sm text-gray-600">GSTIN: {company?.gstNumber || 'N/A'}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs sm:text-sm text-gray-600"><strong>Bill Date:</strong> {formatDate(bill.billDate)}</p>
            <p className="text-xs sm:text-sm text-gray-600"><strong>Due Date:</strong> {formatDate(bill.dueDate)}</p>
            <p className="text-xs sm:text-sm font-semibold">
              Status: <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyles(bill.status)}`}>{bill.status}</span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <motion.div
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Items:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-[600px] divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">HSN/SAC</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.tr
                      key={item._id || index}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 max-w-[150px] sm:max-w-[200px] truncate" title={item.description}>{item.description}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">{item.hsnSacCode}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">{item.quantity}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">₹{item.rate?.toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 text-right">₹{item.amount?.toFixed(2)}</td>
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
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="md:col-span-2">
            {bill.amountInWords && (
              <p className="text-xs sm:text-sm text-gray-600 mb-4"><strong>Amount in Words:</strong> {bill.amountInWords}</p>
            )}
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-gray-700">
            <div className="flex justify-between"><span>Subtotal:</span> <span>₹{bill.subTotalAmount?.toFixed(2)}</span></div>
            {bill.discountAmount > 0 && (
              <div className="flex justify-between"><span>Discount ({bill.discountPercentage}%):</span> <span>- ₹{bill.discountAmount?.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-medium border-t border-gray-200 pt-1"><span>Amount After Discount:</span> <span>₹{bill.amountAfterDiscount?.toFixed(2)}</span></div>
            {bill.taxType === 'CGST_SGST' && (
              <>
                <div className="flex justify-between"><span>CGST ({bill.cgstPercentage}%):</span> <span>+ ₹{bill.cgstAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>SGST ({bill.sgstPercentage}%):</span> <span>+ ₹{bill.sgstAmount?.toFixed(2)}</span></div>
              </>
            )}
            {bill.taxType === 'IGST' && (
              <div className="flex justify-between"><span>IGST ({bill.igstPercentage}%):</span> <span>+ ₹{bill.igstAmount?.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-base sm:text-lg font-bold text-gray-800 border-t-2 border-gray-300 pt-2 mt-1">
              <span>Grand Total:</span>
              <span>₹{bill.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Records */}
        {bill.paymentRecords && bill.paymentRecords.length > 0 && (
          <motion.div
            className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Payment History:</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-600">
              {bill.paymentRecords.map((record, index) => (
                <li key={index}>
                  Paid ₹{record.amountPaid?.toFixed(2)} on {formatDate(record.paymentDate)}
                  {record.notes && ` - Notes: ${record.notes}`}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <motion.button
            onClick={handleDownloadExcel}
            disabled={isDownloadingExcel}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-all flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isDownloadingExcel ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading Excel...
              </div>
            ) : (
              'Download Excel'
            )}
          </motion.button>
          <motion.button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isDownloadingPdf ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing PDF...
              </div>
            ) : (
              'Download PDF'
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default handleViewBill;