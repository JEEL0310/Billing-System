import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import ChallanService from '../../services/ChallanService';
import fileDownload from 'js-file-download';

const DownloadChallanPage = () => {
  const [challansWithFiles, setChallansWithFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingFile, setDownloadingFile] = useState(null);

  const fetchChallansWithFiles = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await ChallanService.getAllChallans();
      const filteredChallans = response.data.filter(
        (challan) => challan.pdfFilePath
      );
      setChallansWithFiles(filteredChallans);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch challan records.';
      setError(errMsg);
      console.error("Fetch challans for downloads error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallansWithFiles();
  }, [fetchChallansWithFiles]);

  const handleDownload = async (challanId, challanNumber) => {
    setDownloadingFile(challanId);
    setError('');
    let filename = '';
    try {
      const response = await ChallanService.downloadChallan(challanId);
      filename = `Challan-${challanNumber || challanId}.pdf`;
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      fileDownload(response.data, filename);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || `Failed to download PDF file.`;
      setError(`Error downloading PDF for Challan #${challanNumber}: ${errMsg}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading generated challan files...
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
          Generated Challan Documents
        </motion.h1>
        <Link
          to="/dashboard"
          className="text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            className="text-center text-red-500 mb-6 p-4 bg-red-50 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {!isLoading && !error && challansWithFiles.length === 0 && (
        <motion.div
          className="text-center py-12 bg-white shadow-lg rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-500 text-lg mb-2">No generated challan documents found.</p>
          <p className="text-gray-400">PDF files will appear here once generated from the challan view page.</p>
        </motion.div>
      )}

      {challansWithFiles.length > 0 && (
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
                  {['Challan #', 'Company', 'Challan Date', 'Status', 'Download'].map((header) => (
                    <th
                      key={header}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Download' ? 'text-right' : ''}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {challansWithFiles.map((challan, index) => (
                  <motion.tr
                    key={challan._id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-4 py-4 text-sm font-medium">
                      <Link
                        to={`/challans/${challan._id}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        {challan.challanNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[150px] truncate">
                      {challan.company?.name || challan.companyDetailsSnapshot?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatDate(challan.challanDate)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${challan.isUsed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {challan.isUsed ? 'Used' : 'Not Used'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <motion.button
                        onClick={() => handleDownload(challan._id, challan.challanNumber)}
                        disabled={downloadingFile === challan._id}
                        className="relative inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        {downloadingFile === challan._id ? 'Downloading...' : 'PDF'}
                        <span className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          Download PDF
                        </span>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DownloadChallanPage;