import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BillService from '../../services/BillService';
import CompanyService from '../../services/CompanyService';
import SettingsService from '../../services/SettingsService';

const EditBillPage = () => {
  const navigate = useNavigate();
  const { id: billId } = useParams();

  const [billNumber, setBillNumber] = useState('');
  const [challanMode, setChallanMode] = useState('manual');
  const [challanId, setChallanId] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [items, setItems] = useState([{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
  const [rate, setRate] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxType, setTaxType] = useState('CGST_SGST');
  const [overrideCgstPercentage, setOverrideCgstPercentage] = useState('');
  const [overrideSgstPercentage, setOverrideSgstPercentage] = useState('');
  const [overrideIgstPercentage, setOverrideIgstPercentage] = useState('');
  const [overrideJobCgstPercentage, setOverrideJobCgstPercentage] = useState('');
  const [overrideJobSgstPercentage, setOverrideJobSgstPercentage] = useState('');
  const [status, setStatus] = useState('Pending');
  const [amountInWords, setAmountInWords] = useState('');
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [availableChallans, setAvailableChallans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [settings, setSettings] = useState(null);
  const [availableItemConfigs, setAvailableItemConfigs] = useState([]);
  const [originalBillNumber, setOriginalBillNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBill, setIsFetchingBill] = useState(true);
  const [isLoadingChallans, setIsLoadingChallans] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingBill(true);
      setError('');
      try {
        const billRes = await BillService.getBillById(billId);
        const bill = billRes.data;
        setBillNumber(bill.billNumber);
        setOriginalBillNumber(bill.billNumber);
        setChallanNumber(bill.challanNumber || '');
        setBillDate(new Date(bill.billDate).toISOString().split('T')[0]);
        setCompanyId(bill.company._id || bill.company);
        setItems(bill.items.map(item => ({ ...item, id: item._id, amount: parseFloat((item.quantity * item.rate).toFixed(2)) })) || [{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
        setDiscountPercentage(bill.discountPercentage || 0);
        setTaxType(bill.taxType || 'CGST_SGST');
        setOverrideCgstPercentage(bill.overrideCgstPercentage || '');
        setOverrideSgstPercentage(bill.overrideSgstPercentage || '');
        setOverrideIgstPercentage(bill.overrideIgstPercentage || '');
        setOverrideJobCgstPercentage(bill.overrideJobCgstPercentage || '');
        setOverrideJobSgstPercentage(bill.overrideJobSgstPercentage || '');
        setStatus(bill.status || 'Pending');
        setAmountInWords(bill.amountInWords || '');
        setPaymentRecords(bill.paymentRecords || []);
        setChallanId(bill.challan?._id || '');
        setChallanMode(bill.challan ? 'challan' : 'manual');
        setRate(bill.items[0]?.rate || '');

        const companyRes = await CompanyService.getAllCompanies();
        setCompanies(companyRes.data);

        const settingsRes = await SettingsService.getSettings();
        setSettings(settingsRes.data);
        setAvailableItemConfigs(settingsRes.data.itemConfigurations || []);

        if (bill.company._id && bill.challan) {
          setAvailableChallans([{ ...bill.challan, _id: bill.challan._id }]);
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to load bill data.';
        setError(errMsg);
        console.error("Error fetching data for bill edit:", err);
      }
      setIsFetchingBill(false);
    };
    fetchData();
  }, [billId]);

  useEffect(() => {
    const fetchChallans = async () => {
      if (companyId && challanMode === 'challan') {
        setIsLoadingChallans(true);
        try {
          const challanRes = await BillService.getAvailableChallans(companyId);
          let challans = challanRes.data;
          const billRes = await BillService.getBillById(billId);
          const bill = billRes.data;
          if (bill.challan) {
            challans = [
              { ...bill.challan, _id: bill.challan._id },
              ...challans.filter(ch => ch._id !== bill.challan._id),
            ];
          }
          setAvailableChallans(challans);
          if (challans.length === 0) {
            setError('No unused challans available for the selected company. Please use manual entry or create a new challan.');
            setChallanMode('manual');
            setChallanId('');
            setItems([{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
            setRate('');
          } else {
            setError('');
          }
        } catch (err) {
          const errMsg = err.response?.data?.message || 'Failed to load available challans. Please try again.';
          setError(errMsg);
          console.error("Error fetching challans:", err);
          setChallanMode('manual');
          setChallanId('');
          setItems([{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
          setRate('');
        }
        setIsLoadingChallans(false);
      } else {
        setAvailableChallans([]);
        setChallanId('');
        setError('');
      }
    };
    fetchChallans();
  }, [companyId, challanMode, billId]);

  const handleChallanChange = (challanId) => {
    setChallanId(challanId);
    if (challanId) {
      const selectedChallan = availableChallans.find(ch => ch._id === challanId);
      if (selectedChallan) {
        const itemConfig = availableItemConfigs.find(config => config.description === selectedChallan.descriptionOfGoods) || {};
        setItems([{
          description: selectedChallan.descriptionOfGoods || '',
          hsnSacCode: itemConfig.hsnSacCode || '',
          quantity: selectedChallan.totalNetWeight || 1,
          rate: parseFloat(rate) || itemConfig.defaultRate || 0,
          amount: parseFloat((selectedChallan.totalNetWeight * (parseFloat(rate) || itemConfig.defaultRate || 0)).toFixed(2)),
        }]);
        setChallanNumber(selectedChallan.challanNumber);
      }
    } else {
      setItems([{ description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
      setChallanNumber('');
      setRate('');
    }
  };

  const handleItemChange = (index, field, value) => {
    if (challanMode === 'challan') return;
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'description') {
      const selectedConfig = availableItemConfigs.find(config => config.description === value);
      if (selectedConfig) {
        newItems[index].hsnSacCode = selectedConfig.hsnSacCode;
        newItems[index].rate = selectedConfig.defaultRate !== undefined ? selectedConfig.defaultRate : 0;
      }
    }
    const qty = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    newItems[index].amount = parseFloat((qty * rate).toFixed(2));
    setItems(newItems);
  };

  const addItem = () => {
    if (challanMode === 'challan') return;
    setItems([...items, { description: '', hsnSacCode: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index) => {
    if (challanMode === 'challan') return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const addPaymentRecord = () => {
    setPaymentRecords([...paymentRecords, {
      paymentDate: new Date().toISOString().split('T')[0],
      amountPaid: '',
      paymentMethod: '',
      referenceNumber: '',
      notes: ''
    }]);
  };

  const handlePaymentRecordChange = (index, field, value) => {
    const newRecords = [...paymentRecords];
    newRecords[index][field] = value;
    setPaymentRecords(newRecords);
  };

  const removePaymentRecord = (index) => {
    const newRecords = paymentRecords.filter((_, i) => i !== index);
    setPaymentRecords(newRecords);
  };

  const validateForm = () => {
    const errors = {};
    if (!billNumber.trim()) errors.billNumber = 'Bill number is required.';
    if (!billDate) errors.billDate = 'Bill date is required.';
    if (!companyId) errors.companyId = 'Company is required.';
    if (challanMode === 'manual' && items.length === 0) errors.items = 'At least one item is required in manual mode.';
    if (challanMode === 'challan' && !challanId) errors.challanId = 'Challan selection is required in challan mode.';
    if (challanMode === 'manual') {
      items.forEach((item, index) => {
        if (!item.description.trim()) errors[`item_description_${index}`] = 'Description is required.';
        if (!item.hsnSacCode.trim()) errors[`item_hsn_${index}`] = 'HSN/SAC is required.';
        if (isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) errors[`item_qty_${index}`] = 'Valid quantity is required.';
        if (isNaN(parseFloat(item.rate)) || parseFloat(item.rate) < 0) errors[`item_rate_${index}`] = 'Valid rate is required.';
      });
    }
    if (challanMode === 'challan' && (isNaN(parseFloat(rate)) || parseFloat(rate) < 0)) errors.rate = 'Valid rate is required in challan mode.';
    if (!taxType) errors.taxType = 'Tax type is required.';
    if (discountPercentage < 0 || discountPercentage > 100) errors.discountPercentage = 'Discount must be between 0 and 100.';
    if (!status) errors.status = 'Status is required.';
    if (overrideCgstPercentage && (isNaN(parseFloat(overrideCgstPercentage)) || parseFloat(overrideCgstPercentage) < 0)) errors.overrideCgstPercentage = 'Valid CGST percentage is required.';
    if (overrideSgstPercentage && (isNaN(parseFloat(overrideSgstPercentage)) || parseFloat(overrideSgstPercentage) < 0)) errors.overrideSgstPercentage = 'Valid SGST percentage is required.';
    if (overrideIgstPercentage && (isNaN(parseFloat(overrideIgstPercentage)) || parseFloat(overrideIgstPercentage) < 0)) errors.overrideIgstPercentage = 'Valid IGST percentage is required.';
    if (overrideJobCgstPercentage && (isNaN(parseFloat(overrideJobCgstPercentage)) || parseFloat(overrideJobCgstPercentage) < 0)) errors.overrideJobCgstPercentage = 'Valid JOBCGST percentage is required.';
    if (overrideJobSgstPercentage && (isNaN(parseFloat(overrideJobSgstPercentage)) || parseFloat(overrideJobSgstPercentage) < 0)) errors.overrideJobSgstPercentage = 'Valid JOBSGST percentage is required.';
    paymentRecords.forEach((record, index) => {
      if (!record.paymentDate) errors[`payment_date_${index}`] = 'Payment date is required.';
      if (isNaN(parseFloat(record.amountPaid)) || parseFloat(record.amountPaid) <= 0) errors[`payment_amount_${index}`] = 'Valid payment amount is required.';
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

    const billData = {
      billNumber,
      billDate,
      companyId,
      discountPercentage: parseFloat(discountPercentage) || 0,
      taxType,
      status,
      amountInWords,
      paymentRecords: paymentRecords.map(record => ({
        paymentDate: record.paymentDate,
        amountPaid: parseFloat(record.amountPaid),
        paymentMethod: record.paymentMethod,
        referenceNumber: record.referenceNumber,
        notes: record.notes
      })),
      overrideCgstPercentage: parseFloat(overrideCgstPercentage) || undefined,
      overrideSgstPercentage: parseFloat(overrideSgstPercentage) || undefined,
      overrideIgstPercentage: parseFloat(overrideIgstPercentage) || undefined,
      overrideJobCgstPercentage: parseFloat(overrideJobCgstPercentage) || undefined,
      overrideJobSgstPercentage: parseFloat(overrideJobSgstPercentage) || undefined,
      _originalBillNumber: originalBillNumber !== billNumber ? originalBillNumber : undefined,
    };

    if (challanMode === 'challan') {
      billData.challanId = challanId;
      if (rate) billData.rate = parseFloat(rate);
    } else {
      billData.challanNumber = challanNumber;
      billData.items = items.map(item => ({
        description: item.description,
        hsnSacCode: item.hsnSacCode,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
      }));
    }

    try {
      await BillService.updateBill(billId, billData);
      setSuccessMessage('Bill updated successfully!');
      setTimeout(() => {
        navigate('/bills');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update bill.';
      setError(errMsg);
      console.error("Update bill error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePreviewTotals = useCallback(() => {
    let subTotal = 0;
    items.forEach(item => {
      subTotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    });
    subTotal = parseFloat(subTotal.toFixed(2));
    const discount = parseFloat((subTotal * (parseFloat(discountPercentage) / 100)).toFixed(2)) || 0;
    const amountAfterDiscount = parseFloat((subTotal - discount).toFixed(2));
    let totalTax = 0;
    let cgst = 0, sgst = 0, igst = 0, jobCgst = 0, jobSgst = 0;

    if (settings) {
      if (taxType === 'CGST_SGST') {
        const cgstRate = parseFloat(overrideCgstPercentage) || settings.cgstPercentage;
        const sgstRate = parseFloat(overrideSgstPercentage) || settings.sgstPercentage;
        cgst = parseFloat((amountAfterDiscount * (cgstRate / 100)).toFixed(2));
        sgst = parseFloat((amountAfterDiscount * (sgstRate / 100)).toFixed(2));
        totalTax = cgst + sgst;
      } else if (taxType === 'IGST') {
        const igstRate = parseFloat(overrideIgstPercentage) || settings.igstPercentage;
        igst = parseFloat((amountAfterDiscount * (igstRate / 100)).toFixed(2));
        totalTax = igst;
      } else if (taxType === 'JOBCGST_JOBSGST') {
        const jobCgstRate = parseFloat(overrideJobCgstPercentage) || settings.jobCgstPercentage;
        const jobSgstRate = parseFloat(overrideJobSgstPercentage) || settings.jobSgstPercentage;
        jobCgst = parseFloat((amountAfterDiscount * (jobCgstRate / 100)).toFixed(2));
        jobSgst = parseFloat((amountAfterDiscount * (jobSgstRate / 100)).toFixed(2));
        totalTax = jobCgst + jobSgst;
      }
    }
    totalTax = parseFloat(totalTax.toFixed(2));
    const grandTotal = parseFloat((amountAfterDiscount + totalTax).toFixed(2));
    return { subTotal, discount, amountAfterDiscount, cgst, sgst, igst, jobCgst, jobSgst, totalTax, grandTotal };
  }, [items, discountPercentage, taxType, settings, overrideCgstPercentage, overrideSgstPercentage, overrideIgstPercentage, overrideJobCgstPercentage, overrideJobSgstPercentage]);

  const preview = calculatePreviewTotals();

  if (isFetchingBill) {
    return (
      <motion.div
        className="container mx-auto p-4 sm:p-8 text-center text-gray-600 text-sm sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Loading bill data for editing...
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
          Edit Bill (ID: {billId})
        </motion.h1>
        <Link
          to="/bills"
          className="text-indigo-600 hover:text-indigo-800 transition-colors text-xs sm:text-sm"
        >
          ← Back to Bill List
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
          <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Bill Details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            <div>
              <label htmlFor="billNumber" className="block text-xs sm:text-sm font-medium text-gray-700">Bill Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="billNumber"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.billNumber ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              />
              {formErrors.billNumber && <p className="text-xs text-red-500 mt-1">{formErrors.billNumber}</p>}
            </div>
            <div>
              <label htmlFor="billDate" className="block text-xs sm:text-sm font-medium text-gray-700">Bill Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="billDate"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.billDate ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              />
              {formErrors.billDate && <p className="text-xs text-red-500 mt-1">{formErrors.billDate}</p>}
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
              <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.status ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {formErrors.status && <p className="text-xs text-red-500 mt-1">{formErrors.status}</p>}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Bill Type <span className="text-red-500">*</span></label>
              <div className="mt-1 flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="challanMode"
                    value="challan"
                    checked={challanMode === 'challan'}
                    onChange={() => setChallanMode('challan')}
                    className="mr-2"
                  />
                  Use Challan
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="challanMode"
                    value="manual"
                    checked={challanMode === 'manual'}
                    onChange={() => setChallanMode('manual')}
                    className="mr-2"
                  />
                  Manual Entry
                </label>
              </div>
            </div>
          </div>
          {challanMode === 'challan' && (
            <div className="mt-4">
              <label htmlFor="challanId" className="block text-xs sm:text-sm font-medium text-gray-700">Select Challan <span className="text-red-500">*</span></label>
              <select
                id="challanId"
                value={challanId}
                onChange={(e) => handleChallanChange(e.target.value)}
                disabled={isLoadingChallans || !companyId}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.challanId ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${isLoadingChallans || !companyId ? 'bg-gray-100' : ''}`}
              >
                <option value="">{availableChallans.length > 0 ? 'Select a challan' : 'No challans available'}</option>
                {availableChallans.map(ch => (
                  <option key={ch._id} value={ch._id}>
                    {ch.challanNumber} - {ch.descriptionOfGoods} (Wt: {ch.totalNetWeight})
                    {ch._id === challanId ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
              {formErrors.challanId && <p className="text-xs text-red-500 mt-1">{formErrors.challanId}</p>}
              {isLoadingChallans && <p className="text-xs text-gray-500 mt-1">Loading challans...</p>}
            </div>
          )}
          {challanMode === 'manual' && (
            <div className="mt-4">
              <label htmlFor="challanNumber" className="block text-xs sm:text-sm font-medium text-gray-700">Challan Number</label>
              <input
                type="text"
                id="challanNumber"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                className="mt-1 block w-full p-2 text-xs sm:text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          )}
        </motion.fieldset>

        <motion.fieldset
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Bill Items</legend>
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id || index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 p-2 sm:p-3 border-b last:border-b-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                  <input
                    list={`item-descriptions-${index}`}
                    type="text"
                    placeholder="Item Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    disabled={challanMode === 'challan'}
                    className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`item_description_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${challanMode === 'challan' ? 'bg-gray-100' : ''}`}
                  />
                  <datalist id={`item-descriptions-${index}`}>
                    {availableItemConfigs.map(conf => (
                      <option key={conf._id || conf.description} value={conf.description} />
                    ))}
                  </datalist>
                  {formErrors[`item_description_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`item_description_${index}`]}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">HSN/SAC <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="HSN/SAC"
                    value={item.hsnSacCode}
                    onChange={(e) => handleItemChange(index, 'hsnSacCode', e.target.value)}
                    disabled={challanMode === 'challan'}
                    className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`item_hsn_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${challanMode === 'challan' ? 'bg-gray-100' : ''}`}
                  />
                  {formErrors[`item_hsn_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`item_hsn_${index}`]}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    min="0.01"
                    step="0.01"
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    disabled={challanMode === 'challan'}
                    className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`item_qty_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${challanMode === 'challan' ? 'bg-gray-100' : ''}`}
                  />
                  {formErrors[`item_qty_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`item_qty_${index}`]}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Rate <span className="text-red-500">*</span></label>
                  {challanMode === 'challan' ? (
                    <input
                      type="number"
                      placeholder="Rate"
                      value={rate}
                      min="0"
                      step="0.01"
                      onChange={(e) => {
                        setRate(e.target.value);
                        if (challanId) {
                          const newItems = [...items];
                          const qty = parseFloat(newItems[index].quantity) || 0;
                          const newRate = parseFloat(e.target.value) || 0;
                          newItems[index].rate = newRate;
                          newItems[index].amount = parseFloat((qty * newRate).toFixed(2));
                          setItems(newItems);
                        }
                      }}
                      className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors.rate ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    />
                  ) : (
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      min="0"
                      step="0.01"
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`item_rate_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                    />
                  )}
                  {formErrors[`item_rate_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`item_rate_${index}`]}</p>}
                  {formErrors.rate && <p className="text-xs text-red-500 mt-1">{formErrors.rate}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Amount</label>
                  <input
                    type="text"
                    value={item.amount.toFixed(2)}
                    readOnly
                    className="mt-1 w-full p-2 text-xs sm:text-sm bg-gray-100 border border-gray-200 rounded-lg shadow-sm"
                  />
                </div>
                {challanMode === 'manual' && items.length > 1 && (
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {challanMode === 'manual' && (
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm"
            >
              + Add Item
            </button>
          )}
        </motion.fieldset>

        <motion.fieldset
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Tax and Discount</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            <div>
              <label htmlFor="taxType" className="block text-xs sm:text-sm font-medium text-gray-700">Tax Type <span className="text-red-500">*</span></label>
              <select
                id="taxType"
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.taxType ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              >
                <option value="CGST_SGST">CGST + SGST</option>
                <option value="IGST">IGST</option>
                <option value="JOBCGST_JOBSGST">JOBCGST + JOBSGST</option>
              </select>
              {formErrors.taxType && <p className="text-xs text-red-500 mt-1">{formErrors.taxType}</p>}
            </div>
            <div>
              <label htmlFor="discountPercentage" className="block text-xs sm:text-sm font-medium text-gray-700">Discount (%)</label>
              <input
                type="number"
                id="discountPercentage"
                value={discountPercentage}
                min="0"
                max="100"
                step="0.01"
                onChange={(e) => setDiscountPercentage(e.target.value)}
                className={`mt-1 block w-full p-2 text-xs sm:text-sm border ${formErrors.discountPercentage ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              />
              {formErrors.discountPercentage && <p className="text-xs text-red-500 mt-1">{formErrors.discountPercentage}</p>}
            </div>
          </div>
        </motion.fieldset>

        <motion.fieldset
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <legend className="text-base sm:text-lg font-semibold px-2 text-gray-700">Payment Records</legend>
          <AnimatePresence>
            {paymentRecords.map((record, index) => (
              <motion.div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 p-2 sm:p-3 border-b last:border-b-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Payment Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={record.paymentDate}
                    onChange={(e) => handlePaymentRecordChange(index, 'paymentDate', e.target.value)}
                    className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`payment_date_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  />
                  {formErrors[`payment_date_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`payment_date_${index}`]}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Amount Paid <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={record.amountPaid}
                    min="0.01"
                    step="0.01"
                    onChange={(e) => handlePaymentRecordChange(index, 'amountPaid', e.target.value)}
                    className={`mt-1 w-full p-2 text-xs sm:text-sm border ${formErrors[`payment_amount_${index}`] ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  />
                  {formErrors[`payment_amount_${index}`] && <p className="text-xs text-red-500 mt-1">{formErrors[`payment_amount_${index}`]}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Payment Method</label>
                  <input
                    type="text"
                    placeholder="Payment Method"
                    value={record.paymentMethod}
                    onChange={(e) => handlePaymentRecordChange(index, 'paymentMethod', e.target.value)}
                    className="mt-1 w-full p-2 text-xs sm:text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Reference Number</label>
                  <input
                    type="text"
                    placeholder="Reference Number"
                    value={record.referenceNumber}
                    onChange={(e) => handlePaymentRecordChange(index, 'referenceNumber', e.target.value)}
                    className="mt-1 w-full p-2 text-xs sm:text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Notes</label>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={record.notes}
                    onChange={(e) => handlePaymentRecordChange(index, 'notes', e.target.value)}
                    className="mt-1 w-full p-2 text-xs sm:text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removePaymentRecord(index)}
                    className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            type="button"
            onClick={addPaymentRecord}
            className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm"
          >
            + Add Payment Record
          </button>
        </motion.fieldset>

        <motion.div
          className="border border-gray-200 p-3 sm:p-4 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Bill Summary</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <p>Subtotal: ₹{preview.subTotal.toFixed(2)}</p>
            <p>Discount ({discountPercentage}%): ₹{preview.discount.toFixed(2)}</p>
            <p>Amount After Discount: ₹{preview.amountAfterDiscount.toFixed(2)}</p>
            {taxType === 'CGST_SGST' ? (
              <>
                <p>CGST ({parseFloat(overrideCgstPercentage) || settings?.cgstPercentage}%): ₹{preview.cgst.toFixed(2)}</p>
                <p>SGST ({parseFloat(overrideSgstPercentage) || settings?.sgstPercentage}%): ₹{preview.sgst.toFixed(2)}</p>
              </>
            ) : taxType === 'IGST' ? (
              <p>IGST ({parseFloat(overrideIgstPercentage) || settings?.igstPercentage}%): ₹{preview.igst.toFixed(2)}</p>
            ) : (
              <>
                <p>JOBCGST ({parseFloat(overrideJobCgstPercentage) || settings?.jobCgstPercentage}%): ₹{preview.jobCgst.toFixed(2)}</p>
                <p>JOBSGST ({parseFloat(overrideJobSgstPercentage) || settings?.jobSgstPercentage}%): ₹{preview.jobSgst.toFixed(2)}</p>
              </>
            )}
            <p className="font-bold">Grand Total: ₹{preview.grandTotal.toFixed(2)}</p>
          </div>
        </motion.div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs sm:text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Updating...' : 'Update Bill'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default EditBillPage;