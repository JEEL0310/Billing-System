import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionService from '../../services/TransactionService';
import CompanyService from '../../services/CompanyService';
import BillService from '../../services/BillService';
import PurchaseService from '../../services/PurchaseService';
import WorkerService from '../../services/WorkerService';

// Utility function to get today's date in YYYY-MMDD format
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const AddTransactionPage = ({ transactionToEdit = null, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    paymentDate: getTodayDate(),// June 13, 2025
    type: 'IN',
    category: 'BillPayment',
    companyId: '',
    workerId: '',
    relatedBillIds: [],
    relatedPurchaseIds: [],
    amount: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    description: '',
    notes: '',
  });

  const [companies, setCompanies] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pendingBills, setPendingBills] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const pageTitle = transactionToEdit ? 'Edit Transaction' : 'Add New Transaction';
  const submitButtonText = transactionToEdit ? 'Update Transaction' : 'Add Transaction';

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const companyRes = await CompanyService.getAllCompanies();
        setCompanies(companyRes.data);

        const workerRes = await WorkerService.getAllWorkers();
        setWorkers(workerRes.data);
      } catch (err) {
        console.error("Failed to fetch initial data (companies/workers):", err);
        setError("Failed to load company or worker list.");
      }
    };
    fetchInitialData();
  }, []);

  const fetchPendingDocuments = useCallback(async () => {
    if (!formData.companyId || (formData.category !== 'BillPayment' && formData.category !== 'PurchasePayment')) {
      setPendingBills([]);
      setPendingPurchases([]);
      return;
    }
    try {
      if (formData.category === 'BillPayment' && formData.type === 'IN') {
        const billResponse = await BillService.getAllBills();
        setPendingBills(billResponse.data.filter(b =>
          b.company?._id === formData.companyId && (b.status === 'Pending' || b.status === 'Partially Paid')
        ));
        setPendingPurchases([]);
      } else if (formData.category === 'PurchasePayment' && formData.type === 'OUT') {
        const purchaseResponse = await PurchaseService.getAllPurchases();
        setPendingPurchases(purchaseResponse.data.filter(p =>
          p.supplierCompany?._id === formData.companyId && (p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partially Paid')
        ));
        setPendingBills([]);
      } else {
        setPendingBills([]);
        setPendingPurchases([]);
      }
    } catch (err) {
      console.error("Failed to fetch pending documents:", err);
      setError("Could not load pending bills/purchases for the selected company.");
    }
  }, [formData.companyId, formData.type, formData.category]);

  useEffect(() => {
    fetchPendingDocuments();
  }, [fetchPendingDocuments]);

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        paymentDate: transactionToEdit.paymentDate ? new Date(transactionToEdit.paymentDate).toISOString().split('T')[0] : '',
        type: transactionToEdit.type || 'IN',
        category: transactionToEdit.category || 'Other',
        companyId: transactionToEdit.company?._id || transactionToEdit.company || '',
        workerId: transactionToEdit.worker?._id || transactionToEdit.worker || '',
        relatedBillIds: transactionToEdit.relatedBills?.map(b => b.billId) || [],
        relatedPurchaseIds: transactionToEdit.relatedPurchases?.map(p => p.purchaseId) || [],
        amount: transactionToEdit.amount?.toString() || '',
        paymentMethod: transactionToEdit.paymentMethod || 'Cash',
        referenceNumber: transactionToEdit.referenceNumber || '',
        description: transactionToEdit.description || '',
        notes: transactionToEdit.notes || '',
      });
    }
  }, [transactionToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'category') {
        if (value === 'BillPayment' || value === 'MiscellaneousIncome') {
          newState.type = 'IN';
        } else if (value === 'PurchasePayment' || value === 'Salary' || value === 'MiscellaneousExpense') {
          newState.type = 'OUT';
        }
        newState.relatedBillIds = [];
        newState.relatedPurchaseIds = [];
        newState.companyId = (value === 'BillPayment' || value === 'PurchasePayment') ? prev.companyId : '';
        newState.workerId = (value === 'Salary') ? prev.workerId : '';
      }
      if (name === 'companyId' || name === 'type') {
        newState.relatedBillIds = [];
        newState.relatedPurchaseIds = [];
      }
      if (name === 'category' && value !== 'Salary') {
        newState.workerId = '';
      }
      if (name === 'category' && value !== 'BillPayment' && value !== 'PurchasePayment') {
        newState.companyId = '';
        newState.relatedBillIds = [];
        newState.relatedPurchaseIds = [];
      }
      return newState;
    });
  };

  const handleMultiSelectChange = (e, fieldName) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, [fieldName]: values }));

    if (values.length > 0) {
      let calculatedAmount = 0;
      let docNumbers = [];
      if (fieldName === 'relatedBillIds' && pendingBills.length > 0) {
        values.forEach(billId => {
          const bill = pendingBills.find(b => b._id === billId);
          if (bill) {
            calculatedAmount += (bill.totalAmount - (bill.totalPaidAmount || 0));
            docNumbers.push(bill.billNumber);
          }
        });
        if (docNumbers.length > 0) {
          setFormData(prev => ({ ...prev, description: `Payment for Bill(s): ${docNumbers.join(', ')}` }));
        }
      } else if (fieldName === 'relatedPurchaseIds' && pendingPurchases.length > 0) {
        values.forEach(purchaseId => {
          const purchase = pendingPurchases.find(p => p._id === purchaseId);
          if (purchase) {
            calculatedAmount += (purchase.amount - (purchase.totalPaidAmount || 0));
            docNumbers.push(purchase.purchaseBillNumber);
          }
        });
        if (docNumbers.length > 0) {
          setFormData(prev => ({ ...prev, description: `Payment for Purchase(s): ${docNumbers.join(', ')}` }));
        }
      }
      setFormData(prev => ({ ...prev, amount: calculatedAmount > 0 ? calculatedAmount.toFixed(2) : '' }));
    } else {
      setFormData(prev => ({ ...prev, amount: '', description: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.paymentDate) errors.paymentDate = 'Payment date is required.';
    if (!formData.type) errors.type = 'Transaction type is required.';
    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) errors.amount = 'Valid transaction amount is required.';
    if (!formData.paymentMethod) errors.paymentMethod = 'Payment method is required.';
    if (!formData.description.trim()) errors.description = 'Description is required.';
    if (!formData.category) errors.category = 'Category is required.';
    if (formData.category === 'Salary' && !formData.workerId) errors.workerId = 'Worker is required for salary payments.';
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

    const submissionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      companyId: formData.companyId || null,
      workerId: formData.workerId || null,
      category: formData.category,
      relatedBillIds: formData.category === 'BillPayment' && formData.type === 'IN' ? formData.relatedBillIds.filter(id => id) : [],
      relatedPurchaseIds: formData.category === 'PurchasePayment' && formData.type === 'OUT' ? formData.relatedPurchaseIds.filter(id => id) : [],
    };

    try {
      if (transactionToEdit) {
        await TransactionService.updateTransaction(transactionToEdit._id, {
          notes: submissionData.notes,
          referenceNumber: submissionData.referenceNumber,
          description: submissionData.description,
          paymentDate: submissionData.paymentDate,
          paymentMethod: submissionData.paymentMethod,
        });
      } else {
        await TransactionService.createTransaction(submissionData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/transactions');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || (transactionToEdit ? 'Failed to update transaction.' : 'Failed to add transaction.');
      setError(errMsg);
      console.error("Transaction form submission error:", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      paymentDate: new Date(2025, 5, 13).toISOString().split('T')[0],
      type: 'IN',
      category: 'BillPayment',
      companyId: '',
      workerId: '',
      relatedBillIds: [],
      relatedPurchaseIds: [],
      amount: '',
      paymentMethod: 'Cash',
      referenceNumber: '',
      description: '',
      notes: '',
    });
    setPendingBills([]);
    setPendingPurchases([]);
    setFormErrors({});
    setError('');
  };

  const paymentMethods = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Other'];
  const categories = [
    { value: 'BillPayment', label: 'Bill Payment (Receipt)' },
    { value: 'PurchasePayment', label: 'Purchase Payment (Made)' },
    { value: 'Salary', label: 'Salary Payment' },
    { value: 'MiscellaneousIncome', label: 'Miscellaneous Income' },
    { value: 'MiscellaneousExpense', label: 'Miscellaneous Expense' },
    { value: 'Other', label: 'Other Transaction' }
  ];

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {/* Transaction Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <motion.div
          className={`relative p-4 rounded-2xl cursor-pointer group transition-all duration-300 ${
            formData.type === 'IN'
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 shadow-lg'
              : 'bg-white hover:bg-emerald-50/50 border-2 border-transparent hover:border-emerald-200'
          }`}
          onClick={() => handleChange({ target: { name: 'type', value: 'IN' } })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="radio"
            name="type"
            value="IN"
            checked={formData.type === 'IN'}
            onChange={handleChange}
            className="sr-only"
          />
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              formData.type === 'IN'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg'
                : 'bg-emerald-100 group-hover:bg-emerald-200'
            }`}>
              <svg className={`h-6 w-6 ${formData.type === 'IN' ? 'text-white' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <div>
              <p className={`font-semibold ${formData.type === 'IN' ? 'text-emerald-700' : 'text-gray-700'}`}>Money IN</p>
              <p className={`text-sm ${formData.type === 'IN' ? 'text-emerald-600' : 'text-gray-500'}`}>Receiving payment</p>
            </div>
          </div>
          {formData.type === 'IN' && (
            <motion.div
              className="absolute top-2 right-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className={`relative p-4 rounded-2xl cursor-pointer group transition-all duration-300 ${
            formData.type === 'OUT'
              ? 'bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-500 shadow-lg'
              : 'bg-white hover:bg-rose-50/50 border-2 border-transparent hover:border-rose-200'
          }`}
          onClick={() => handleChange({ target: { name: 'type', value: 'OUT' } })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="radio"
            name="type"
            value="OUT"
            checked={formData.type === 'OUT'}
            onChange={handleChange}
            className="sr-only"
          />
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              formData.type === 'OUT'
                ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-lg'
                : 'bg-rose-100 group-hover:bg-rose-200'
            }`}>
              <svg className={`h-6 w-6 ${formData.type === 'OUT' ? 'text-white' : 'text-rose-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            </div>
            <div>
              <p className={`font-semibold ${formData.type === 'OUT' ? 'text-rose-700' : 'text-gray-700'}`}>Money OUT</p>
              <p className={`text-sm ${formData.type === 'OUT' ? 'text-rose-600' : 'text-gray-500'}`}>Making payment</p>
            </div>
          </div>
          {formData.type === 'OUT' && (
            <motion.div
              className="absolute top-2 right-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-50/50 backdrop-blur-sm border border-red-200 rounded-2xl text-red-700 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-sm space-y-6 "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6">
          {/* Top Row - Payment Date, Category, and Payment Method */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-6">
          {/* Payment Date */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <label htmlFor="paymentDate" className="block text-sm font-semibold text-gray-900 mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="paymentDate"
                id="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                className={`block w-full px-4 py-3 rounded-xl text-gray-900 bg-white/50 border ${
                  formErrors.paymentDate 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : formData.type === 'IN'
                      ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                      : formData.type === 'OUT'
                        ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <AnimatePresence>
              {formErrors.paymentDate && (
                <motion.p
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {formErrors.paymentDate}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Category Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className={`block w-full px-4 py-3 rounded-xl text-gray-900 bg-white/50 border appearance-none ${
                  formErrors.category 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : formData.type === 'IN'
                      ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                      : formData.type === 'OUT'
                        ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50`}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <AnimatePresence>
              {formErrors.category && (
                <motion.p
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {formErrors.category}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Amount */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-900 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                placeholder="0.00"
                className={`block w-full pl-8 pr-4 py-3 rounded-xl text-gray-900 bg-white/50 border ${
                  formErrors.amount 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : formData.type === 'IN'
                      ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                      : formData.type === 'OUT'
                        ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50`}
              />
            </div>
            <AnimatePresence>
              {formErrors.amount && (
                <motion.p
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {formErrors.amount}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Company (Conditional) */}
          {(formData.category === 'BillPayment' || formData.category === 'PurchasePayment') && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="lg:col-span-1"
            >
              <label htmlFor="companyId" className="block text-sm font-semibold text-gray-900 mb-2">
                Select Company
              </label>
              <div className="relative">
                <select
                  name="companyId"
                  id="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 rounded-xl text-gray-900 bg-white/50 border ${
                    formErrors.companyId 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : formData.type === 'IN'
                        ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                        : formData.type === 'OUT'
                          ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50 appearance-none`}
                >
                  <option value="">Choose a company</option>
                  {companies.map(comp => (
                    <option key={comp._id} value={comp._id}>{comp.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {formErrors.companyId && (
                  <motion.p
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {formErrors.companyId}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Worker (Conditional for Salary) */}
          {formData.category === 'Salary' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="lg:col-span-1"
            >
              <label htmlFor="workerId" className="block text-sm font-semibold text-gray-900 mb-2">
                Select Worker <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="workerId"
                  id="workerId"
                  value={formData.workerId}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 rounded-xl text-gray-900 bg-white/50 border ${
                    formErrors.workerId 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : formData.type === 'IN'
                        ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                        : formData.type === 'OUT'
                          ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50 appearance-none`}
                >
                  <option value="">Choose a worker</option>
                  {workers.map(work => (
                    <option key={work._id} value={work._id}>{work.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {formErrors.workerId && (
                  <motion.p
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {formErrors.workerId}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Payment Method */}
          {/* Payment Method Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <label htmlFor="paymentMethod" className="block text-sm font-semibold text-gray-900 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="paymentMethod"
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className={`block w-full px-4 py-3 rounded-xl text-gray-900 bg-white/50 border appearance-none ${
                  formErrors.paymentMethod 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : formData.type === 'IN'
                      ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                      : formData.type === 'OUT'
                        ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50`}
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <AnimatePresence>
              {formErrors.paymentMethod && (
                <motion.p
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {formErrors.paymentMethod}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Reference Number */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <label htmlFor="referenceNumber" className="block text-sm font-semibold text-gray-900 mb-2">
              Reference Number (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                name="referenceNumber"
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleChange}
                placeholder="Enter reference number"
                className={`block w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 bg-white/50 border ${
                  formData.type === 'IN'
                    ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                    : formData.type === 'OUT'
                      ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50`}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
        </div>

        {/* Related Bills (if category is BillPayment, type is IN and company selected) */}
        {formData.category === 'BillPayment' && formData.type === 'IN' && formData.companyId && pendingBills.length > 0 && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <label htmlFor="relatedBillIds" className="block text-sm font-semibold text-gray-900 mb-2">
              Link Sales Bills
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select the bills this payment covers. The amount will be automatically calculated to fully cover the selected bills.
            </p>
            <div className="bg-white/50 border border-gray-200 rounded-xl overflow-hidden">
              <select
                multiple
                name="relatedBillIds"
                id="relatedBillIds"
                value={formData.relatedBillIds}
                onChange={(e) => handleMultiSelectChange(e, 'relatedBillIds')}
                className="w-full h-48 border-0 focus:ring-0 text-sm p-0"
              >
                {pendingBills.map(bill => (
                  <option 
                    key={bill._id} 
                    value={bill._id}
                    className={`p-3 border-b border-gray-100 hover:bg-emerald-50/50 ${
                      formData.relatedBillIds.includes(bill._id)
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-gray-700'
                    }`}
                  >
                    Bill #{bill.billNumber} - Due Amount: ₹{(bill.totalAmount - (bill.totalPaidAmount || 0)).toFixed(2)}
                    <span className="text-gray-500 text-xs ml-2">
                      (Dated: {new Date(bill.billDate).toLocaleDateString()})
                    </span>
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* Related Purchases (if category is PurchasePayment, type is OUT and company selected) */}
        {formData.category === 'PurchasePayment' && formData.type === 'OUT' && formData.companyId && pendingPurchases.length > 0 && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.0 }}
          >
            <label htmlFor="relatedPurchaseIds" className="block text-sm font-semibold text-gray-900 mb-2">
              Link Purchase Bills
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select the purchase bills this payment covers. The amount will be automatically calculated.
            </p>
            <div className="bg-white/50 border border-gray-200 rounded-xl overflow-hidden">
              <select
                multiple
                name="relatedPurchaseIds"
                id="relatedPurchaseIds"
                value={formData.relatedPurchaseIds}
                onChange={(e) => handleMultiSelectChange(e, 'relatedPurchaseIds')}
                className="w-full h-48 border-0 focus:ring-0 text-sm p-0"
              >
                {pendingPurchases.map(purchase => (
                  <option 
                    key={purchase._id} 
                    value={purchase._id}
                    className={`p-3 border-b border-gray-100 hover:bg-rose-50/50 ${
                      formData.relatedPurchaseIds.includes(purchase._id)
                        ? 'bg-rose-50 text-rose-900'
                        : 'text-gray-700'
                    }`}
                  >
                    Purchase #{purchase.purchaseBillNumber} - Due Amount: ₹{(purchase.amount - (purchase.totalPaidAmount || 0)).toFixed(2)}
                    <span className="text-gray-500 text-xs ml-2">
                      (Dated: {new Date(purchase.purchaseBillDate).toLocaleDateString()})
                    </span>
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* Description and Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.1 }}
          >
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              Transaction Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter transaction details"
                className={`block w-full px-4 py-3 rounded-xl text-gray-900 bg-white/50 border ${
                  formErrors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : formData.type === 'IN'
                      ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                      : formData.type === 'OUT'
                        ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50`}
              />
              <AnimatePresence>
                {formErrors.description && (
                  <motion.p
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {formErrors.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.2 }}
          >
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="1"
              placeholder="Add any additional notes or remarks..."
              className={`block w-full px-4 py-3 rounded-xl text-gray-900 bg-white/50 border ${
                formData.type === 'IN'
                  ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500'
                  : formData.type === 'OUT'
                    ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
              } shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50`}
            ></textarea>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-end gap-3 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.3 }}
        >
          <motion.button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
              formData.type === 'IN'
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            } w-full sm:w-auto flex items-center justify-center gap-2`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Form
          </motion.button>
          <motion.button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 text-sm font-medium text-white rounded-xl shadow-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
              formData.type === 'IN'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
            } w-full sm:w-auto flex items-center justify-center gap-2`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {transactionToEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {transactionToEdit ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                {submitButtonText}
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
      </motion.div>
  );
};

export default AddTransactionPage;