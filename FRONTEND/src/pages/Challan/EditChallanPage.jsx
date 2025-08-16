import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChallanService from '../../services/ChallanService';
import CompanyService from '../../services/CompanyService';
import SettingsService from '../../services/SettingsService';

const EditChallanPage = () => {
  const navigate = useNavigate();
  const { id: challanId } = useParams();

  const [challanNumber, setChallanNumber] = useState('');
  const [challanDate, setChallanDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [descriptionOfGoods, setDescriptionOfGoods] = useState('');
  const [broker, setBroker] = useState('direct');
  const [boxDetails, setBoxDetails] = useState([{ boxNumber: '', netWeight: '', cops: '' }]);
  const [companies, setCompanies] = useState([]);
  const [settings, setSettings] = useState(null);
  const [availableDescriptions, setAvailableDescriptions] = useState([]);
  const [originalChallanNumber, setOriginalChallanNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingChallan, setIsFetchingChallan] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingChallan(true);
      setError('');
      try {
        const challanRes = await ChallanService.getChallanById(challanId);
        const challan = challanRes.data;
        setChallanNumber(challan.challanNumber);
        setOriginalChallanNumber(challan.challanNumber);
        setChallanDate(new Date(challan.challanDate).toISOString().split('T')[0]);
        setCompanyId(challan.company._id || challan.company);
        setDescriptionOfGoods(challan.descriptionOfGoods);
        setBroker(challan.broker || 'direct');
        setBoxDetails(challan.boxDetails.map(box => ({
          boxNumber: box.boxNumber,
          netWeight: box.netWeight.toString(),
          cops: box.cops.toString(),
        })) || [{ boxNumber: '', netWeight: '', cops: '' }]);

        const companyRes = await CompanyService.getAllCompanies();
        setCompanies(companyRes.data);

        const settingsRes = await SettingsService.getSettings();
        setSettings(settingsRes.data);
        setAvailableDescriptions(settingsRes.data.itemConfigurations.map(item => item.description) || []);
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to load challan data.';
        setError(errMsg);
        console.error("Error fetching data for challan edit:", err);
      }
      setIsFetchingChallan(false);
    };
    fetchData();
  }, [challanId]);

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

  const validateForm = () => {
    const errors = {};
    if (!challanNumber.trim()) errors.challanNumber = 'Challan number is required.';
    if (!challanDate) errors.challanDate = 'Challan date is required.';
    if (!companyId) errors.companyId = 'Company is required.';
    if (!descriptionOfGoods) errors.descriptionOfGoods = 'Description of goods is required.';
    if (boxDetails.length === 0) errors.boxDetails = 'At least one box is required.';
    
    boxDetails.forEach((box, index) => {
      if (!box.boxNumber.trim()) errors[`boxNumber_${index}`] = 'Box number is required.';
      if (!box.netWeight || isNaN(parseFloat(box.netWeight))) errors[`netWeight_${index}`] = 'Valid weight is required.';
      if (!box.cops || isNaN(parseInt(box.cops))) errors[`cops_${index}`] = 'Valid cops count is required.';
    });

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

    const challanData = {
      challanNumber,
      challanDate,
      companyId,
      descriptionOfGoods,
      broker,
      boxDetails: boxDetails.map(box => ({
        boxNumber: box.boxNumber,
        netWeight: parseFloat(box.netWeight),
        cops: parseInt(box.cops),
      })),
      _originalChallanNumber: originalChallanNumber !== challanNumber ? originalChallanNumber : undefined,
    };

    try {
      await ChallanService.updateChallan(challanId, challanData);
      setSuccessMessage('Challan updated successfully!');
      setTimeout(() => {
        navigate('/challans');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update challan.';
      setError(errMsg);
      console.error("Update challan error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = useCallback(() => {
    const totalNetWeight = boxDetails.reduce((acc, box) => acc + (parseFloat(box.netWeight) || 0), 0);
    const totalCops = boxDetails.reduce((acc, box) => acc + (parseInt(box.cops) || 0), 0);
    return {
      totalNetWeight: parseFloat(totalNetWeight.toFixed(2)),
      totalCops,
    };
  }, [boxDetails]);

  const totals = calculateTotals();

  if (isFetchingChallan) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-600 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Loading challan data for editing...
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
          Edit Challan (ID: {challanId})
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
                onChange={(e) => setDescriptionOfGoods(e.target.value)}
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
          </div>
        </motion.fieldset>

        <motion.fieldset
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Box Details</legend>
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
                <div className="sm:col-span-3">
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
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Net Weight (kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    placeholder="Weight"
                    value={box.netWeight}
                    min="0.01"
                    step="0.01"
                    onChange={(e) => handleBoxChange(index, 'netWeight', e.target.value)}
                    className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`netWeight_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  />
                  {formErrors[`netWeight_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`netWeight_${index}`]}</p>}
                </div>
                <div className="sm:col-span-3">
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
                  <div className="sm:col-span-3 flex items-end">
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

        <motion.div
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Totals</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <p>Total Boxes: {boxDetails.length}</p>
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
            {isLoading ? 'Updating...' : 'Update Challan'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default EditChallanPage;