import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DebitService from '../../services/DebitService';

const UpdateDebitNotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    paymentDate: '',
    overrideInterestRate: '',
    overrideCgstPercentage: '',
    overrideSgstPercentage: '',
    overrideTdsPercentage: '',
    amountInWords: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debitNote, setDebitNote] = useState(null);

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch debit note details
  useEffect(() => {
    const fetchDebitNote = async () => {
      setIsLoading(true);
      try {
        const response = await DebitService.getDebitNoteById(id);
        const data = response.data;
        setDebitNote(data);
        setFormData({
          paymentDate: formatDateForInput(data.paymentDate),
          overrideInterestRate: data.interestRatePerDay
            ? (data.interestRatePerDay * 100).toFixed(2)
            : '',
          overrideCgstPercentage: data.cgstPercentage || '',
          overrideSgstPercentage: data.sgstPercentage || '',
          overrideTdsPercentage: data.tdsPercentage || '',
          amountInWords: data.amountInWords || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch debit note details.');
        console.error('Fetch debit note error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDebitNote();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const updateData = {
        paymentDate: formData.paymentDate,
        overrideInterestRate: formData.overrideInterestRate
          ? parseFloat(formData.overrideInterestRate)
          : undefined,
        overrideCgstPercentage: formData.overrideCgstPercentage
          ? parseFloat(formData.overrideCgstPercentage)
          : undefined,
        overrideSgstPercentage: formData.overrideSgstPercentage
          ? parseFloat(formData.overrideSgstPercentage)
          : undefined,
        overrideTdsPercentage: formData.overrideTdsPercentage
          ? parseFloat(formData.overrideTdsPercentage)
          : undefined,
        amountInWords: formData.amountInWords || undefined,
      };

      await DebitService.updateDebitNote(id, updateData);
      navigate('/debit-notes', {
        state: { successMessage: 'Debit note updated successfully!' },
      });
    } catch (err) {
      setError(err.message || 'Failed to update debit note.');
      console.error('Update debit note error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !debitNote) {
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

  if (!debitNote && !isLoading) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-red-500 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Error: {error}
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
          Update Debit Note: {debitNote?.debitNoteNumber || 'Loading...'}
        </motion.h1>
        <Link
          to="/debit-notes"
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <ArrowLeftIcon className="h-4 sm:h-5 w-4 sm:w-5" />
          Back to Debit Notes
        </Link>
      </div>

      {error && (
        <motion.p
          className="text-center text-red-500 mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 rounded-lg text-xs sm:text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Error: {error}
        </motion.p>
      )}

      <motion.div
        className="bg-white shadow-lg rounded-xl p-4 sm:p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label htmlFor="paymentDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="overrideInterestRate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Interest Rate Per Day (%)
            </label>
            <input
              type="number"
              id="overrideInterestRate"
              name="overrideInterestRate"
              value={formData.overrideInterestRate}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="overrideCgstPercentage" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              CGST Percentage (%)
            </label>
            <input
              type="number"
              id="overrideCgstPercentage"
              name="overrideCgstPercentage"
              value={formData.overrideCgstPercentage}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="overrideSgstPercentage" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              SGST Percentage (%)
            </label>
            <input
              type="number"
              id="overrideSgstPercentage"
              name="overrideSgstPercentage"
              value={formData.overrideSgstPercentage}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="overrideTdsPercentage" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              TDS Percentage (%)
            </label>
            <input
              type="number"
              id="overrideTdsPercentage"
              name="overrideTdsPercentage"
              value={formData.overrideTdsPercentage}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="amountInWords" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Amount in Words
            </label>
            <input
              type="text"
              id="amountInWords"
              name="amountInWords"
              value={formData.amountInWords}
              onChange={handleInputChange}
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            />
          </div>
          <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
            <button
              type="submit"
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Debit Note'}
            </button>
            <Link
              to="/debit-notes"
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UpdateDebitNotePage;