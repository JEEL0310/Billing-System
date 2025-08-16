import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WorkerService from '../../services/WorkerService';
import WorkerForm from '../../components/WorkerForm';

const WorkerPage = () => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [filterActive, setFilterActive] = useState('all');

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const params = {};
    if (filterActive !== 'all') {
      params.active = filterActive;
    }
    try {
      const response = await WorkerService.getAllWorkers(params);
      setWorkers(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch workers.';
      setError(errMsg);
      console.error("Fetch workers error:", errMsg);
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }, [filterActive]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleAddWorker = () => {
    setEditingWorker(null);
    setShowFormModal(true);
  };

  const handleEditWorker = (worker) => {
    setEditingWorker(worker);
    setShowFormModal(true);
  };

  const handleDeleteWorker = async (workerId) => {
    if (window.confirm('Are you sure you want to delete this worker? This may affect historical attendance data if not handled carefully.')) {
      setIsLoading(true);
      try {
        await WorkerService.deleteWorker(workerId);
        setWorkers(workers.filter(w => w._id !== workerId));
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete worker.';
        setError(errMsg);
        // Auto-dismiss error after 5 seconds
        setTimeout(() => {
          setError('');
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = async (workerData) => {
    setIsLoading(true);
    setError('');
    try {
      if (editingWorker) {
        await WorkerService.updateWorker(editingWorker._id, workerData);
      } else {
        await WorkerService.createWorker(workerData);
      }
      setShowFormModal(false);
      setEditingWorker(null);
      fetchWorkers();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || (editingWorker ? 'Failed to update worker.' : 'Failed to create worker.');
      setError(errMsg);
      setIsLoading(false);
      return Promise.reject(err);
    }
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setEditingWorker(null);
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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
          Manage Workers
        </motion.h1>
        <div className="flex items-center gap-3">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-w-[150px]"
          >
            <option value="all">All Workers</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
          <motion.button
            onClick={handleAddWorker}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add New Worker
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && workers.length === 0 && (
        <motion.div
          className="text-center text-gray-600 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-center items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading workers...</span>
          </div>
        </motion.div>
      )}

      {!isLoading && workers.length === 0 && !error && (
        <motion.div
          className="text-center text-gray-600 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          No workers found matching your criteria. Click "Add New Worker" to get started.
        </motion.div>
      )}

      {workers.length > 0 && (
        <motion.div
          className="bg-white shadow-lg rounded-xl overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Worker List</h2>
            <span className="text-sm text-gray-600">
              Total: <span className="font-medium">{workers.length}</span> {workers.length === 1 ? 'worker' : 'workers'}
            </span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Worker ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joining Date</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {workers.map((worker, index) => (
                  <motion.tr
                    key={worker._id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{worker.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.workerId || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.contactNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(worker.joiningDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${worker.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <motion.button
                        onClick={() => handleEditWorker(worker)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteWorker(worker._id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Delete
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      <AnimatePresence>
        {showFormModal && (
          <motion.div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-xl bg-white"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={handleCancelForm}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                </h3>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="text-sm text-red-500 mb-3 text-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="mt-2 px-4 py-3">
                  <WorkerForm
                    onSubmit={handleFormSubmit}
                    initialData={editingWorker}
                    onCancel={handleCancelForm}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default WorkerPage;