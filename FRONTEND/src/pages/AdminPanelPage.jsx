
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminService from '../services/AdminService';

const AdminPanelPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({ currentPage: 1, totalPages: 1, totalLogs: 0 });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setError('');
    try {
      const response = await AdminService.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      handleFetchError(err, 'Failed to fetch users.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page = 1, limit = 50) => {
    setIsLoadingLogs(true);
    setError('');
    try {
      const response = await AdminService.getAllLogs(page, limit);
      setLogs(response.data.logs);
      setLogPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalLogs: response.data.totalLogs,
      });
    } catch (err) {
      handleFetchError(err, 'Failed to fetch logs.');
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const handleFetchError = (err, defaultMessage) => {
    const errMsg = err.response?.data?.message || err.message || defaultMessage;
    setError(errMsg);
    console.error(defaultMessage, err);
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchUsers, fetchLogs]);

  const handleLogPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= logPagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  };

  const getLogLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
          Admin Panel
        </motion.h1>
        <Link
          to="/dashboard"
          className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          ← Back to Dashboard
        </Link>
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
        className="mb-4 sm:mb-6 border-b border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6" aria-label="Tabs">
          <motion.button
            onClick={() => setActiveTab('users')}
            className={`relative py-3 px-2 font-medium text-xs sm:text-sm transition-colors ${
              activeTab === 'users'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Manage Users ({users.length})
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('logs')}
            className={`relative py-3 px-2 font-medium text-xs sm:text-sm transition-colors ${
              activeTab === 'logs'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View System Logs ({logPagination.totalLogs})
          </motion.button>
        </nav>
      </motion.div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isLoadingUsers && (
            <motion.p
              className="text-center py-4 text-gray-600 text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Loading users...
            </motion.p>
          )}
          {!isLoadingUsers && users.length === 0 && !error && (
            <motion.p
              className="text-center py-4 text-gray-600 text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              No users found.
            </motion.p>
          )}
          {!isLoadingUsers && users.length > 0 && (
            <motion.div
              className="bg-white shadow-lg rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                      >
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 break-all">
                          {user.email}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                          {user.role}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isLoadingLogs && (
            <motion.p
              className="text-center py-4 text-gray-600 text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Loading logs...
            </motion.p>
          )}
          {!isLoadingLogs && logs.length === 0 && !error && (
            <motion.p
              className="text-center py-4 text-gray-600 text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              No logs found.
            </motion.p>
          )}
          {!isLoadingLogs && logs.length > 0 && (
            <>
              <motion.div
                className="bg-white shadow-lg rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Message
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.map((logEntry, index) => (
                        <motion.tr
                          key={logEntry._id}
                          className="hover:bg-gray-50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index }}
                        >
                          <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs text-gray-600">
                            {formatDate(logEntry.timestamp)}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogLevelColor(logEntry.level)}`}
                            >
                              {logEntry.level?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-700 break-all">
                            {logEntry.message}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Log Pagination */}
              {logPagination.totalPages > 1 && (
                <motion.div
                  className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <motion.button
                    onClick={() => handleLogPageChange(logPagination.currentPage - 1)}
                    disabled={logPagination.currentPage === 1 || isLoadingLogs}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105 w-full sm:w-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Previous
                  </motion.button>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Page {logPagination.currentPage} of {logPagination.totalPages}
                  </span>
                  <motion.button
                    onClick={() => handleLogPageChange(logPagination.currentPage + 1)}
                    disabled={logPagination.currentPage === logPagination.totalPages || isLoadingLogs}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105 w-full sm:w-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </motion.button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminPanelPage;