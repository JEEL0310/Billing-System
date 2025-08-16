import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsService from '../../services/SettingsService';
import ItemConfigForm from '../../components/ItemConfigForm';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    sgstPercentage: 0,
    cgstPercentage: 0,
    igstPercentage: 0,
    jobCgstPercentage: 0,
    jobSgstPercentage: 0,
    itemConfigurations: [],
  });
  const [initialLoadError, setInitialLoadError] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isUpdatingGST, setIsUpdatingGST] = useState(false);
  const [gstUpdateMessage, setGstUpdateMessage] = useState({ type: '', text: '' });

  const [showItemFormModal, setShowItemFormModal] = useState(false);
  const [editingItemConfig, setEditingItemConfig] = useState(null);
  const [isItemFormLoading, setIsItemFormLoading] = useState(false);
  const [itemFormError, setItemFormError] = useState('');

  const fetchSettings = useCallback(async () => {
    setIsPageLoading(true);
    setInitialLoadError('');
    try {
      const response = await SettingsService.getSettings();
      setSettings(response.data || { 
        sgstPercentage: 0, 
        cgstPercentage: 0, 
        igstPercentage: 0,
        jobCgstPercentage: 0,
        jobSgstPercentage: 0,
        itemConfigurations: [] 
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch settings.';
      setInitialLoadError(errMsg);
      console.error("Fetch settings error:", errMsg);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleGSTChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSaveGSTPercentages = async (e) => {
    e.preventDefault();
    setIsUpdatingGST(true);
    setGstUpdateMessage({ type: '', text: '' });
    try {
      const { 
        sgstPercentage, 
        cgstPercentage, 
        igstPercentage,
        jobCgstPercentage,
        jobSgstPercentage
      } = settings;
      await SettingsService.updateSettings({ 
        sgstPercentage, 
        cgstPercentage, 
        igstPercentage,
        jobCgstPercentage,
        jobSgstPercentage
      });
      setGstUpdateMessage({ type: 'success', text: 'GST percentages updated successfully!' });
      fetchSettings();
      setTimeout(() => {
        setGstUpdateMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update GST percentages.';
      setGstUpdateMessage({ type: 'error', text: errMsg });
      setTimeout(() => {
        setGstUpdateMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setIsUpdatingGST(false);
    }
  };

  const handleAddItemConfig = () => {
    setEditingItemConfig(null);
    setItemFormError('');
    setShowItemFormModal(true);
  };

  const handleEditItemConfig = (item) => {
    setEditingItemConfig(item);
    setItemFormError('');
    setShowItemFormModal(true);
  };

  const handleDeleteItemConfig = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item configuration?')) {
      setIsItemFormLoading(true);
      setItemFormError('');
      try {
        await SettingsService.deleteItemConfiguration(itemId);
        setSettings(prev => ({
          ...prev,
          itemConfigurations: prev.itemConfigurations.filter(item => item._id !== itemId),
        }));
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete item configuration.';
        setItemFormError(errMsg);
      } finally {
        setIsItemFormLoading(false);
      }
    }
  };

  const handleItemFormSubmit = async (itemData) => {
    setIsItemFormLoading(true);
    setItemFormError('');
    try {
      if (editingItemConfig) {
        await SettingsService.updateItemConfiguration(editingItemConfig._id, itemData);
      } else {
        await SettingsService.addItemConfiguration(itemData);
      }
      setShowItemFormModal(false);
      setEditingItemConfig(null);
      fetchSettings();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || (editingItemConfig ? 'Failed to update item.' : 'Failed to add item.');
      setItemFormError(errMsg);
      setIsItemFormLoading(false);
      return Promise.reject(err);
    }
  };

  const handleCancelItemForm = () => {
    setShowItemFormModal(false);
    setEditingItemConfig(null);
    setItemFormError('');
  };

  if (isPageLoading) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading settings...</span>
        </div>
      </motion.div>
    );
  }

  if (initialLoadError) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-red-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Error: {initialLoadError}
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
      <motion.h1
        className="text-4xl font-extrabold text-gray-800 mb-8"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Application Settings
      </motion.h1>

      {/* GST Percentages Section */}
      <motion.div
        className="bg-white shadow-lg rounded-xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Default GST Percentages</h2>
        <form onSubmit={handleSaveGSTPercentages} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="sgstPercentage" className="block text-sm font-medium text-gray-700">SGST (%)</label>
              <input
                type="number"
                name="sgstPercentage"
                id="sgstPercentage"
                value={settings.sgstPercentage}
                onChange={handleGSTChange}
                step="0.01"
                min="0"
                max="100"
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="cgstPercentage" className="block text-sm font-medium text-gray-700">CGST (%)</label>
              <input
                type="number"
                name="cgstPercentage"
                id="cgstPercentage"
                value={settings.cgstPercentage}
                onChange={handleGSTChange}
                step="0.01"
                min="0"
                max="100"
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="igstPercentage" className="block text-sm font-medium text-gray-700">IGST (%)</label>
              <input
                type="number"
                name="igstPercentage"
                id="igstPercentage"
                value={settings.igstPercentage}
                onChange={handleGSTChange}
                step="0.01"
                min="0"
                max="100"
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-4">Job GST Percentages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobCgstPercentage" className="block text-sm font-medium text-gray-700">Job CGST (%)</label>
              <input
                type="number"
                name="jobCgstPercentage"
                id="jobCgstPercentage"
                value={settings.jobCgstPercentage}
                onChange={handleGSTChange}
                step="0.01"
                min="0"
                max="100"
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="jobSgstPercentage" className="block text-sm font-medium text-gray-700">Job SGST (%)</label>
              <input
                type="number"
                name="jobSgstPercentage"
                id="jobSgstPercentage"
                value={settings.jobSgstPercentage}
                onChange={handleGSTChange}
                step="0.01"
                min="0"
                max="100"
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={isUpdatingGST}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isUpdatingGST ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save GST Settings'
              )}
            </motion.button>
          </div>
          <AnimatePresence>
            {gstUpdateMessage.text && (
              <motion.p
                className={`mt-2 text-sm ${gstUpdateMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {gstUpdateMessage.text}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      {/* Item Configurations Section */}
      <motion.div
        className="bg-white shadow-lg rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Item Configurations (Description, HSN/SAC, Rate)</h2>
          <motion.button
            onClick={handleAddItemConfig}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add Item Config
          </motion.button>
        </div>

        {isItemFormLoading && settings.itemConfigurations.length === 0 && (
          <motion.div
            className="text-center text-gray-600 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-center items-center gap-2">
              <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading items...</span>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {itemFormError && (
            <motion.p
              className="text-red-500 text-sm mb-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {itemFormError}
            </motion.p>
          )}
        </AnimatePresence>

        {settings.itemConfigurations.length === 0 && !isItemFormLoading && (
          <motion.div
            className="text-center text-gray-600 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            No item configurations found. Add one to get started.
          </motion.div>
        )}

        {settings.itemConfigurations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">HSN/SAC</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Default Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {settings.itemConfigurations.map((item, index) => (
                    <motion.tr
                      key={item._id || item.description + item.hsnSacCode}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hsnSacCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.defaultRate !== undefined ? item.defaultRate.toFixed(2) : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <motion.button
                          onClick={() => handleEditItemConfig(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteItemConfig(item._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          disabled={isItemFormLoading}
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
          </div>
        )}
      </motion.div>

      {/* Modal for Add/Edit Item Configuration */}
      <AnimatePresence>
        {showItemFormModal && (
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
                onClick={handleCancelItemForm}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  {editingItemConfig ? 'Edit Item Configuration' : 'Add New Item Configuration'}
                </h3>
                <AnimatePresence>
                  {itemFormError && (
                    <motion.p
                      className="text-sm text-red-500 mb-3 text-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {itemFormError}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="mt-2 px-4 py-3">
                  <ItemConfigForm
                    onSubmit={handleItemFormSubmit}
                    initialData={editingItemConfig}
                    onCancel={handleCancelItemForm}
                    isLoading={isItemFormLoading}
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

export default SettingsPage;