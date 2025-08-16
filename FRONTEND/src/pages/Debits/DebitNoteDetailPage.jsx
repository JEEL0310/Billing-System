import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DebitService from '../../services/DebitService';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const DebitNoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debitNote, setDebitNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState({ excel: false, pdf: false });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDebitNote = async () => {
      try {
        const response = await DebitService.getDebitNoteById(id);
        setDebitNote(response.data);
      } catch (error) {
        setError(error.message || 'Failed to fetch debit note details');
        toast.error(error.message || 'Failed to fetch debit note details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDebitNote();
  }, [id]);

  const handleDownloadExcel = async () => {
    if (isDownloading.excel || isDownloading.pdf) {
      toast.warn('Another download is in progress. Please wait.');
      return;
    }

    try {
      setIsDownloading({ ...isDownloading, excel: true });
      const response = await DebitService.downloadDebitNoteExcel(id);

      // Validate response
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty or invalid Excel file');
      }

      // Create blob from response data
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DebitNote_${debitNote.debitNoteNumber}.xlsx`);

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setIsDownloading({ ...isDownloading, excel: false });
        toast.success('Excel file downloaded successfully');
      }, 1000); // Increased timeout to ensure download completes
    } catch (error) {
      setIsDownloading({ ...isDownloading, excel: false });
      const errorMessage = error.message || 'Failed to download Excel file';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDownloadPdf = async () => {
    if (isDownloading.excel || isDownloading.pdf) {
      toast.warn('Another download is in progress. Please wait.');
      return;
    }

    try {
      setIsDownloading({ ...isDownloading, pdf: true });
      const response = await DebitService.downloadDebitNotePdf(id);

      // Validate response
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty or invalid PDF file');
      }

      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Check if the browser supports PDF viewing
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // For IE/Edge browsers
        window.navigator.msSaveOrOpenBlob(blob, `DebitNote_${debitNote.debitNoteNumber}.pdf`);
        setIsDownloading({ ...isDownloading, pdf: false });
        toast.success('PDF file downloaded successfully');
      } else {
        // For other browsers
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DebitNote_${debitNote.debitNoteNumber}.pdf`);

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          setIsDownloading({ ...isDownloading, pdf: false });
          toast.success('PDF file downloaded successfully');
        }, 1000); // Increased timeout to ensure download completes
      }
    } catch (error) {
      setIsDownloading({ ...isDownloading, pdf: false });
      const errorMessage = error.message || 'Failed to download PDF file';
      setError(errorMessage);
      toast.error(errorMessage);
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

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-500 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading debit note details...
      </motion.div>
    );
  }

  if (error && !debitNote) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-red-500 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.div>
    );
  }

  if (!debitNote) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-500 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Debit note not found
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Debit Note: {debitNote.debitNoteNumber}
        </h1>
      </div>
      <div className="flex justify-end gap-3 mb-6">
        <motion.button
          onClick={handleDownloadExcel}
          className={`flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
            isDownloading.excel ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: isDownloading.excel ? 1 : 1.05 }}
          whileTap={{ scale: isDownloading.excel ? 1 : 0.95 }}
          disabled={isDownloading.excel}
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          {isDownloading.excel ? 'Downloading...' : 'Download Excel'}
        </motion.button>
        <motion.button
          onClick={handleDownloadPdf}
          className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
            isDownloading.pdf ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: isDownloading.pdf ? 1 : 1.05 }}
          whileTap={{ scale: isDownloading.pdf ? 1 : 0.95 }}
          disabled={isDownloading.pdf}
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          {isDownloading.pdf ? 'Downloading...' : 'Download PDF'}
        </motion.button>
      </div>
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Debit Note Details</h2>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-medium w-40">Debit Note Number:</span>
                <span>{debitNote.debitNoteNumber}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Issue Date:</span>
                <span>{formatDate(debitNote.issueDate)}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Original Bill Number:</span>
                <span>{debitNote.originalBillNumber}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Original Bill Date:</span>
                <span>{formatDate(debitNote.originalBillDate)}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Payment Date:</span>
                <span>{formatDate(debitNote.paymentDate)}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Late Days:</span>
                <span>{debitNote.lateDays}</span>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Company Details</h2>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-medium w-40">Company Name:</span>
                <span>{debitNote.company?.name || debitNote.companyDetailsSnapshot?.name}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">Address:</span>
                <span>{debitNote.company?.address || debitNote.companyDetailsSnapshot?.address}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-40">GSTIN:</span>
                <span>{debitNote.company?.gstNumber || debitNote.companyDetailsSnapshot?.gstNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Interest Calculation</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-4 text-sm text-gray-900">Principal Amount</td>
                <td className="px-4 py-4 text-sm text-gray-500"></td>
                <td className="px-4 py-4 text-sm text-gray-500"></td>
                <td className="px-4 py-4 text-sm text-gray-900">{debitNote.principalAmount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="px-4 py-4 text-sm text-gray-900">Interest @ {(debitNote.interestRatePerDay * 100).toFixed(2)}% per day</td>
                <td className="px-4 py-4 text-sm text-gray-500">{(debitNote.interestRatePerDay * 100).toFixed(2)}%</td>
                <td className="px-4 py-4 text-sm text-gray-500">{debitNote.lateDays}</td>
                <td className="px-4 py-4 text-sm text-gray-900">{debitNote.interestAmount?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Taxes & Deductions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-4 text-sm text-gray-900">CGST</td>
                <td className="px-4 py-4 text-sm text-gray-500">{debitNote.cgstPercentage}%</td>
                <td className="px-4 py-4 text-sm text-gray-900">{debitNote.cgstAmount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="px-4 py-4 text-sm text-gray-900">SGST</td>
                <td className="px-4 py-4 text-sm text-gray-500">{debitNote.sgstPercentage}%</td>
                <td className="px-4 py-4 text-sm text-gray-900">{debitNote.sgstAmount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="px-4 py-4 text-sm text-gray-900">TDS</td>
                <td className="px-4 py-4 text-sm text-gray-500">{debitNote.tdsPercentage}%</td>
                <td className="px-4 py-4 text-sm text-gray-900">-{debitNote.tdsAmount?.toFixed(2)}</td>
              </tr>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-4 text-sm text-gray-900">Total Amount</td>
                <td className="px-4 py-4 text-sm text-gray-500"></td>
                <td className="px-4 py-4 text-sm text-gray-900">{debitNote.totalAmount?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Amount in Words</h2>
        <p className="text-sm sm:text-base italic text-gray-700">
          {debitNote.amountInWords}
        </p>
      </div> */}
    </motion.div>
  );
};

export default DebitNoteDetailPage;