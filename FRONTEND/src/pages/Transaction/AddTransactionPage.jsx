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

const AddTransactionPage = ({ transactionToEdit = null }) => {
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
      navigate('/transactions');
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
          {pageTitle}
        </motion.h1>
        <Link
          to="/transactions"
          className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          ← Back to Transaction List
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

      <motion.form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6">
          {/* Payment Date */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <label htmlFor="paymentDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="paymentDate"
              id="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className={`w-full p-2 sm:p-3 border ${formErrors.paymentDate ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
            />
            <AnimatePresence>
              {formErrors.paymentDate && (
                <motion.p
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {formErrors.paymentDate}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Transaction Type */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              id="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full p-2 sm:p-3 border ${formErrors.type ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
            >
              <option value="IN">IN (Payment Received)</option>
              <option value="OUT">OUT (Payment Made)</option>
            </select>
            <AnimatePresence>
              {formErrors.type && (
                <motion.p
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {formErrors.type}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Category */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full p-2 sm:p-3 border ${formErrors.category ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <AnimatePresence>
              {formErrors.category && (
                <motion.p
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
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
            <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              id="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              className={`w-full p-2 sm:p-3 border ${formErrors.amount ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
            />
            <AnimatePresence>
              {formErrors.amount && (
                <motion.p
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
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
            >
              <label htmlFor="companyId" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <select
                name="companyId"
                id="companyId"
                value={formData.companyId}
                onChange={handleChange}
                className={`w-full p-2 sm:p-3 border ${formErrors.companyId ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
              >
                <option value="">Select Company</option>
                {companies.map(comp => (
                  <option key={comp._id} value={comp._id}>{comp.name}</option>
                ))}
              </select>
              <AnimatePresence>
                {formErrors.companyId && (
                  <motion.p
                    className="mt-1 text-xs text-red-500"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
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
            >
              <label htmlFor="workerId" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Worker <span className="text-red-500">*</span>
              </label>
              <select
                name="workerId"
                id="workerId"
                value={formData.workerId}
                onChange={handleChange}
                className={`w-full p-2 sm:p-3 border ${formErrors.workerId ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
              >
                <option value="">Select Worker</option>
                {workers.map(work => (
                  <option key={work._id} value={work._id}>{work.name}</option>
                ))}
              </select>
              <AnimatePresence>
                {formErrors.workerId && (
                  <motion.p
                    className="mt-1 text-xs text-red-500"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {formErrors.workerId}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <label htmlFor="paymentMethod" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMethod"
              id="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className={`w-full p-2 sm:p-3 border ${formErrors.paymentMethod ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <AnimatePresence>
              {formErrors.paymentMethod && (
                <motion.p
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
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
            <label htmlFor="referenceNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Reference No. (Optional)
            </label>
            <input
              type="text"
              name="referenceNumber"
              id="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleChange}
              className={`w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
            />
          </motion.div>
        </div>

        {/* Related Bills (if category is BillPayment, type is IN and company selected) */}
        {formData.category === 'BillPayment' && formData.type === 'IN' && formData.companyId && pendingBills.length > 0 && (
          <motion.div
            className="col-span-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <label htmlFor="relatedBillIds" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Link to Sales Bill(s) (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select bills this payment covers. Amount will be auto-calculated to pay selected bills fully.
            </p>
            <select
              multiple
              name="relatedBillIds"
              id="relatedBillIds"
              value={formData.relatedBillIds}
              onChange={(e) => handleMultiSelectChange(e, 'relatedBillIds')}
              className="w-full h-24 sm:h-32 border border-gray-200 rounded-lg shadow-sm p-2 sm:p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            >
              {pendingBills.map(bill => (
                <option key={bill._id} value={bill._id}>
                  {bill.billNumber} - Due: {(bill.totalAmount - (bill.totalPaidAmount || 0)).toFixed(2)} (Dated: {new Date(bill.billDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Related Purchases (if category is PurchasePayment, type is OUT and company selected) */}
        {formData.category === 'PurchasePayment' && formData.type === 'OUT' && formData.companyId && pendingPurchases.length > 0 && (
          <motion.div
            className="col-span-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.0 }}
          >
            <label htmlFor="relatedPurchaseIds" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Link to Purchase Bill(s) (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select purchase bills this payment covers. Amount will be auto-calculated.
            </p>
            <select
              multiple
              name="relatedPurchaseIds"
              id="relatedPurchaseIds"
              value={formData.relatedPurchaseIds}
              onChange={(e) => handleMultiSelectChange(e, 'relatedPurchaseIds')}
              className="w-full h-24 sm:h-32 border border-gray-200 rounded-lg shadow-sm p-2 sm:p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
            >
              {pendingPurchases.map(purchase => (
                <option key={purchase._id} value={purchase._id}>
                  {purchase.purchaseBillNumber} - Due: {(purchase.amount - (purchase.totalPaidAmount || 0)).toFixed(2)} (Dated: {new Date(purchase.purchaseBillDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Description */}
        <motion.div
          className="col-span-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.1 }}
        >
          <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full p-2 sm:p-3 border ${formErrors.description ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm`}
          />
          <AnimatePresence>
            {formErrors.description && (
              <motion.p
                className="mt-1 text-xs text-red-500"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {formErrors.description}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Notes */}
        <motion.div
          className="col-span-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        >
          <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            id="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
          ></textarea>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.3 }}
        >
          <motion.button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105 w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reset Form
          </motion.button>
          <motion.button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105 w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (transactionToEdit ? 'Updating...' : 'Adding...') : submitButtonText}
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

export default AddTransactionPage;