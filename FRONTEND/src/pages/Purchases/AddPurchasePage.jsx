// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
// import PurchaseService from '../../services/PurchaseService';
// import CompanyService from '../../services/CompanyService';

// const AddPurchasePage = ({ purchaseToEdit = null }) => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     supplierCompanyId: '',
//     challanNumber: '',
//     purchaseBillNumber: '',
//     challanDate: '',
//     purchaseBillDate: new Date().toISOString().split('T')[0],
//     denier: '',
//     grade: '',
//     totalGrossWeight: '',
//     tareWeight: '0',
//     netWeight: '',
//     ratePerUnit: '',
//     amount: '',
//     paymentStatus: 'Unpaid',
//     notes: '',
//   });
//   const [companies, setCompanies] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
//   const [error, setError] = useState('');
//   const [formErrors, setFormErrors] = useState({});
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

//   const pageTitle = purchaseToEdit ? 'Edit Purchase Record' : 'Add New Purchase';
//   const submitButtonText = purchaseToEdit ? 'Update Purchase' : 'Save Purchase';

//   // Handle window resize
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
    
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Fetch companies on mount
// useEffect(() => {
//   const fetchCompanies = async () => {
//     setIsLoadingCompanies(true);
//     try {
//       const response = await CompanyService.getAllCompanies();
//       // Filter companies to include only those with companyType 'Buyer' or 'Both'
//       const filteredCompanies = response.data.filter(
//         (company) => company.companyType === 'Buyer' || company.companyType === 'Both'
//       );
//       setCompanies(filteredCompanies);
//     } catch (err) {
//       console.error("Failed to fetch companies:", err);
//       setError("Could not load companies. Please try again.");
//     }
//     setIsLoadingCompanies(false);
//   };
//   fetchCompanies();
// }, []);

//   // Populate form if editing
//   useEffect(() => {
//     if (purchaseToEdit) {
//       setFormData({
//         supplierCompanyId: purchaseToEdit.supplierCompany?._id || purchaseToEdit.supplierCompany || '',
//         challanNumber: purchaseToEdit.challanNumber || '',
//         purchaseBillNumber: purchaseToEdit.purchaseBillNumber || '',
//         challanDate: purchaseToEdit.challanDate ? new Date(purchaseToEdit.challanDate).toISOString().split('T')[0] : '',
//         purchaseBillDate: purchaseToEdit.purchaseBillDate ? new Date(purchaseToEdit.purchaseBillDate).toISOString().split('T')[0] : '',
//         denier: purchaseToEdit.denier || '',
//         grade: purchaseToEdit.grade || '',
//         totalGrossWeight: purchaseToEdit.totalGrossWeight?.toString() || '',
//         tareWeight: purchaseToEdit.tareWeight?.toString() || '0',
//         netWeight: purchaseToEdit.netWeight?.toString() || '',
//         ratePerUnit: purchaseToEdit.ratePerUnit?.toString() || '',
//         amount: purchaseToEdit.amount?.toString() || '',
//         paymentStatus: purchaseToEdit.paymentStatus || 'Unpaid',
//         notes: purchaseToEdit.notes || '',
//       });
//     }
//   }, [purchaseToEdit]);

//   // Calculate net weight and amount when weights or rate change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));

//     if (name === 'totalGrossWeight' || name === 'tareWeight' || name === 'ratePerUnit') {
//       const gross = parseFloat(name === 'totalGrossWeight' ? value : formData.totalGrossWeight) || 0;
//       const tare = parseFloat(name === 'tareWeight' ? value : formData.tareWeight) || 0;
//       const rate = parseFloat(name === 'ratePerUnit' ? value : formData.ratePerUnit) || 0;

//       const net = parseFloat((gross - tare).toFixed(3));
//       const calculatedAmount = parseFloat((net * rate).toFixed(2));

//       setFormData(prev => ({
//         ...prev,
//         netWeight: isNaN(net) ? '' : net.toString(),
//         amount: isNaN(calculatedAmount) ? '' : calculatedAmount.toString(),
//       }));
//     }
//   };

//   // Validate form inputs
//   const validateForm = () => {
//     const errors = {};
//     if (!formData.supplierCompanyId) errors.supplierCompanyId = 'Supplier is required';
//     if (!formData.purchaseBillNumber.trim()) errors.purchaseBillNumber = 'Bill number is required';
//     if (!formData.purchaseBillDate) errors.purchaseBillDate = 'Bill date is required';
//     if (isNaN(parseFloat(formData.totalGrossWeight)) || parseFloat(formData.totalGrossWeight) <= 0) 
//       errors.totalGrossWeight = 'Valid gross weight required';
//     if (isNaN(parseFloat(formData.tareWeight)) || parseFloat(formData.tareWeight) < 0) 
//       errors.tareWeight = 'Tare weight must be ≥ 0';
//     if (isNaN(parseFloat(formData.ratePerUnit)) || parseFloat(formData.ratePerUnit) <= 0) 
//       errors.ratePerUnit = 'Valid rate required';
//     if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) 
//       errors.amount = 'Valid amount required';

//     const gross = parseFloat(formData.totalGrossWeight) || 0;
//     const tare = parseFloat(formData.tareWeight) || 0;
//     if (tare > gross) errors.tareWeight = 'Tare cannot exceed gross weight';

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) {
//       setError("Please fix the errors in the form");
//       return;
//     }

//     setIsLoading(true);
//     setError('');

//     const submissionData = {
//       ...formData,
//       totalGrossWeight: parseFloat(formData.totalGrossWeight),
//       tareWeight: parseFloat(formData.tareWeight),
//       ratePerUnit: parseFloat(formData.ratePerUnit),
//       amount: parseFloat(formData.amount),
//       challanDate: formData.challanDate || null,
//     };

//     try {
//       if (purchaseToEdit) {
//         await PurchaseService.updatePurchase(purchaseToEdit._id, submissionData);
//       } else {
//         await PurchaseService.createPurchase(submissionData);
//       }
//       navigate('/purchases');
//     } catch (err) {
//       const errMsg = err.response?.data?.message || err.message || 
//                     (purchaseToEdit ? 'Failed to update purchase' : 'Failed to create purchase');
//       setError(errMsg);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Reset form to initial state
//   const handleReset = () => {
//     setFormData({
//       supplierCompanyId: '',
//       challanNumber: '',
//       purchaseBillNumber: '',
//       challanDate: '',
//       purchaseBillDate: new Date().toISOString().split('T')[0],
//       denier: '',
//       grade: '',
//       totalGrossWeight: '',
//       tareWeight: '0',
//       netWeight: '',
//       ratePerUnit: '',
//       amount: '',
//       paymentStatus: 'Unpaid',
//       notes: '',
//     });
//     setFormErrors({});
//     setError('');
//   };

//   return (
//     <motion.div
//       className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.3 }}
//     >
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <motion.div
//           className="flex items-center justify-between mb-6"
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           transition={{ duration: 0.4 }}
//         >
//           <Link
//             to="/purchases"
//             className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
//           >
//             <ArrowLeftIcon className="h-5 w-5 mr-1" />
//             <span className="text-sm font-medium">Back to Purchases</span>
//           </Link>
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{pageTitle}</h1>
//           <div className="w-6"></div> {/* Spacer for alignment */}
//         </motion.div>

//         {/* Error Message */}
//         <AnimatePresence>
//           {error && (
//             <motion.div
//               className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//             >
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm text-red-700">{error}</p>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Form */}
//         <motion.form
//           onSubmit={handleSubmit}
//           className="bg-white shadow-lg rounded-xl p-6 space-y-6"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             {/* Supplier Company */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Supplier Company <span className="text-red-500">*</span>
//               </label>
//               <select
//                 name="supplierCompanyId"
//                 value={formData.supplierCompanyId}
//                 onChange={handleChange}
//                 className={`w-full p-3 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
//                   formErrors.supplierCompanyId ? 'border-red-500' : 'border-gray-300'
//                 }`}
//                 disabled={isLoadingCompanies}
//               >
//                 <option value="">Select Supplier</option>
//                 {companies.map(company => (
//                   <option key={company._id} value={company._id}>
//                     {company.name}
//                   </option>
//                 ))}
//               </select>
//               {formErrors.supplierCompanyId && (
//                 <p className="mt-1 text-xs text-red-500">{formErrors.supplierCompanyId}</p>
//               )}
//             </div>

//             {/* Purchase Bill Number */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Supplier Bill No. <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="purchaseBillNumber"
//                 value={formData.purchaseBillNumber}
//                 onChange={handleChange}
//                 className={`w-full p-3 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
//                   formErrors.purchaseBillNumber ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {formErrors.purchaseBillNumber && (
//                 <p className="mt-1 text-xs text-red-500">{formErrors.purchaseBillNumber}</p>
//               )}
//             </div>

//             {/* Purchase Bill Date */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Supplier Bill Date <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="date"
//                 name="purchaseBillDate"
//                 value={formData.purchaseBillDate}
//                 onChange={handleChange}
//                 className={`w-full p-3 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
//                   formErrors.purchaseBillDate ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {formErrors.purchaseBillDate && (
//                 <p className="mt-1 text-xs text-red-500">{formErrors.purchaseBillDate}</p>
//               )}
//             </div>

//             {/* Challan Number */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Challan No.
//               </label>
//               <input
//                 type="text"
//                 name="challanNumber"
//                 value={formData.challanNumber}
//                 onChange={handleChange}
//                 className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//               />
//             </div>

//             {/* Challan Date */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Challan Date
//               </label>
//               <input
//                 type="date"
//                 name="challanDate"
//                 value={formData.challanDate}
//                 onChange={handleChange}
//                 className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//               />
//             </div>

//             {/* Payment Status */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Payment Status
//               </label>
//               <select
//                 name="paymentStatus"
//                 value={formData.paymentStatus}
//                 onChange={handleChange}
//                 className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//               >
//                 <option value="Unpaid">Unpaid</option>
//                 <option value="Partially Paid">Partially Paid</option>
//                 <option value="Paid">Paid</option>
//               </select>
//             </div>

//             {/* Denier */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Denier
//               </label>
//               <input
//                 type="text"
//                 name="denier"
//                 value={formData.denier}
//                 onChange={handleChange}
//                 className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//               />
//             </div>

//             {/* Grade */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Grade
//               </label>
//               <input
//                 type="text"
//                 name="grade"
//                 value={formData.grade}
//                 onChange={handleChange}
//                 className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//               />
//             </div>

//             {/* Total Gross Weight */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Total Gross Wt. (Kg) <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="number"
//                 name="totalGrossWeight"
//                 value={formData.totalGrossWeight}
//                 onChange={handleChange}
//                 step="0.001"
//                 className={`w-full p-3 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
//                   formErrors.totalGrossWeight ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {formErrors.totalGrossWeight && (
//                 <p className="mt-1 text-xs text-red-500">{formErrors.totalGrossWeight}</p>
//               )}
//             </div>

//             {/* Tare Weight */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Tare Wt. (Kg)
//               </label>
//               <input
//                 type="number"
//                 name="tareWeight"
//                 value={formData.tareWeight}
//                 onChange={handleChange}
//                 step="0.001"
//                 className={`w-full p-3 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
//                   formErrors.tareWeight ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {formErrors.tareWeight && (
//                 <p className="mt-1 text-xs text-red-500">{formErrors.tareWeight}</p>
//               )}
//             </div>

//             {/* Net Weight (Display Only) */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Net Wt. (Kg)
//               </label>
//               <input
//                 type="text"
//                 value={formData.netWeight}
//                 readOnly
//                 className="w-full p-3 text-sm border border-gray-300 rounded-lg bg-gray-50 shadow-sm"
//               />
//             </div>

//             {/* Rate Per Unit */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Rate / Unit (₹/Kg) <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="number"
//                 name="ratePerUnit"
//                 value={formData.ratePerUnit}
//                 onChange={handleChange}
//                 step="0.01"
//                 className={`w-full p-3 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
//                   formErrors.ratePerUnit ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {formErrors.ratePerUnit && (
//                 <p className="mt-1 text-xs text-red-500">{formErrors.ratePerUnit}</p>
//               )}
//             </div>

//             {/* Amount */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Total Amount (₹) <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="number"
//                 name="amount"
//                 value={formData.amount}
//                 onChange={(e) => setFormData({...formData, amount: e.target.value})}
//                 step="0.01"
//                 className={`w-full p-3 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
//                   formErrors.amount ? 'border-red-500' : 'border-gray-300'
//                 }`}
//               />
//               {formErrors.amount && (
//                 <p className="mt-1 text-xs text-red-500">{formErrors.amount}</p>
//               )}
//               <p className="mt-1 text-xs text-gray-500">
//                 Auto-calculated from net weight × rate. Can be manually adjusted.
//               </p>
//             </div>
//           </div>

//           {/* Notes */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Notes
//             </label>
//             <textarea
//               name="notes"
//               value={formData.notes}
//               onChange={handleChange}
//               rows="3"
//               className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//             ></textarea>
//           </div>

//           {/* Form Actions */}
//           <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
//             <motion.button
//               type="button"
//               onClick={handleReset}
//               disabled={isLoading}
//               className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all"
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//             >
//               Reset
//             </motion.button>
//             <motion.button
//               type="submit"
//               disabled={isLoading}
//               className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center"
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//             >
//               {isLoading ? (
//                 <>
//                   <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
//                   {purchaseToEdit ? 'Updating...' : 'Saving...'}
//                 </>
//               ) : (
//                 submitButtonText
//               )}
//             </motion.button>
//           </div>
//         </motion.form>
//       </div>
//     </motion.div>
//   );
// };

// export default AddPurchasePage;