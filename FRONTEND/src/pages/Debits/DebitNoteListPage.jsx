import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, TrashIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import DebitService from '../../services/DebitService';

const DebitNoteListPage = () => {
  const [debitNotes, setDebitNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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

  const fetchDebitNotes = async () => {
    setIsLoading(true);
    setError('');
    const params = {};
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;

    try {
      const response = await DebitService.getAllDebitNotes(params);
      setDebitNotes(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch debit notes.';
      setError(errMsg);
      console.error("Fetch debit notes error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      fetchDebitNotes();
    }
  }, [filterStartDate, filterEndDate]);

  const handleDeleteDebitNote = async (debitNoteId) => {
    if (window.confirm('Are you sure you want to delete this debit note? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await DebitService.deleteDebitNote(debitNoteId);
        setDebitNotes(prev => prev.filter(dn => dn._id !== debitNoteId));
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete debit note.';
        setError(errMsg);
        console.error("Delete debit note error:", errMsg);
      } finally {
        setIsLoading(false);
      }
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

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const clearFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
  };

  if (isLoading && debitNotes.length === 0) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-500 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading debit notes...
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 text-center sm:text-left"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          All Debit Notes
        </motion.h1>
        <Link
          to="/bills"
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 flex items-center justify-center"
        >
          View Bills
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
              <label htmlFor="filterStartDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                id="filterStartDate"
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
                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <div className="flex-1">
              <label htmlFor="filterEndDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                id="filterEndDate"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
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
          <motion.div
            className="flex flex-col sm:flex-row gap-2 sm:gap-4 col-span-full sm:col-span-2 lg:col-span-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <button
              onClick={fetchDebitNotes}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
              disabled={isLoading}
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105"
              disabled={isLoading}
            >
              Reset Filters
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

      {!isLoading && !error && debitNotes.length === 0 && (
        <motion.div
          className="text-center py-8 sm:py-12 bg-white shadow-lg rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-500 text-base sm:text-lg mb-2">No debit notes found matching your criteria.</p>
        </motion.div>
      )}

      {debitNotes.length > 0 && (
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
                  {['Debit Note #', 'Original Bill', 'Issue Date', 'Company', 'Late Days', 'Total Amount', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Total Amount' || header === 'Actions' ? 'text-right' : ''}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debitNotes.map((debitNote, index) => (
                  <motion.tr
                    key={debitNote._id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">
                      <span
                        onClick={() => navigate(`/debit-notes/${debitNote._id}`)}
                        className="text-amber-600 hover:text-amber-800 cursor-pointer"
                      >
                        {debitNote.debitNoteNumber}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                      {debitNote.originalBillNumber}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                      {formatDisplayDate(debitNote.issueDate)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                      {debitNote.company?.name || debitNote.companyDetailsSnapshot?.name || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                      {debitNote.lateDays}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 text-right">
                      ₹{debitNote.totalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium flex flex-col sm:flex-row justify-end gap-2">
                      <motion.button
                        onClick={() => navigate(`/debit-notes/${debitNote._id}`)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <EyeIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteDebitNote(debitNote._id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        disabled={isLoading}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <TrashIcon className="h-4 sm:h-5 w-4 sm:w-5" />
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
        className="mt-6 sm:mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors text-xs sm:text-sm">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default DebitNoteListPage;