import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyService from '../../services/CompanyService';
import CompanyForm from '../../components/CompanyForm';

const CompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchCompanies = useCallback(async (filterType = 'All') => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const params = {};
      if (filterType !== 'All') {
        params.companyType = filterType;
      }
      const response = await CompanyService.getAllCompanies(params);
      setCompanies(response.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch companies.';
      setError(errMsg);
      console.error("Fetch companies error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies(activeFilter);
  }, [fetchCompanies, activeFilter]);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowFormModal(true);
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setShowFormModal(true);
  };

  const handleDeleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      try {
        await CompanyService.deleteCompany(companyId);
        setCompanies(companies.filter(c => c._id !== companyId));
        setSuccessMessage('Company deleted successfully!');
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete company.';
        setError(errMsg);
        console.error("Delete company error:", errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = async (companyData) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      if (editingCompany) {
        await CompanyService.updateCompany(editingCompany._id, companyData);
        setSuccessMessage('Company updated successfully!');
      } else {
        await CompanyService.createCompany(companyData);
        setSuccessMessage('Company added successfully!');
      }
      setShowFormModal(false);
      setEditingCompany(null);
      fetchCompanies(activeFilter);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || (editingCompany ? 'Failed to update company.' : 'Failed to create company.');
      setError(errMsg);
      console.error("Form submit error:", errMsg);
      setIsLoading(false);
      return Promise.reject(err);
    }
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setEditingCompany(null);
    setError('');
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
          Manage Companies
        </motion.h1>
        <motion.button
          onClick={handleAddCompany}
          className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all transform hover:scale-105 w-full sm:w-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add New Company
        </motion.button>
      </div>

      {/* Filter Tabs */}
      <motion.div
        className="mb-4 sm:mb-6 border-b border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
          {['All', 'Buyer', 'Seller', 'Both', 'Other'].map((type, index) => (
            <motion.button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`relative py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === type
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {type} Companies
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Modal for Add/Edit Company */}
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
              className="relative mx-4 sm:mx-auto p-4 sm:p-6 border w-full max-w-md sm:max-w-lg shadow-2xl rounded-xl bg-white"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h3>
              <CompanyForm
                onSubmit={handleFormSubmit}
                initialData={editingCompany}
                onCancel={handleCancelForm}
                isLoading={isLoading}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {successMessage && (
          <motion.div
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 text-green-600 rounded-lg text-xs sm:text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && companies.length === 0 && (
        <motion.p
          className="text-center text-gray-600 py-4 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Loading companies...
        </motion.p>
      )}

      {!isLoading && companies.length === 0 && !error && (
        <motion.p
          className="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          No companies found. Click "Add New Company" to get started.
        </motion.p>
      )}

      {companies.length > 0 && (
        <motion.div
          className="bg-white shadow-lg rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Number
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companies.map((company, index) => (
                  <motion.tr
                    key={company._id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 break-all">
                      {company.name}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {company.companyType}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-normal text-xs sm:text-sm text-gray-600 break-all">
                      {company.address}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {company.gstNumber || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {company.mobileNumber || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-medium flex flex-col sm:flex-row justify-end gap-2">
                      <motion.button
                        onClick={() => handleEditCompany(company)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteCompany(company._id)}
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
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <motion.div
        className="mt-6 sm:mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors text-xs sm:text-sm">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default CompanyPage;