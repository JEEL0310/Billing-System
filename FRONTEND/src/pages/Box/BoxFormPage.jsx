import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import BoxService from '../../services/BoxService';
import SettingsService from '../../services/SettingsService';

const BoxFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [boxData, setBoxData] = useState({
    boxNumber: '',
    descriptionOfGoods: '',
    grossWeight: '',
    tareWeight: '',
    netWeight: '',
    cops: '',
    grade: ''
  });
  const [availableDescriptions, setAvailableDescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const settingsRes = await SettingsService.getSettings();
        setAvailableDescriptions(settingsRes.data.itemConfigurations.map(item => item.description) || []);
        
        if (isEditMode) {
          const boxRes = await BoxService.getBoxById(id);
          const { _id, createdBy, createdAt, updatedAt, isUsed, ...box } = boxRes.data;
          setBoxData(box);
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to load initial data.';
        setError(errMsg);
      }
    };
    fetchInitialData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBoxData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Calculate net weight when gross or tare weight changes
      if (name === 'grossWeight' || name === 'tareWeight') {
        const gross = parseFloat(newData.grossWeight) || 0;
        const tare = parseFloat(newData.tareWeight) || 0;
        newData.netWeight = (gross - tare).toFixed(2);
      }
      
      return newData;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!boxData.boxNumber.trim()) errors.boxNumber = 'Box number is required.';
    if (!boxData.descriptionOfGoods) errors.descriptionOfGoods = 'Description is required.';
    if (!boxData.grossWeight || isNaN(parseFloat(boxData.grossWeight))) errors.grossWeight = 'Valid gross weight is required.';
    if (!boxData.tareWeight || isNaN(parseFloat(boxData.tareWeight))) errors.tareWeight = 'Valid tare weight is required.';
    if (!boxData.cops || isNaN(parseInt(boxData.cops))) errors.cops = 'Valid cops count is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError("Please correct the errors in the form.");
      return;
    }
    setError('');
    setIsLoading(true);

    const payload = {
      ...boxData,
      grossWeight: parseFloat(boxData.grossWeight),
      tareWeight: parseFloat(boxData.tareWeight),
      netWeight: parseFloat(boxData.netWeight),
      cops: parseInt(boxData.cops)
    };

    try {
      if (isEditMode) {
        await BoxService.updateBox(id, payload);
        setSuccessMessage('Box updated successfully!');
      } else {
        await BoxService.createBox(payload);
        setSuccessMessage('Box created successfully!');
      }
      setTimeout(() => navigate('/boxes'), 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} box.`;
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-6 sm:mb-8 gap-4">
        <Link
          to="/boxes"
          className="text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {isEditMode ? 'Edit Box' : 'Create New Box'}
        </motion.h1>
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

      <motion.form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="boxNumber" className="block text-sm font-medium text-gray-700 mb-1">Box Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="boxNumber"
              name="boxNumber"
              value={boxData.boxNumber}
              onChange={handleChange}
              className={`w-full p-3 border ${formErrors.boxNumber ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
            />
            {formErrors.boxNumber && <p className="text-xs text-red-500 mt-1">{formErrors.boxNumber}</p>}
          </div>

          <div>
            <label htmlFor="descriptionOfGoods" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <select
              id="descriptionOfGoods"
              name="descriptionOfGoods"
              value={boxData.descriptionOfGoods}
              onChange={handleChange}
              className={`w-full p-3 border ${formErrors.descriptionOfGoods ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
            >
              <option value="">Select Description</option>
              {availableDescriptions.map(desc => (
                <option key={desc} value={desc}>{desc}</option>
              ))}
            </select>
            {formErrors.descriptionOfGoods && <p className="text-xs text-red-500 mt-1">{formErrors.descriptionOfGoods}</p>}
          </div>

          <div>
            <label htmlFor="grossWeight" className="block text-sm font-medium text-gray-700 mb-1">Gross Weight (kg) <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="grossWeight"
              name="grossWeight"
              value={boxData.grossWeight}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              className={`w-full p-3 border ${formErrors.grossWeight ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
            />
            {formErrors.grossWeight && <p className="text-xs text-red-500 mt-1">{formErrors.grossWeight}</p>}
          </div>

          <div>
            <label htmlFor="tareWeight" className="block text-sm font-medium text-gray-700 mb-1">Tare Weight (kg) <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="tareWeight"
              name="tareWeight"
              value={boxData.tareWeight}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              className={`w-full p-3 border ${formErrors.tareWeight ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
            />
            {formErrors.tareWeight && <p className="text-xs text-red-500 mt-1">{formErrors.tareWeight}</p>}
          </div>

          <div>
            <label htmlFor="netWeight" className="block text-sm font-medium text-gray-700 mb-1">Net Weight (kg)</label>
            <input
              type="text"
              id="netWeight"
              name="netWeight"
              value={boxData.netWeight}
              readOnly
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="cops" className="block text-sm font-medium text-gray-700 mb-1">Cops <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="cops"
              name="cops"
              value={boxData.cops}
              onChange={handleChange}
              min="1"
              step="1"
              className={`w-full p-3 border ${formErrors.cops ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
            />
            {formErrors.cops && <p className="text-xs text-red-500 mt-1">{formErrors.cops}</p>}
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={boxData.grade}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : (isEditMode ? 'Update Box' : 'Create Box')}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default BoxFormPage;