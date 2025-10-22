import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Eye, Trash2, FilePlus, FileText, ArrowLeft, RefreshCw, X, Plus } from 'lucide-react';
import DebitService from '../../services/DebitService';

const DebitNoteListPage = ({ openCreateForBillId, onCreateOpened }) => {
  const [debitNotes, setDebitNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeDebitNote, setActiveDebitNote] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

  const [createData, setCreateData] = useState({
    billId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    overrideInterestRate: 1.5,
    overrideCgstPercentage: 6,
    overrideSgstPercentage: 6,
    overrideTdsPercentage: 1,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
  }, []);

  const fetchDebitNotes = React.useCallback(async () => {
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
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      fetchDebitNotes();
    }
  }, [filterStartDate, filterEndDate, fetchDebitNotes]);

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

  const formatCurrency = (amount) => {
    return amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
  };

  const clearFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setCreateError('');
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateData(prev => ({ ...prev, [name]: name === 'overrideInterestRate' || name.includes('Percentage') ? parseFloat(value) : value }));
  };

  const submitCreateDebitNote = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const payload = { ...createData };
      await DebitService.createDebitNote(payload);
      setIsCreateOpen(false);
      await fetchDebitNotes();
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create debit note');
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    if (openCreateForBillId) {
      setCreateData(prev => ({ ...prev, billId: openCreateForBillId }));
      setIsCreateOpen(true);
      if (typeof onCreateOpened === 'function') onCreateOpened();
    }
  }, [openCreateForBillId, onCreateOpened]);

  const openDetailModal = async (debitNoteId) => {
    setIsDetailOpen(true);
    try {
      const resp = await DebitService.getDebitNoteById(debitNoteId);
      setActiveDebitNote(resp.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch debit note');
      setIsDetailOpen(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setActiveDebitNote(null);
  };

  if (isLoading && debitNotes.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50">
          <RefreshCw className="h-12 w-12 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading debit notes...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                All Debit Notes
              </h1>
              <p className="text-slate-500 text-xs lg:text-sm font-medium">View and manage your debit notes</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <motion.button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-1.5 lg:px-6 lg:py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white text-sm lg:text-md font-semibold rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <FilePlus className="h-5 w-5" />
              Create Debit Note
            </motion.button>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-600" />
            Filters
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-end gap-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex-1 flex items-center gap-2"
                >
                  <button
                    onClick={() => handleMonthChange('prev')}
                    className="hidden lg:block p-2 text-black rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 self-end"
                    disabled={isLoading}
                  >
                    &lt;
                  </button>
                  <div className="flex-1">
                    <label htmlFor="filterStartDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      id="filterStartDate"
                      value={filterStartDate}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
                        setFilterStartDate(e.target.value);
                        setFilterEndDate(formatDateForInput(lastDay));
                      }}
                      className="w-full p-3 text-black border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="flex-1 flex items-center gap-2"
                >
                  <div className="flex-1">
                    <label htmlFor="filterEndDate" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      id="filterEndDate"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full p-3 text-black border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleMonthChange('next')}
                    className="hidden lg:block p-2 rounded-lg text-black bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 self-end"
                    disabled={isLoading}
                  >
                    &gt;
                  </button>
                </motion.div>
              </div>
            </div>
            <motion.div
              className="flex flex-col-2 sm:flex-row gap-2 sm:gap-4 col-span-full sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <button
                onClick={fetchDebitNotes}
                className="flex-1 text-sm lg:text-base px-2 py-1.5 lg:px-4 lg:py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                disabled={isLoading}
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 text-sm lg:text-base px-2 py-1.5 lg:px-4 lg:py-3 bg-slate-200 text-slate-700 rounded-lg lg:rounded-xl hover:bg-slate-300 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                disabled={isLoading}
              >
                Reset Filters
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-1 rounded-full bg-red-100">
                <X className="h-4 w-4" />
              </div>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Debit Notes */}
        {!isLoading && !error && debitNotes.length === 0 && (
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-8 lg:p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-2 lg:p-4 rounded-lg lg:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 w-fit mx-auto mb-6">
              <FileText className="h-8 w-8 lg:h-12 lg:w-12 text-slate-400" />
            </div>
            <h3 className="text-base lg:text-xl font-semibold text-slate-800 mb-2">No Debit Notes Found</h3>
            <p className="text-sm lg:text-base text-slate-500">No debit notes match your current filters.</p>
          </motion.div>
        )}

        {/* Debit Notes Table */}
        {debitNotes.length > 0 && (
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-6 border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Debit Notes</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Debit Note #', 'Original Bill', 'Issue Date', 'Company', 'Late Days', 'Total Amount', 'Actions'].map((header) => (
                      <th
                        key={header}
                        className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${header === 'Total Amount' || header === 'Actions' ? 'text-right' : ''}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {debitNotes.map((debitNote, index) => (
                    <motion.tr
                      key={debitNote._id}
                      className="hover:bg-slate-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-4 py-4 text-sm font-medium">
                        <Link
                          to={`/debit/${debitNote._id}`}
                          className="text-violet-600 hover:text-violet-800 transition-colors"
                        >
                          {debitNote.debitNoteNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{debitNote.originalBillNumber}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDisplayDate(debitNote.issueDate)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {debitNote.company?.name || debitNote.companyDetailsSnapshot?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{debitNote.lateDays}</td>
                      <td className="px-4 py-4 text-sm text-slate-700 text-right">₹{formatCurrency(debitNote.totalAmount)}</td>
                      <td className="px-4 py-4 text-right text-sm font-medium flex justify-end gap-2">
                        <motion.button
                          onClick={() => openDetailModal(debitNote._id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteDebitNote(debitNote._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          disabled={isLoading}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <motion.div
              className="fixed inset-0 bg-black/30  flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateModal}
            >
              <motion.div
                className="bg-white backdrop-blur-sm rounded-2xl shadow-lg p-6 max-w-2xl w-full"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FilePlus className="h-5 w-5 text-violet-600" />
                    Create Debit Note
                  </h3>
                  <button
                    onClick={closeCreateModal}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {createError && (
                  <motion.p
                    className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-lg flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <X className="h-4 w-4" />
                    {createError}
                  </motion.p>
                )}
                <form onSubmit={submitCreateDebitNote} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={createData.paymentDate}
                      onChange={handleCreateChange}
                      className="w-full p-3 border text-black border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (Monthly %)</label>
                    <input
                      type="number"
                      name="overrideInterestRate"
                      value={createData.overrideInterestRate}
                      onChange={handleCreateChange}
                      step="0.01"
                      className="w-full p-3 text-black border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CGST %</label>
                    <input
                      type="number"
                      name="overrideCgstPercentage"
                      value={createData.overrideCgstPercentage}
                      onChange={handleCreateChange}
                      step="0.01"
                      className="w-full p-3 text-black border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SGST %</label>
                    <input
                      type="number"
                      name="overrideSgstPercentage"
                      value={createData.overrideSgstPercentage}
                      onChange={handleCreateChange}
                      step="0.01"
                      className="w-full p-3 text-black border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">TDS %</label>
                    <input
                      type="number"
                      name="overrideTdsPercentage"
                      value={createData.overrideTdsPercentage}
                      onChange={handleCreateChange}
                      step="0.01"
                      className="w-full p-3 text-black border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-semibold shadow-lg transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {createLoading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {isDetailOpen && activeDebitNote && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetailModal}
            >
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 max-w-3xl w-full"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-600" />
                    Debit Note #{activeDebitNote.debitNoteNumber}
                  </h3>
                  <button
                    onClick={closeDetailModal}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Details</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex"><span className="w-40 font-medium">Issue Date:</span><span>{formatDisplayDate(activeDebitNote.issueDate)}</span></div>
                      <div className="flex"><span className="w-40 font-medium">Original Bill:</span><span>{activeDebitNote.originalBillNumber}</span></div>
                      <div className="flex"><span className="w-40 font-medium">Payment Date:</span><span>{formatDisplayDate(activeDebitNote.paymentDate)}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Company</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex"><span className="w-40 font-medium">Name:</span><span>{activeDebitNote.company?.name || activeDebitNote.companyDetailsSnapshot?.name || 'N/A'}</span></div>
                      <div className="flex"><span className="w-40 font-medium">GSTIN:</span><span>{activeDebitNote.company?.gstNumber || activeDebitNote.companyDetailsSnapshot?.gstNumber || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-700 mb-2">Totals</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between"><span>Interest:</span><span>₹{formatCurrency(activeDebitNote.interestAmount)}</span></div>
                    <div className="flex justify-between"><span>CGST:</span><span>₹{formatCurrency(activeDebitNote.cgstAmount)}</span></div>
                    <div className="flex justify-between"><span>SGST:</span><span>₹{formatCurrency(activeDebitNote.sgstAmount)}</span></div>
                    <div className="flex justify-between font-semibold mt-2"><span>Total:</span><span>₹{formatCurrency(activeDebitNote.totalAmount)}</span></div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <motion.button
            onClick={() => setIsCreateOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Plus className="h-6 w-6" />
          </motion.button>
        )}

      </div>
    </motion.div>
  );
};

export default DebitNoteListPage;