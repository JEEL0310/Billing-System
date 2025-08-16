import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import ChallanService from '../../services/ChallanService';
import CompanyService from '../../services/CompanyService';
import SettingsService from '../../services/SettingsService';
import BoxService from '../../services/BoxService';

const CreateChallanPage = () => {
  const navigate = useNavigate();

  const [challanNumber, setChallanNumber] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyId, setCompanyId] = useState('');
  const [descriptionOfGoods, setDescriptionOfGoods] = useState('');
  const [broker, setBroker] = useState('direct');
  const [boxDetails, setBoxDetails] = useState([{ boxNumber: '', netWeight: '', cops: '' }]);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [availableBoxes, setAvailableBoxes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [settings, setSettings] = useState(null);
  const [availableDescriptions, setAvailableDescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' or 'box'

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [companyRes, settingsRes] = await Promise.all([
          CompanyService.getAllCompanies(),
          SettingsService.getSettings()
        ]);

        setCompanies(companyRes.data);
        setSettings(settingsRes.data);
        
        const descriptions = settingsRes.data.itemConfigurations.map(item => item.description) || [];
        setAvailableDescriptions(descriptions);
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to load initial data.';
        setError(errMsg);
        console.error("Error fetching initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchAvailableBoxes = useCallback(async () => {
    if (entryMode === 'box' && descriptionOfGoods) {
      try {
        setIsLoadingBoxes(true);
        setError('');
        const trimmedDescription = descriptionOfGoods.trim();
        
        if (!trimmedDescription) {
          setAvailableBoxes([]);
          return;
        }

        const response = await BoxService.getAvailableBoxes(trimmedDescription);
        
        if (response.data && Array.isArray(response.data)) {
          setAvailableBoxes(response.data);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error("Error fetching available boxes:", err);
        
        let errorMessage = 'Failed to load available boxes';
        let errorDetails = null;
        
        if (err.response?.data) {
          switch (err.response.data.code) {
            case 'MISSING_DESCRIPTION':
              errorMessage = 'Description parameter is required';
              break;
            case 'INVALID_DESCRIPTION':
              errorMessage = 'Invalid description selected';
              errorDetails = {
                available: err.response.data.availableDescriptions,
                received: err.response.data.receivedDescription
              };
              break;
            default:
              errorMessage = err.response.data.message || errorMessage;
          }
        } else {
          errorMessage = err.message || errorMessage;
        }
        
        setError(errorMessage);
        setAvailableBoxes([]);
        
        if (process.env.NODE_ENV === 'development' && errorDetails) {
          console.log('Error details:', errorDetails);
        }
      } finally {
        setIsLoadingBoxes(false);
      }
    } else {
      setAvailableBoxes([]);
    }
  }, [entryMode, descriptionOfGoods]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAvailableBoxes();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchAvailableBoxes]);

  const handleBoxChange = (index, field, value) => {
    const newBoxDetails = [...boxDetails];
    newBoxDetails[index][field] = value;
    setBoxDetails(newBoxDetails);
  };

  const addBox = () => {
    setBoxDetails([...boxDetails, { boxNumber: '', netWeight: '', cops: '' }]);
  };

  const removeBox = (index) => {
    const newBoxDetails = boxDetails.filter((_, i) => i !== index);
    setBoxDetails(newBoxDetails);
  };

  const toggleBoxSelection = (boxId) => {
    setSelectedBoxes(prev => 
      prev.includes(boxId) 
        ? prev.filter(id => id !== boxId) 
        : [...prev, boxId]
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!challanNumber.trim()) errors.challanNumber = 'Challan number is required.';
    if (!challanDate) errors.challanDate = 'Challan date is required.';
    if (!companyId) errors.companyId = 'Company is required.';
    if (!descriptionOfGoods) errors.descriptionOfGoods = 'Description of goods is required.';
    
    if (entryMode === 'manual') {
      if (boxDetails.length === 0) errors.boxDetails = 'At least one box is required.';
      
      boxDetails.forEach((box, index) => {
        if (!box.boxNumber.trim()) errors[`boxNumber_${index}`] = 'Box number is required.';
        if (!box.netWeight || isNaN(parseFloat(box.netWeight))) errors[`netWeight_${index}`] = 'Valid net weight is required.';
        if (!box.cops || isNaN(parseInt(box.cops))) errors[`cops_${index}`] = 'Valid cops count is required.';
      });
    } else {
      if (selectedBoxes.length === 0) errors.selectedBoxes = 'Please select at least one box.';
    }

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

    try {
      const challanData = {
        challanNumber,
        challanDate,
        companyId,
        descriptionOfGoods,
        broker,
        ...(entryMode === 'manual' 
          ? { 
              boxDetails: boxDetails.map(box => ({
                boxNumber: box.boxNumber,
                netWeight: parseFloat(box.netWeight),
                cops: parseInt(box.cops),
              }))
            }
          : { boxIds: selectedBoxes }
        )
      };

      await ChallanService.createChallan(challanData);
      setSuccessMessage('Challan created successfully!');
      setTimeout(() => {
        navigate('/challans');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to create challan.';
      setError(errMsg);
      console.error("Create challan error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = useCallback(() => {
    if (entryMode === 'manual') {
      const totalNetWeight = boxDetails.reduce((acc, box) => acc + (parseFloat(box.netWeight) || 0), 0);
      const totalCops = boxDetails.reduce((acc, box) => acc + (parseInt(box.cops) || 0), 0);
      return {
        totalNetWeight: parseFloat(totalNetWeight.toFixed(2)),
        totalCops,
      };
    } else {
      const selectedBoxData = availableBoxes.filter(box => selectedBoxes.includes(box._id));
      const totalNetWeight = selectedBoxData.reduce((acc, box) => acc + box.netWeight, 0);
      const totalCops = selectedBoxData.reduce((acc, box) => acc + box.cops, 0);
      return {
        totalNetWeight: parseFloat(totalNetWeight.toFixed(2)),
        totalCops,
      };
    }
  }, [boxDetails, entryMode, availableBoxes, selectedBoxes]);

  const totals = calculateTotals();

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescriptionOfGoods(value);
    
    if (error && error.includes('description')) {
      setError('');
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
          Create New Challan
        </motion.h1>
        <Link
          to="/challans"
          className="text-indigo-600 hover:text-indigo-800 transition-colors text-xs sm:text-sm"
        >
          ← Back to Challan List
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
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            {error.includes('description') && availableDescriptions.length > 0 && (
              <div className="mt-2 text-xs">
                Available descriptions: {availableDescriptions.join(', ')}
              </div>
            )}
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
        className="bg-white shadow-lg rounded-xl p-4 sm:p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.fieldset
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Challan Details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            <div>
              <label htmlFor="challanNumber" className="block text-xs sm:text-sm font-medium text-gray-700">Challan Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="challanNumber"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.challanNumber ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              />
              {formErrors.challanNumber && <p className="text-xs text-red-500 mt-1">{formErrors.challanNumber}</p>}
            </div>
            <div>
              <label htmlFor="challanDate" className="block text-xs sm:text-sm font-medium text-gray-700">Challan Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="challanDate"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.challanDate ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              />
              {formErrors.challanDate && <p className="text-xs text-red-500 mt-1">{formErrors.challanDate}</p>}
            </div>
            <div>
              <label htmlFor="companyId" className="block text-xs sm:text-sm font-medium text-gray-700">Company <span className="text-red-500">*</span></label>
              <select
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.companyId ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              >
                <option value="">Select Company</option>
                {companies.map(comp => (
                  <option key={comp._id} value={comp._id}>{comp.name}</option>
                ))}
              </select>
              {formErrors.companyId && <p className="text-xs text-red-500 mt-1">{formErrors.companyId}</p>}
            </div>
            <div>
              <label htmlFor="descriptionOfGoods" className="block text-xs sm:text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
              <input
                list="descriptions"
                id="descriptionOfGoods"
                value={descriptionOfGoods}
                onChange={handleDescriptionChange}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.descriptionOfGoods ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              />
              <datalist id="descriptions">
                {availableDescriptions.map(desc => (
                  <option key={desc} value={desc} />
                ))}
              </datalist>
              {formErrors.descriptionOfGoods && <p className="text-xs text-red-500 mt-1">{formErrors.descriptionOfGoods}</p>}
            </div>
            <div>
              <label htmlFor="broker" className="block text-xs sm:text-sm font-medium text-gray-700">Broker</label>
              <select
                id="broker"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="mt-1 block w-full p-2 text-xs sm:text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="direct">Direct</option>
                <option value="broker1">Broker 1</option>
                <option value="broker2">Broker 2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Entry Mode <span className="text-red-500">*</span></label>
              <div className="mt-1 flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="text-indigo-600 focus:ring-indigo-500"
                    checked={entryMode === 'manual'}
                    onChange={() => setEntryMode('manual')}
                  />
                  <span className="ml-2 text-xs sm:text-sm">Manual Entry</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="text-indigo-600 focus:ring-indigo-500"
                    checked={entryMode === 'box'}
                    onChange={() => setEntryMode('box')}
                  />
                  <span className="ml-2 text-xs sm:text-sm">Select Boxes</span>
                </label>
              </div>
            </div>
          </div>
        </motion.fieldset>

        {entryMode === 'manual' ? (
          <motion.fieldset
            className="border border-gray-200 p-3 sm:p-4 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Box Details (Manual Entry)</legend>
            <AnimatePresence>
              {boxDetails.map((box, index) => (
                <motion.div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 p-2 sm:p-3 border-b last:border-b-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-700">Box Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Box Number"
                      value={box.boxNumber}
                      onChange={(e) => handleBoxChange(index, 'boxNumber', e.target.value)}
                      className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`boxNumber_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    />
                    {formErrors[`boxNumber_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`boxNumber_${index}`]}</p>}
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-700">Net Weight (kg) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      placeholder="Net Weight"
                      value={box.netWeight}
                      min="0.01"
                      step="0.01"
                      onChange={(e) => handleBoxChange(index, 'netWeight', e.target.value)}
                      className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`netWeight_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    />
                    {formErrors[`netWeight_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`netWeight_${index}`]}</p>}
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-700">Cops <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      placeholder="Cops"
                      value={box.cops}
                      min="1"
                      step="1"
                      onChange={(e) => handleBoxChange(index, 'cops', e.target.value)}
                      className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`cops_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    />
                    {formErrors[`cops_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`cops_${index}`]}</p>}
                  </div>
                  {boxDetails.length > 1 && (
                    <div className="sm:col-span-12 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeBox(index)}
                        className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              type="button"
              onClick={addBox}
              className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm"
            >
              + Add Box
            </button>
          </motion.fieldset>
        ) : (
          <motion.fieldset
            className="border border-gray-200 p-3 sm:p-4 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Select Boxes</legend>
            {formErrors.selectedBoxes && (
              <p className="text-xs text-red-500 mb-2">{formErrors.selectedBoxes}</p>
            )}
            
            {isLoadingBoxes ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-500">Loading available boxes...</p>
              </div>
            ) : availableBoxes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-2 py-2 text-left font-medium text-gray-500">Select</th>
                      <th scope="col" className="px-2 py-2 text-left font-medium text-gray-500">Box No.</th>
                      <th scope="col" className="px-2 py-2 text-left font-medium text-gray-500">Net Weight</th>
                      <th scope="col" className="px-2 py-2 text-left font-medium text-gray-500">Cops</th>
                      <th scope="col" className="px-2 py-2 text-left font-medium text-gray-500">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availableBoxes.map((box) => (
                      <tr key={box._id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBoxes.includes(box._id)}
                            onChange={() => toggleBoxSelection(box._id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">{box.boxNumber}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{box.netWeight.toFixed(2)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{box.cops}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{box.grade || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {descriptionOfGoods 
                  ? 'No available boxes found for this description.' 
                  : 'Please select a valid description to see available boxes.'}
              </div>
            )}
          </motion.fieldset>
        )}

        <motion.div
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Totals</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <p>Total {entryMode === 'manual' ? 'Boxes' : 'Selected Boxes'}: {entryMode === 'manual' ? boxDetails.length : selectedBoxes.length}</p>
            <p>Total Net Weight: {totals.totalNetWeight.toFixed(2)} kg</p>
            <p>Total Cops: {totals.totalCops}</p>
          </div>
        </motion.div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/challans')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs sm:text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Creating...' : 'Create Challan'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default CreateChallanPage;