// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { EyeIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
// import LedgerService from '../../services/ComapnyLedgerService';
// import CompanyService from '../../services/CompanyService';


// const LedgerListPage = () => {
//   const [ledgerData, setLedgerData] = useState(null);
//   const [companiesSummary, setCompaniesSummary] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [isExporting, setIsExporting] = useState(false);
//   const [exportError, setExportError] = useState('');
//   const [selectedEntry, setSelectedEntry] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [companies, setCompanies] = useState([]);
//   const [filterCompanyId, setFilterCompanyId] = useState('');
//   const [filterStartDate, setFilterStartDate] = useState('');
//   const [filterEndDate, setFilterEndDate] = useState('');
//   const [filterMonth, setFilterMonth] = useState('');
//   const [filterYear, setFilterYear] = useState('');

//   // Helper function to format dates for input fields (YYYY-MM-DD)
//   const formatDateForInput = (date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   // Set initial date filters to current month
//   useEffect(() => {
//     const today = new Date();
//     const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//     const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     setFilterStartDate(formatDateForInput(firstDay));
//     setFilterEndDate(formatDateForInput(lastDay));
//     setFilterMonth(String(today.getMonth() + 1).padStart(2, '0'));
//     setFilterYear(String(today.getFullYear()));
//   }, []);

//   // Fetch companies and initial summary
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       setIsLoading(true);
//       try {
//         const companyRes = await CompanyService.getAllCompanies();
//         setCompanies(companyRes.data);
//         const summaryRes = await LedgerService.getCompaniesLedgerSummary();
//         setCompaniesSummary(summaryRes.data.companiesSummary || []);
//       } catch {
//         setError('Failed to load initial page data.');
//       }
//       setIsLoading(false);
//     };
//     fetchInitialData();
//   }, []);

//   // Fetch ledger data based on filters
//   const fetchLedgerData = useCallback(async () => {
//     if (!filterCompanyId && !filterStartDate && !filterEndDate && !filterMonth && !filterYear) return;
//     setIsLoading(true);
//     setError('');
//     const params = {};
//     if (filterCompanyId) params.companyId = filterCompanyId;
//     if (filterStartDate && filterEndDate) {
//       params.startDate = filterStartDate;
//       params.endDate = filterEndDate;
//     } else if (filterMonth && filterYear) {
//       params.month = filterMonth;
//       params.year = filterYear;
//     }
//     try {
//       const response = await LedgerService.getCompanyLedger(params);
//       setLedgerData(response.data);
//     } catch (err) {
//       const errMsg = err.response?.data?.message || err.message || 'Failed to fetch ledger data.';
//       setError(errMsg);
//       setLedgerData(null);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [filterCompanyId, filterStartDate, filterEndDate, filterMonth, filterYear]);

//   useEffect(() => {
//     fetchLedgerData();
//   }, [fetchLedgerData]);

//   // Handle month navigation
//   const handleMonthChange = (direction) => {
//     let newMonth = parseInt(filterMonth, 10);
//     let newYear = parseInt(filterYear, 10);
//     if (direction === 'prev') {
//       newMonth--;
//       if (newMonth < 1) {
//         newMonth = 12;
//         newYear--;
//       }
//     } else {
//       newMonth++;
//       if (newMonth > 12) {
//         newMonth = 1;
//         newYear++;
//       }
//     }
//     const newFirstDay = new Date(newYear, newMonth - 1, 1);
//     const newLastDay = new Date(newYear, newMonth, 0);
//     setFilterMonth(String(newMonth).padStart(2, '0'));
//     setFilterYear(String(newYear));
//     setFilterStartDate(formatDateForInput(newFirstDay));
//     setFilterEndDate(formatDateForInput(newLastDay));
//   };

//   // Export functions
//   const handleExportExcel = async () => {
//     setIsExporting(true);
//     setExportError('');
//     try {
//       const params = buildExportParams();
//       const fileName = `${ledgerData?.company?.name || 'ledger'}_Ledger_${filterStartDate}_to_${filterEndDate}.xlsx`;
//       const response = await LedgerService.downloadCompanyLedgerExcel(params);
//       LedgerService.triggerDownload(response.data, fileName);
//     } catch (err) {
//       setExportError(err.response?.data?.message || 'Failed to export to Excel');
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   const handleExportPDF = async () => {
//     setIsExporting(true);
//     setExportError('');
//     try {
//       const params = buildExportParams();
//       const fileName = `${ledgerData?.company?.name || 'ledger'}_Ledger_${filterStartDate}_to_${filterEndDate}.pdf`;
//       const response = await LedgerService.downloadCompanyLedgerPDF(params);
//       LedgerService.triggerDownload(response.data, fileName);
//     } catch (err) {
//       setExportError(err.response?.data?.message || 'Failed to export to PDF');
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   const buildExportParams = () => {
//     const params = {};
//     if (filterCompanyId) params.companyId = filterCompanyId;
//     if (filterStartDate && filterEndDate) {
//       params.startDate = filterStartDate;
//       params.endDate = filterEndDate;
//     } else if (filterMonth && filterYear) {
//       params.month = filterMonth;
//       params.year = filterYear;
//     }
//     return params;
//   };

//   // View ledger entry details
//   const handleViewEntry = (entry) => {
//     setSelectedEntry(entry);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedEntry(null);
//   };

//   // Close modal on Escape key press
//   useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.key === 'Escape' && isModalOpen) {
//         closeModal();
//       }
//     };
//     window.addEventListener('keydown', handleEsc);
//     return () => window.removeEventListener('keydown', handleEsc);
//   }, [isModalOpen]);

//   const formatDisplayDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   const clearFilters = () => {
//     setFilterCompanyId('');
//     const today = new Date();
//     const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//     const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     setFilterStartDate(formatDateForInput(firstDay));
//     setFilterEndDate(formatDateForInput(lastDay));
//     setFilterMonth(String(today.getMonth() + 1).padStart(2, '0'));
//     setFilterYear(String(today.getFullYear()));
//   };

//   if (isLoading && !ledgerData && companiesSummary.length === 0) {
//     return (
//       <motion.div
//         className="container mx-auto p-8 text-center text-gray-500"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.3 }}
//       >
//         Loading data...
//       </motion.div>
//     );
//   }

//   return (
//     <motion.div
//       className="container mx-auto p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-10 min-h-screen"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
//         <motion.h1
//           className="text-4xl font-extrabold text-gray-800"
//           initial={{ y: -20 }}
//           animate={{ y: 0 }}
//           transition={{ duration: 0.4 }}
//         >
//           Company Ledger
//         </motion.h1>
//       </div>

//       {/* Summary Cards */}
//       <motion.div
//         className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         {[
//           { label: 'Total Sales', value: ledgerData?.summary?.totalSales, color: 'blue', loading: isLoading },
//           { label: 'Total Purchases', value: ledgerData?.summary?.totalPurchases, color: 'orange', loading: isLoading },
//           { label: 'Net Balance', value: ledgerData?.summary?.netBalance, type: ledgerData?.summary?.balanceType, color: 'green', loading: isLoading },
//         ].map((item, index) => (
//           <motion.div
//             key={item.label}
//             className={`p-6 bg-white rounded-xl shadow-lg border-t-4 border-${item.color}-500`}
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3, delay: index * 0.1 }}
//           >
//             <h3 className={`text-sm font-medium text-${item.color}-600`}>{item.label}</h3>
//             {item.loading ? (
//               <p className="text-gray-400">Loading...</p>
//             ) : (
//               <p className={`text-2xl font-bold text-${item.color}-700`}>
//                 INR {item.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
//                 {item.type && ` (${item.type})`}
//               </p>
//             )}
//           </motion.div>
//         ))}
//       </motion.div>

//       {/* Export Error Display */}
//       <AnimatePresence>
//         {exportError && (
//           <motion.div
//             className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//           >
//             <p>Export Error: {exportError}</p>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Filters Section with Export Buttons */}
//       <motion.div
//         className="bg-white shadow-lg rounded-xl p-6 mb-8"
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
//           <div className="flex gap-2">
//             <motion.button
//               onClick={handleExportExcel}
//               disabled={isExporting || isLoading || !ledgerData}
//               className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               <ArrowDownTrayIcon className="h-4 w-4" />
//               Export Excel
//             </motion.button>
//             <motion.button
//               onClick={handleExportPDF}
//               disabled={isExporting || isLoading || !ledgerData}
//               className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               <ArrowDownTrayIcon className="h-4 w-4" />
//               Export PDF
//             </motion.button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
//           {/* Company Filter */}
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.3, delay: 0.1 }}
//           >
//             <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
//             <select
//               value={filterCompanyId}
//               onChange={(e) => setFilterCompanyId(e.target.value)}
//               className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//             >
//               <option value="">Select Company</option>
//               {companies.map((company) => (
//                 <option key={company._id} value={company._id}>
//                   {company.name}
//                 </option>
//               ))}
//             </select>
//           </motion.div>

//           {/* Month/Year Filter */}
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.3, delay: 0.2 }}
//             className="flex items-center gap-2"
//           >
//             <button
//               onClick={() => handleMonthChange('prev')}
//               className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
//               disabled={isLoading}
//             >
//               &lt;
//             </button>
//             <div className="flex-1">
//               <label className="block text-sm font-medium text-gray-700 mb-1">Month/Year</label>
//               <div className="flex gap-2">
//                 <select
//                   value={filterMonth}
//                   onChange={(e) => setFilterMonth(e.target.value)}
//                   className="w-1/2 p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//                 >
//                   {Array.from({ length: 12 }, (_, i) => (
//                     <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
//                       {new Date(0, i).toLocaleString('en-IN', { month: 'long' })}
//                     </option>
//                   ))}
//                 </select>
//                 <select
//                   value={filterYear}
//                   onChange={(e) => setFilterYear(e.target.value)}
//                   className="w-1/2 p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//                 >
//                   {Array.from({ length: 10 }, (_, i) => {
//                     const year = new Date().getFullYear() - 5 + i;
//                     return <option key={year} value={year}>{year}</option>;
//                   })}
//                 </select>
//               </div>
//             </div>
//             <button
//               onClick={() => handleMonthChange('next')}
//               className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
//               disabled={isLoading}
//             >
//               &gt;
//             </button>
//           </motion.div>

//           {/* Start Date */}
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.3, delay: 0.3 }}
//           >
//             <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
//             <input
//               type="date"
//               value={filterStartDate}
//               onChange={(e) => {
//                 setFilterStartDate(e.target.value);
//                 setFilterMonth('');
//                 setFilterYear('');
//               }}
//               className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//             />
//           </motion.div>

//           {/* End Date */}
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.3, delay: 0.4 }}
//           >
//             <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
//             <input
//               type="date"
//               value={filterEndDate}
//               onChange={(e) => {
//                 setFilterEndDate(e.target.value);
//                 setFilterMonth('');
//                 setFilterYear('');
//               }}
//               className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//             />
//           </motion.div>

//           {/* Filter Actions */}
//           <motion.div
//             className="flex gap-4 sm:col-span-2 lg:col-span-1"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.3, delay: 0.5 }}
//           >
//             <button
//               onClick={fetchLedgerData}
//               className="flex-1 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
//               disabled={isLoading}
//             >
//               Apply Filters
//             </button>
//             <button
//               onClick={clearFilters}
//               className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all transform hover:scale-105"
//               disabled={isLoading}
//             >
//               Reset Filters
//             </button>
//           </motion.div>
//         </div>
//       </motion.div>

//       {/* Modal for Ledger Entry Details */}
//       <AnimatePresence>
//         {isModalOpen && selectedEntry && (
//           <motion.div
//             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={closeModal}
//           >
//             <motion.div
//               className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               transition={{ duration: 0.3 }}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold text-gray-800">Ledger Entry Details</h2>
//                 <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
//                   <XMarkIcon className="h-6 w-6" />
//                 </button>
//               </div>
//               <div className="space-y-3">
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Date:</span> {formatDisplayDate(selectedEntry.date)}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Type:</span> {selectedEntry.type}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Document No.:</span> {selectedEntry.docNo}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Description:</span> {selectedEntry.description}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Debit:</span> {selectedEntry.debit ? `₹${selectedEntry.debit.toFixed(2)}` : 'N/A'}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Credit:</span> {selectedEntry.credit ? `₹${selectedEntry.credit.toFixed(2)}` : 'N/A'}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Reference ID:</span> {selectedEntry.referenceId}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Reference Type:</span> {selectedEntry.referenceType}
//                 </p>
//               </div>
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={closeModal}
//                   className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
//                 >
//                   Close
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Error Display */}
//       <AnimatePresence>
//         {error && (
//           <motion.p
//             className="text-center text-red-500 mb-6 p-4 bg-red-50 rounded-lg"
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//           >
//             Error: {error}
//           </motion.p>
//         )}
//       </AnimatePresence>

//       {/* Ledger Table */}
//       {ledgerData?.ledgerEntries?.length > 0 ? (
//         <motion.div
//           className="bg-white shadow-lg rounded-xl overflow-hidden"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-100">
//                 <tr>
//                   {['Date', 'Type', 'Doc No.', 'Description', 'Debit', 'Credit', 'Actions'].map((header) => (
//                     <th
//                       key={header}
//                       className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Debit' || header === 'Credit' || header === 'Actions' ? 'text-right' : ''}`}
//                     >
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {ledgerData.ledgerEntries.map((entry, index) => (
//                   <motion.tr
//                     key={`${entry.referenceId}-${index}`}
//                     className="hover:bg-gray-50 transition-colors"
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.3, delay: index * 0.05 }}
//                   >
//                     <td className="px-4 py-4 text-sm text-gray-600">{formatDisplayDate(entry.date)}</td>
//                     <td className="px-4 py-4 text-sm">
//                       <span className={`font-semibold ${entry.type.includes('Sale') || entry.type.includes('Made') ? 'text-green-600' : 'text-red-600'}`}>
//                         {entry.type}
//                       </span>
//                     </td>
//                     <td className="px-4 py-4 text-sm text-gray-600">{entry.docNo}</td>
//                     <td className="px-4 py-4 text-sm text-gray-700 max-w-[200px] truncate" title={entry.description}>
//                       {entry.description}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-right font-medium text-green-700">
//                       {entry.debit ? entry.debit.toFixed(2) : ''}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-right font-medium text-red-700">
//                       {entry.credit ? entry.credit.toFixed(2) : ''}
//                     </td>
//                     <td className="px-4 py-4 text-right text-sm font-medium flex justify-end space-x-2">
//                       <motion.button
//                         onClick={() => handleViewEntry(entry)}
//                         className="relative text-blue-600 hover:text-blue-900 transition-colors"
//                         title="View Details"
//                         whileHover={{ scale: 1.1 }}
//                         whileTap={{ scale: 0.9 }}
//                       >
//                         <EyeIcon className="h-5 w-5" />
//                         <span className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">View</span>
//                       </motion.button>
//                     </td>
//                   </motion.tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </motion.div>
//       ) : (
//         !isLoading && (
//           <motion.div
//             className="text-center py-12 bg-white shadow-lg rounded-xl"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <p className="text-gray-500 text-lg">No ledger entries found matching your criteria.</p>
//           </motion.div>
//         )
//       )}

//       {/* Companies Summary Table */}
//       {companiesSummary.length > 0 && (
//         <motion.div
//           className="mt-8 bg-white shadow-lg rounded-xl overflow-hidden"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <h2 className="text-lg font-semibold text-gray-800 p-6">Companies Ledger Summary</h2>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-100">
//                 <tr>
//                   {['Company', 'Total Sales', 'Total Purchases', 'Payments Received', 'Payments Made', 'Net Balance'].map((header) => (
//                     <th
//                       key={header}
//                       className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.includes('Total') || header.includes('Payments') || header === 'Net Balance' ? 'text-right' : ''}`}
//                     >
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {companiesSummary.map((summary, index) => (
//                   <motion.tr
//                     key={summary.company._id}
//                     className="hover:bg-gray-50 transition-colors"
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.3, delay: index * 0.05 }}
//                   >
//                     <td className="px-4 py-4 text-sm text-gray-600">{summary.company.name}</td>
//                     <td className="px-4 py-4 text-sm text-right font-medium text-blue-700">
//                       {summary.totals.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-right font-medium text-orange-700">
//                       {summary.totals.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-right font-medium text-red-700">
//                       {summary.totals.totalPaymentsReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                     </td>
//                     <td className="px-4 py-4 text-sm text-right font-medium text-green-700">
//                       {summary.totals.totalPaymentsMade.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                     </td>
//                     <td className={`px-4 py-4 text-sm text-right font-medium ${summary.totals.balanceType === 'Receivable' ? 'text-green-700' : 'text-red-700'}`}>
//                       {summary.totals.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({summary.totals.balanceType})
//                     </td>
//                   </motion.tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </motion.div>
//       )}

//       <motion.div
//         className="mt-8 text-center"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.3 }}
//       >
//         <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors">
//           ← Back to Dashboard
//         </Link>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default LedgerListPage;


import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LedgerService from '../../services/ComapnyLedgerService';
import CompanyService from '../../services/CompanyService';
import moment from 'moment';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const LedgerListPage = () => {
  const [ledgerData, setLedgerData] = useState(null);
  const [companiesSummary, setCompaniesSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [filterCompanyId, setFilterCompanyId] = useState('all'); // Set 'all' as default
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Helper function to format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set initial date filters to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
    setFilterMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setFilterYear(String(today.getFullYear()));
  }, []);

  // Fetch companies and initial summary
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const companyRes = await CompanyService.getAllCompanies();
        setCompanies(companyRes.data);
        const summaryRes = await LedgerService.getCompaniesLedgerSummary();
        setCompaniesSummary(summaryRes.data.companiesSummary || []);
      } catch {
        setError('Failed to load initial page data.');
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, []);

  // Fetch ledger data based on filters
  const fetchLedgerData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const params = {};
    if (filterCompanyId && filterCompanyId !== 'all') {
      params.companyId = filterCompanyId;
    }
    if (filterStartDate && filterEndDate) {
      params.startDate = filterStartDate;
      params.endDate = filterEndDate;
    } else if (filterMonth && filterYear) {
      params.month = filterMonth;
      params.year = filterYear;
    }
    try {
      let response;
      if (filterCompanyId === 'all') {
        response = await LedgerService.getCompaniesLedgerSummary(params);
        // Transform summary data into ledgerEntries format for consistent display
        const aggregatedEntriesArrays = await Promise.all(
          response.data.companiesSummary.map(async summary => {
            const company = summary.company;
            // Fetch detailed ledger for each company and merge
            const ledgerRes = await LedgerService.getCompanyLedger({ companyId: company._id, ...params });
            return ledgerRes.data.ledgerEntries.map(entry => ({
              ...entry,
              companyName: company.name
            }));
          })
        );
        const aggregatedEntries = aggregatedEntriesArrays.flat();
        setLedgerData({
          company: { name: 'All Companies' },
          ledgerEntries: aggregatedEntries.sort((a, b) => new Date(a.date) - new Date(b.date)),
          summary: response.data.grandTotals,
          dateRange: response.data.dateRange
        });
      } else {
        response = await LedgerService.getCompanyLedger(params);
        setLedgerData({
          ...response.data,
          ledgerEntries: response.data.ledgerEntries.map(entry => ({
            ...entry,
            companyName: response.data.company.name
          }))
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch ledger data.';
      setError(errMsg);
      setLedgerData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filterCompanyId, filterStartDate, filterEndDate, filterMonth, filterYear]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  // Handle month navigation
  const handleMonthChange = (direction) => {
    let newMonth = parseInt(filterMonth, 10);
    let newYear = parseInt(filterYear, 10);
    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }
    const newFirstDay = new Date(newYear, newMonth - 1, 1);
    const newLastDay = new Date(newYear, newMonth, 0);
    setFilterMonth(String(newMonth).padStart(2, '0'));
    setFilterYear(String(newYear));
    setFilterStartDate(formatDateForInput(newFirstDay));
    setFilterEndDate(formatDateForInput(newLastDay));
  };

  // Export functions
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      const params = buildExportParams();
      const fileName = `${ledgerData?.company?.name || 'ledger'}_Ledger_${filterStartDate}_to_${filterEndDate}.xlsx`;
      const response = await LedgerService.downloadCompanyLedgerExcel(params);
      LedgerService.triggerDownload(response.data, fileName);
    } catch (err) {
      setExportError(err.response?.data?.message || 'Failed to export to Excel');
    } finally {
      setIsExporting(false);
    }
  };

const handleExportPDF = async () => {
  setIsExporting(true);
  setExportError('');

  try {
    // Validate date range
    if (!filterStartDate || !filterEndDate) {
      throw new Error('Please select a date range');
    }

    const response = await LedgerService.downloadCompanyLedgerPDF({
      companyId: filterCompanyId,
      startDate: filterStartDate,
      endDate: filterEndDate,
      month: filterMonth,
      year: filterYear
    });

    // Generate filename
    const fileName = `Ledger_${
      filterCompanyId === 'all' ? 'All_Companies' : ledgerData?.company?.name || ''
    }_${moment(filterStartDate).format('YYYYMMDD')}-${moment(filterEndDate).format('YYYYMMDD')}.pdf`;

    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    
  } catch (error) {
    const errorMsg = error.response?.data?.message || 
                   error.message || 
                   'Failed to export PDF';
    setExportError(errorMsg);
    console.error('Export error:', error);
  } finally {
    setIsExporting(false);
  }
};

  const buildExportParams = () => {
    const params = {};
    // Always include companyId, even if it's 'all'
    params.companyId = filterCompanyId || 'all';
    
    if (filterStartDate && filterEndDate) {
      params.startDate = filterStartDate;
      params.endDate = filterEndDate;
    } else if (filterMonth && filterYear) {
      params.month = filterMonth;
      params.year = filterYear;
    }
    return params;
  };

  // View ledger entry details
  const handleViewEntry = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const clearFilters = () => {
    setFilterCompanyId('all'); // Set back to 'all' when clearing filters
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFilterStartDate(formatDateForInput(firstDay));
    setFilterEndDate(formatDateForInput(lastDay));
    setFilterMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setFilterYear(String(today.getFullYear()));
  };

  if (isLoading && !ledgerData && companiesSummary.length === 0) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading data...
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <motion.h1
          className="text-4xl font-extrabold text-gray-800"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Company Ledger
        </motion.h1>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[
          { label: 'Total Sales', value: ledgerData?.summary?.totalSales, color: 'blue', loading: isLoading },
          { label: 'Total Purchases', value: ledgerData?.summary?.totalPurchases, color: 'orange', loading: isLoading },
          { label: 'Net Balance', value: ledgerData?.summary?.netBalance, type: ledgerData?.summary?.balanceType, color: 'green', loading: isLoading },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            className={`p-6 bg-white rounded-xl shadow-lg border-t-4 border-${item.color}-500`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <h3 className={`text-sm font-medium text-${item.color}-600`}>{item.label}</h3>
            {item.loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : (
              <p className={`text-2xl font-bold text-${item.color}-700`}>
                INR {item.value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                {item.type && ` (${item.type})`}
              </p>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Export Error Display */}
      <AnimatePresence>
        {exportError && (
          <motion.div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p>Export Error: {exportError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Section with Export Buttons */}
<motion.div
  className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-gray-200"
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <h2 className="text-xl font-semibold text-gray-900">Filter Ledger Entries</h2>
    <div className="flex flex-col sm:flex-row gap-3">
      <motion.button
        onClick={handleExportExcel}
        disabled={isExporting || isLoading || !ledgerData}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Export ledger to Excel"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Export Excel
      </motion.button>
      <motion.button
        onClick={handleExportPDF}
        disabled={isExporting || isLoading || !ledgerData}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Export ledger to PDF"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Export PDF
      </motion.button>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {/* Company Filter */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Company
      </label>
      <select
        id="company-filter"
        value={filterCompanyId}
        onChange={(e) => setFilterCompanyId(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50"
        aria-describedby="company-filter-desc"
      >
        <option value="all">All Companies</option>
        {companies.map((company) => (
          <option key={company._id} value={company._id}>
            {company.name}
          </option>
        ))}
      </select>
      <p id="company-filter-desc" className="sr-only">
        Select a company to filter ledger entries or choose All Companies.
      </p>
    </motion.div>

    {/* Start Date */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
        Start Date
      </label>
      <div className="relative">
        <input
          id="start-date"
          type="date"
          value={filterStartDate}
          onChange={(e) => {
            setFilterStartDate(e.target.value);
            setFilterMonth('');
            setFilterYear('');
          }}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 pl-10"
          aria-describedby="start-date-desc"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p id="start-date-desc" className="sr-only">
        Select the start date for filtering ledger entries.
      </p>
    </motion.div>

    {/* End Date */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
        End Date
      </label>
      <div className="relative">
        <input
          id="end-date"
          type="date"
          value={filterEndDate}
          onChange={(e) => {
            setFilterEndDate(e.target.value);
            setFilterMonth('');
            setFilterYear('');
          }}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 pl-10"
          aria-describedby="end-date-desc"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p id="end-date-desc" className="sr-only">
        Select the end date for filtering ledger entries.
      </p>
    </motion.div>
  </div>

  {/* Filter Actions */}
  <motion.div
    className="mt-6 flex flex-col sm:flex-row gap-3"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay: 0.5 }}
  >
    <button
      onClick={fetchLedgerData}
      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
      disabled={isLoading}
      aria-label="Apply filters to ledger"
    >
      {isLoading ? 'Applying...' : 'Apply Filters'}
    </button>
    <button
      onClick={clearFilters}
      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
      disabled={isLoading}
      aria-label="Reset filters"
    >
      Reset Filters
    </button>
  </motion.div>
</motion.div>

      {/* Modal for Ledger Entry Details */}
      <AnimatePresence>
        {isModalOpen && selectedEntry && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Ledger Entry Details</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Company:</span> {selectedEntry.companyName || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {formatDisplayDate(selectedEntry.date)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {selectedEntry.type}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Document No.:</span> {selectedEntry.docNo}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {selectedEntry.description}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Debit:</span> {selectedEntry.debit ? `₹${selectedEntry.debit.toFixed(2)}` : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Credit:</span> {selectedEntry.credit ? `₹${selectedEntry.credit.toFixed(2)}` : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reference ID:</span> {selectedEntry.referenceId}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reference Type:</span> {selectedEntry.referenceType}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-center text-red-500 mb-6 p-4 bg-red-50 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Error: {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Ledger Table */}
      {ledgerData?.ledgerEntries?.length > 0 ? (
        <motion.div
          className="bg-white shadow-lg rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {['Company', 'Date', 'Type', 'Doc No.', 'Description', 'Debit', 'Credit', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Debit' || header === 'Credit' || header === 'Actions' ? 'text-right' : ''}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ledgerData.ledgerEntries.map((entry, index) => (
                  <motion.tr
                    key={`${entry.referenceId}-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-4 py-4 text-sm text-gray-600">{entry.companyName}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatDisplayDate(entry.date)}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`font-semibold ${entry.type.includes('Sale') || entry.type.includes('Made') ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{entry.docNo}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 max-w-[200px] truncate" title={entry.description}>
                      {entry.description}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-green-700">
                      {entry.debit ? entry.debit.toFixed(2) : ''}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-red-700">
                      {entry.credit ? entry.credit.toFixed(2) : ''}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium flex justify-end space-x-2">
                      <motion.button
                        onClick={() => handleViewEntry(entry)}
                        className="relative text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Details"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <EyeIcon className="h-5 w-5" />
                        <span className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        !isLoading && (
          <motion.div
            className="text-center py-12 bg-white shadow-lg rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-500 text-lg">No ledger entries found matching your criteria.</p>
          </motion.div>
        )
      )}

      {/* Companies Summary Table */}
      {companiesSummary.length > 0 && (
        <motion.div
          className="mt-8 bg-white shadow-lg rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-800 p-6">Companies Ledger Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {['Company', 'Total Sales', 'Total Purchases', 'Payments Received', 'Payments Made', 'Net Balance'].map((header) => (
                    <th
                      key={header}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.includes('Total') || header.includes('Payments') || header === 'Net Balance' ? 'text-right' : ''}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companiesSummary.map((summary, index) => (
                  <motion.tr
                    key={summary.company._id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-4 py-4 text-sm text-gray-600">{summary.company.name}</td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-blue-700">
                      {summary.totals.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-orange-700">
                      {summary.totals.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-red-700">
                      {summary.totals.totalPaymentsReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-green-700">
                      {summary.totals.totalPaymentsMade.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-4 text-sm text-right font-medium ${summary.totals.balanceType === 'Receivable' ? 'text-green-700' : 'text-red-700'}`}>
                      {summary.totals.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({summary.totals.balanceType})
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default LedgerListPage;