// // import React, { useState, useEffect, useCallback } from 'react';
// // import { Link, useNavigate } from 'react-router-dom';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { EyeIcon, PencilIcon, TrashIcon, PlusIcon, PrinterIcon } from '@heroicons/react/24/outline';
// // import BoxService from '../../services/BoxService';
// // import SettingsService from '../../services/SettingsService';

// // const BoxPrintModal = ({ boxes, onClose, onPrint }) => {
// //   const [lotNo, setLotNo] = useState('');

// //   return (
// //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
// //       <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
// //         <h2 className="text-xl font-bold mb-4">Print Box Slips</h2>
        
// //         <div className="mb-4">
// //           <label className="block text-sm font-medium text-gray-700 mb-1">Enter Lot Number:</label>
// //           <input
// //             type="text"
// //             value={lotNo}
// //             onChange={(e) => setLotNo(e.target.value)}
// //             className="w-full p-2 border border-gray-300 rounded-md"
// //             placeholder="Enter lot number"
// //             required
// //           />
// //         </div>

// //         <div className="flex justify-end space-x-3">
// //           <button
// //             onClick={onClose}
// //             className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
// //           >
// //             Cancel
// //           </button>
// //           <button
// //             onClick={() => onPrint(lotNo)}
// //             disabled={!lotNo}
// //             className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${!lotNo ? 'opacity-50 cursor-not-allowed' : ''}`}
// //           >
// //             Print
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // const BoxSlipPrintView = ({ boxes, lotNo, onClose }) => {
// //   const handlePrint = () => {
// //     const printWindow = window.open('', '_blank');
    
// //     // Calculate how many pages we need (12 slips per page)
// //     const slipsPerPage = 12;
// //     const pageCount = Math.ceil(boxes.length / slipsPerPage);
    
// //     let html = `
// //       <!DOCTYPE html>
// //       <html>
// //         <head>
// //           <title>MAHADEV FILAMENTS - Box Slips</title>
// //           <style>
// //             body {
// //               font-family: Arial, sans-serif;
// //               margin: 0;
// //               padding: 0;
// //             }
// //             .page {
// //               width: 210mm;
// //               height: 297mm;
// //               padding: 10mm;
// //               box-sizing: border-box;
// //               page-break-after: always;
// //               display: grid;
// //               grid-template-columns: repeat(2, 1fr);
// //               grid-template-rows: repeat(6, 1fr);
// //               gap: 5mm;
// //             }
// //             .slip {
// //               border: 1px solid #000;
// //               padding: 3mm;
// //               box-sizing: border-box;
// //               page-break-inside: avoid;
// //               display: flex;
// //               flex-direction: column;
// //             }
// //             .company-name {
// //               text-align: center;
// //               font-weight: bold;
// //               font-size: 14pt;
// //               margin-bottom: 2mm;
// //             }
// //             .divider {
// //               border-top: 1px solid #000;
// //               margin: 2mm 0;
// //             }
// //             .details {
// //               display: grid;
// //               grid-template-columns: 1fr 1fr;
// //               gap: 1mm;
// //               font-size: 10pt;
// //               flex-grow: 1;
// //             }
// //             .detail-label {
// //               font-weight: bold;
// //             }
// //             @page {
// //               size: A4;
// //               margin: 0;
// //             }
// //             @media print {
// //               body {
// //                 margin: 0;
// //                 padding: 0;
// //               }
// //               .page {
// //                 margin: 0;
// //                 padding: 10mm;
// //               }
// //             }
// //           </style>
// //         </head>
// //         <body>
// //     `;

// //     // Split boxes into pages
// //     for (let page = 0; page < pageCount; page++) {
// //       const startIdx = page * slipsPerPage;
// //       const endIdx = Math.min(startIdx + slipsPerPage, boxes.length);
// //       const pageBoxes = boxes.slice(startIdx, endIdx);

// //       html += `<div class="page">`;
      
// //       // Add slips for this page
// //       pageBoxes.forEach(box => {
// //         html += `
// //           <div class="slip">
// //             <div class="company-name">MAHADEV FILAMENTS</div>
// //             <div class="divider"></div>
// //             <div class="details">
// //               <div>DENIER/FILAMENT:</div>
// //               <div>${box.descriptionOfGoods}</div>
              
// //               <div>BOX NO:</div>
// //               <div>${box.boxNumber}</div>
              
// //               <div>LOT NO:</div>
// //               <div>${lotNo}</div>
              
// //               <div>COPS:</div>
// //               <div>${box.cops}</div>
              
// //               <div>GRS WEIGHT:</div>
// //               <div>${box.grossWeight?.toFixed(3) || 'N/A'}</div>
              
// //               <div>NET WEIGHT:</div>
// //               <div>${box.netWeight?.toFixed(3) || 'N/A'}</div>
// //             </div>
// //           </div>
// //         `;
// //       });

// //       // Fill remaining slots with empty slips if needed
// //       const remainingSlots = slipsPerPage - pageBoxes.length;
// //       for (let i = 0; i < remainingSlots; i++) {
// //         html += `<div class="slip"></div>`;
// //       }

// //       html += `</div>`; // Close page
// //     }

// //     html += `
// //         </body>
// //       </html>
// //     `;

// //     printWindow.document.write(html);
// //     printWindow.document.close();
    
// //     // Wait for content to load before printing
// //     printWindow.onload = () => {
// //       setTimeout(() => {
// //         printWindow.print();
// //         printWindow.close();
// //       }, 500);
// //     };
// //   };

// //   return (
// //     <div className="fixed inset-0 bg-white p-4 z-50 overflow-auto">
// //       <div className="flex justify-between items-center mb-4 no-print">
// //         <h2 className="text-xl font-bold">Box Slips Preview</h2>
// //         <div className="space-x-2">
// //           <button
// //             onClick={onClose}
// //             className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
// //           >
// //             Close
// //           </button>
// //           <button
// //             onClick={handlePrint}
// //             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
// //           >
// //             Print Now
// //           </button>
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 no-print">
// //         {boxes.map((box, index) => (
// //           <div key={index} className="border border-gray-300 p-4">
// //             <div className="text-center font-bold text-lg mb-2">MAHADEV FILAMENTS</div>
// //             <div className="border-t border-black mb-2"></div>
// //             <div className="grid grid-cols-2 gap-2 text-sm">
// //               <div>DENIER/FILAMENT:</div>
// //               <div className="font-medium">{box.descriptionOfGoods}</div>
// //               <div>BOX NO:</div>
// //               <div className="font-medium">{box.boxNumber}</div>
// //               <div>LOT NO:</div>
// //               <div className="font-medium">{lotNo}</div>
// //               <div>COPS:</div>
// //               <div className="font-medium">{box.cops}</div>
// //               <div>GRS WEIGHT:</div>
// //               <div className="font-medium">{box.grossWeight?.toFixed(3) || 'N/A'}</div>
// //               <div>NET WEIGHT:</div>
// //               <div className="font-medium">{box.netWeight?.toFixed(3) || 'N/A'}</div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // const BoxListPage = () => {
// //     const navigate = useNavigate();
// //     const [boxes, setBoxes] = useState([]);
// //     const [selectedBoxes, setSelectedBoxes] = useState([]);
// //     const [isLoading, setIsLoading] = useState(false);
// //     const [error, setError] = useState('');
// //     const [availableDescriptions, setAvailableDescriptions] = useState([]);
// //     const [filters, setFilters] = useState({
// //       descriptionOfGoods: '',
// //       isUsed: '',
// //       search: ''
// //     });
// //     const [showPrintModal, setShowPrintModal] = useState(false);
// //     const [showPrintView, setShowPrintView] = useState(false);
// //     const [printLotNo, setPrintLotNo] = useState('');

// //     const fetchBoxes = useCallback(async () => {
// //       setIsLoading(true);
// //       setError('');
// //       try {
// //         const params = {};
// //         if (filters.descriptionOfGoods && filters.descriptionOfGoods !== 'All Descriptions') {
// //           params.descriptionOfGoods = filters.descriptionOfGoods;
// //         }
// //         if (filters.isUsed !== '') {
// //           params.isUsed = filters.isUsed;
// //         }
// //         if (filters.search.trim()) {
// //           params.search = filters.search.trim();
// //         }

// //         const response = await BoxService.getAllBoxes(params);
// //         setBoxes(response.data);
// //       } catch (err) {
// //         const errMsg = err.response?.data?.message || err.message || 'Failed to fetch boxes.';
// //         setError(errMsg);
// //         setBoxes([]);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     }, [filters]);

// //     useEffect(() => {
// //       const fetchInitialData = async () => {
// //         try {
// //           const settingsRes = await SettingsService.getSettings();
// //           setAvailableDescriptions(settingsRes.data.itemConfigurations.map(item => item.description) || []);
// //         } catch (err) {
// //           console.error("Error fetching settings:", err);
// //         }
// //       };
// //       fetchInitialData();
// //     }, []); 
    
// //     useEffect(() => {
// //       fetchBoxes(); 
// //     }, [filters, fetchBoxes]); 

// //     const handleDeleteBox = async (boxId) => {
// //       if (window.confirm('Are you sure you want to delete this box? This action cannot be undone.')) {
// //         try {
// //           await BoxService.deleteBox(boxId);
// //           setBoxes(prev => prev.filter(box => box._id !== boxId));
// //           setSelectedBoxes(prev => prev.filter(id => id !== boxId));
// //         } catch (err) {
// //           const errMsg = err.response?.data?.message || err.message || 'Failed to delete box.';
// //           setError(errMsg);
// //         }
// //       }
// //     };

// //     const handleFilterChange = (e) => {
// //       const { name, value } = e.target;
// //       setFilters(prev => ({
// //         ...prev,
// //         [name]: name === 'isUsed' ? (value === '' ? '' : value) : value
// //       }));
// //     };  

// //     const clearFilters = () => {
// //       setFilters({
// //         descriptionOfGoods: '',
// //         isUsed: '',
// //         search: ''
// //       });
// //     };

// //     const toggleBoxSelection = (boxId) => {
// //       setSelectedBoxes(prev => 
// //         prev.includes(boxId) 
// //           ? prev.filter(id => id !== boxId) 
// //           : [...prev, boxId]
// //       );
// //     };

// //     const toggleSelectAll = (e) => {
// //       if (e.target.checked) {
// //         setSelectedBoxes(boxes.map(box => box._id));
// //       } else {
// //         setSelectedBoxes([]);
// //       }
// //     };

// //     const handlePrintSelected = () => {
// //       const boxesToPrint = boxes.filter(box => selectedBoxes.includes(box._id));
// //       if (boxesToPrint.length === 0) {
// //         alert('Please select at least one box to print.');
// //         return;
// //       }
// //       setShowPrintModal(true);
// //     };

// //     const handlePrint = (lotNo) => {
// //       setPrintLotNo(lotNo);
// //       setShowPrintModal(false);
// //       setShowPrintView(true);
// //     };

// //     return (
// //       <motion.div
// //         className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
// //         initial={{ opacity: 0 }}
// //         animate={{ opacity: 1 }}
// //         transition={{ duration: 0.5 }}
// //       >
// //         {showPrintModal && (
// //           <BoxPrintModal 
// //             boxes={boxes.filter(box => selectedBoxes.includes(box._id))} 
// //             onClose={() => setShowPrintModal(false)}
// //             onPrint={handlePrint}
// //           />
// //         )}

// //         {showPrintView && (
// //           <BoxSlipPrintView 
// //             boxes={boxes.filter(box => selectedBoxes.includes(box._id))}
// //             lotNo={printLotNo}
// //             onClose={() => setShowPrintView(false)}
// //           />
// //         )}

// //         <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
// //           <motion.h1
// //             className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 text-center sm:text-left"
// //             initial={{ y: -20 }}
// //             animate={{ y: 0 }}
// //             transition={{ duration: 0.4 }}
// //           >
// //             Box Management
// //           </motion.h1>
// //           <div className="flex space-x-2">
// //             {selectedBoxes.length > 0 && (
// //               <button
// //                 onClick={handlePrintSelected}
// //                 className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all"
// //               >
// //                 <PrinterIcon className="h-5 w-5 mr-2" />
// //                 Print Selected ({selectedBoxes.length})
// //               </button>
// //             )}
// //             <Link
// //               to="/boxes/create"
// //               className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
// //             >
// //               <PlusIcon className="h-5 w-5 mr-2" />
// //               Add New Box
// //             </Link>
// //           </div>
// //         </div>

// //         {/* Filters Section */}
// //         <motion.div
// //           className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
// //           initial={{ y: 20, opacity: 0 }}
// //           animate={{ y: 0, opacity: 1 }}
// //           transition={{ duration: 0.5 }}
// //         >
// //           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
// //             <div>
// //               <label htmlFor="descriptionOfGoods" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
// //               <select
// //                 id="descriptionOfGoods"
// //                 name="descriptionOfGoods"
// //                 value={filters.descriptionOfGoods}
// //                 onChange={handleFilterChange}
// //                 className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
// //               >
// //                 <option value="">All Descriptions</option>
// //                 {availableDescriptions.map(desc => (
// //                   <option key={desc} value={desc}>{desc}</option>
// //                 ))}
// //               </select>
// //             </div>

// //             <div>
// //               <label htmlFor="isUsed" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
// //               <select
// //                 id="isUsed"
// //                 name="isUsed"
// //                 value={filters.isUsed}
// //                 onChange={handleFilterChange}
// //                 className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
// //               >
// //                 <option value="">All Statuses</option>
// //                 <option value="false">Available</option>
// //                 <option value="true">Used</option>
// //               </select>
// //             </div>

// //             <div>
// //               <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
// //               <input
// //                 type="text"
// //                 id="search"
// //                 name="search"
// //                 value={filters.search}
// //                 onChange={handleFilterChange}
// //                 placeholder="Search by box number..."
// //                 className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
// //               />
// //             </div>
// //           </div>
// //           <div className="mt-4">
// //             <button
// //               onClick={clearFilters}
// //               className="px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
// //             >
// //               Clear Filters
// //             </button>
// //           </div>
// //         </motion.div>

// //         <AnimatePresence>
// //           {error && (
// //             <motion.div
// //               className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-500 rounded-lg text-xs sm:text-sm"
// //               initial={{ opacity: 0, y: -10 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               exit={{ opacity: 0, y: -10 }}
// //             >
// //               {error}
// //             </motion.div>
// //           )}
// //         </AnimatePresence>

// //         {isLoading && (
// //           <motion.div
// //             className="text-center py-8 text-gray-500"
// //             initial={{ opacity: 0 }}
// //             animate={{ opacity: 1 }}
// //             transition={{ duration: 0.3 }}
// //           >
// //             Loading boxes...
// //           </motion.div>
// //         )}

// //         {!isLoading && boxes.length === 0 && (
// //           <motion.div
// //             className="text-center py-8 bg-white shadow-lg rounded-xl"
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5 }}
// //           >
// //             <p className="text-gray-500">No boxes found matching your criteria.</p>
// //           </motion.div>
// //         )}

// //         {!isLoading && boxes.length > 0 && (
// //           <motion.div
// //             className="bg-white shadow-lg rounded-xl overflow-hidden"
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5 }}
// //           >
// //             <div className="overflow-x-auto">
// //               <table className="min-w-full divide-y divide-gray-200">
// //                 <thead className="bg-gray-100">
// //                   <tr>
// //                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
// //                       <input 
// //                         type="checkbox" 
// //                         onChange={toggleSelectAll}
// //                         checked={selectedBoxes.length === boxes.length && boxes.length > 0}
// //                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
// //                       />
// //                     </th>
// //                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Box No.</th>
// //                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
// //                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
// //                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cops</th>
// //                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
// //                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody className="bg-white divide-y divide-gray-200">
// //                   <AnimatePresence>
// //                     {boxes.map((box, index) => (
// //                       <motion.tr
// //                         key={box._id}
// //                         className="hover:bg-gray-50 transition-colors"
// //                         initial={{ opacity: 0, y: 10 }}
// //                         animate={{ opacity: 1, y: 0 }}
// //                         transition={{ duration: 0.3, delay: index * 0.05 }}
// //                       >
// //                         <td className="px-4 py-4 whitespace-nowrap">
// //                           <input 
// //                             type="checkbox" 
// //                             checked={selectedBoxes.includes(box._id)}
// //                             onChange={() => toggleBoxSelection(box._id)}
// //                             className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
// //                           />
// //                         </td>
// //                         <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{box.boxNumber}</td>
// //                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.descriptionOfGoods}</td>
// //                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.netWeight?.toFixed(2) || 'N/A'} kg</td>
// //                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.cops}</td>
// //                         <td className="px-4 py-4 whitespace-nowrap">
// //                           <span className={`px-2 py-1 text-xs font-semibold rounded-full ${box.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
// //                             {box.isUsed ? 'Used' : 'Available'}
// //                           </span>
// //                         </td>
// //                         <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
// //                           <motion.button
// //                             onClick={() => navigate(`/boxes/${box._id}`)}
// //                             className="text-blue-600 hover:text-blue-900 transition-colors"
// //                             whileHover={{ scale: 1.1 }}
// //                             whileTap={{ scale: 0.9 }}
// //                           >
// //                             <EyeIcon className="h-5 w-5" />
// //                           </motion.button>
// //                           <motion.button
// //                             onClick={() => handleDeleteBox(box._id)}
// //                             className="text-red-600 hover:text-red-900 transition-colors"
// //                             whileHover={{ scale: 1.1 }}
// //                             whileTap={{ scale: 0.9 }}
// //                           >
// //                             <TrashIcon className="h-5 w-5" />
// //                           </motion.button>
// //                         </td>
// //                       </motion.tr>
// //                     ))}
// //                   </AnimatePresence>
// //                 </tbody>
// //               </table>
// //             </div>
// //           </motion.div>
// //         )}
// //       </motion.div>
// //     );
// // };

// // export default BoxListPage;

// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { EyeIcon, PencilIcon, TrashIcon, PlusIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
// import BoxService from '../../services/BoxService';
// import SettingsService from '../../services/SettingsService';

// const BoxPrintModal = ({ boxes, onClose, onPrint }) => {
//   const [lotNo, setLotNo] = useState('');

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
//         <h2 className="text-xl font-bold mb-4">Print Box Slips</h2>
        
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">Enter Lot Number:</label>
//           <input
//             type="text"
//             value={lotNo}
//             onChange={(e) => setLotNo(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded-md"
//             placeholder="Enter lot number"
//             required
//           />
//         </div>

//         <div className="flex justify-end space-x-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => onPrint(lotNo)}
//             disabled={!lotNo}
//             className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${!lotNo ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             Print
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const BoxSlipPrintView = ({ boxes, lotNo, onClose }) => {
//   const handlePrint = () => {
//     const printWindow = window.open('', '_blank');
    
//     // Calculate how many pages we need (12 slips per page)
//     const slipsPerPage = 12;
//     const pageCount = Math.ceil(boxes.length / slipsPerPage);
    
//     let html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>MAHADEV FILAMENTS - Box Slips</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               margin: 0;
//               padding: 0;
//             }
//             .page {
//               width: 210mm;
//               height: 297mm;
//               padding: 10mm;
//               box-sizing: border-box;
//               page-break-after: always;
//               display: grid;
//               grid-template-columns: repeat(2, 1fr);
//               grid-template-rows: repeat(6, 1fr);
//               gap: 5mm;
//             }
//             .slip {
//               border: 1px solid #000;
//               padding: 3mm;
//               box-sizing: border-box;
//               page-break-inside: avoid;
//               display: flex;
//               flex-direction: column;
//             }
//             .company-name {
//               text-align: center;
//               font-weight: bold;
//               font-size: 14pt;
//               margin-bottom: 2mm;
//             }
//             .divider {
//               border-top: 1px solid #000;
//               margin: 2mm 0;
//             }
//             .details {
//               display: grid;
//               grid-template-columns: 1fr 1fr;
//               gap: 1mm;
//               font-size: 10pt;
//               flex-grow: 1;
//             }
//             .detail-label {
//               font-weight: bold;
//             }
//             @page {
//               size: A4;
//               margin: 0;
//             }
//             @media print {
//               body {
//                 margin: 0;
//                 padding: 0;
//               }
//               .page {
//                 margin: 0;
//                 padding: 10mm;
//               }
//             }
//           </style>
//         </head>
//         <body>
//     `;

//     // Split boxes into pages
//     for (let page = 0; page < pageCount; page++) {
//       const startIdx = page * slipsPerPage;
//       const endIdx = Math.min(startIdx + slipsPerPage, boxes.length);
//       const pageBoxes = boxes.slice(startIdx, endIdx);

//       html += `<div class="page">`;
      
//       // Add slips for this page
//       pageBoxes.forEach(box => {
//         html += `
//           <div class="slip">
//             <div class="company-name">MAHADEV FILAMENTS</div>
//             <div class="divider"></div>
//             <div class="details">
//               <div>DENIER/FILAMENT:</div>
//               <div>${box.descriptionOfGoods}</div>
              
//               <div>BOX NO:</div>
//               <div>${box.boxNumber}</div>
              
//               <div>LOT NO:</div>
//               <div>${lotNo}</div>
              
//               <div>COPS:</div>
//               <div>${box.cops}</div>
              
//               <div>GRS WEIGHT:</div>
//               <div>${box.grossWeight?.toFixed(3) || 'N/A'}</div>
              
//               <div>NET WEIGHT:</div>
//               <div>${box.netWeight?.toFixed(3) || 'N/A'}</div>
//             </div>
//           </div>
//         `;
//       });

//       // Fill remaining slots with empty slips if needed
//       const remainingSlots = slipsPerPage - pageBoxes.length;
//       for (let i = 0; i < remainingSlots; i++) {
//         html += `<div class="slip"></div>`;
//       }

//       html += `</div>`; // Close page
//     }

//     html += `
//         </body>
//       </html>
//     `;

//     printWindow.document.write(html);
//     printWindow.document.close();
    
//     // Wait for content to load before printing
//     printWindow.onload = () => {
//       setTimeout(() => {
//         printWindow.print();
//         printWindow.close();
//       }, 500);
//     };
//   };

//   return (
//     <div className="fixed inset-0 bg-white p-4 z-50 overflow-auto">
//       <div className="flex justify-between items-center mb-4 no-print">
//         <h2 className="text-xl font-bold">Box Slips Preview</h2>
//         <div className="space-x-2">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
//           >
//             Close
//           </button>
//           <button
//             onClick={handlePrint}
//             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//           >
//             Print Now
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 no-print">
//         {boxes.map((box, index) => (
//           <div key={index} className="border border-gray-300 p-4">
//             <div className="text-center font-bold text-lg mb-2">MAHADEV FILAMENTS</div>
//             <div className="border-t border-black mb-2"></div>
//             <div className="grid grid-cols-2 gap-2 text-sm">
//               <div>DENIER/FILAMENT:</div>
//               <div className="font-medium">{box.descriptionOfGoods}</div>
//               <div>BOX NO:</div>
//               <div className="font-medium">{box.boxNumber}</div>
//               <div>LOT NO:</div>
//               <div className="font-medium">{lotNo}</div>
//               <div>COPS:</div>
//               <div className="font-medium">{box.cops}</div>
//               <div>GRS WEIGHT:</div>
//               <div className="font-medium">{box.grossWeight?.toFixed(3) || 'N/A'}</div>
//               <div>NET WEIGHT:</div>
//               <div className="font-medium">{box.netWeight?.toFixed(3) || 'N/A'}</div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// const BoxListPage = () => {
//     const navigate = useNavigate();
//     const [boxes, setBoxes] = useState([]);
//     const [selectedBoxes, setSelectedBoxes] = useState([]);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [availableDescriptions, setAvailableDescriptions] = useState([]);
//     const [filters, setFilters] = useState({
//       descriptionOfGoods: '',
//       isUsed: '',
//       search: '',
//       startBox: '',
//       endBox: '',
//       startDate: '',
//       endDate: ''
//     });
//     const [showPrintModal, setShowPrintModal] = useState(false);
//     const [showPrintView, setShowPrintView] = useState(false);
//     const [printLotNo, setPrintLotNo] = useState('');
//     const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
//     const [pdfProgress, setPdfProgress] = useState('');

//     const fetchBoxes = useCallback(async () => {
//       setIsLoading(true);
//       setError('');
//       try {
//         const params = {};
//         if (filters.descriptionOfGoods && filters.descriptionOfGoods !== 'All Descriptions') {
//           params.descriptionOfGoods = filters.descriptionOfGoods;
//         }
//         if (filters.isUsed !== '') {
//           params.isUsed = filters.isUsed;
//         }
//         if (filters.search.trim()) {
//           params.search = filters.search.trim();
//         }
//         if (filters.startBox) {
//           params.startBox = filters.startBox;
//         }
//         if (filters.endBox) {
//           params.endBox = filters.endBox;
//         }
//         if (filters.startDate) {
//           params.startDate = filters.startDate;
//         }
//         if (filters.endDate) {
//           params.endDate = filters.endDate;
//         }

//         console.log('Frontend filters being sent:', params);
//         const response = await BoxService.getAllBoxes(params);
//         setBoxes(response.data);
//       } catch (err) {
//         const errMsg = err.response?.data?.message || err.message || 'Failed to fetch boxes.';
//         setError(errMsg);
//         setBoxes([]);
//       } finally {
//         setIsLoading(false);
//       }
//     }, [filters]);

//     useEffect(() => {
//       const fetchInitialData = async () => {
//         try {
//           const settingsRes = await SettingsService.getSettings();
//           setAvailableDescriptions(settingsRes.data.itemConfigurations.map(item => item.description) || []);
//         } catch (err) {
//           console.error("Error fetching settings:", err);
//         }
//       };
//       fetchInitialData();
//     }, []); 
    
//     useEffect(() => {
//       fetchBoxes(); 
//     }, [filters, fetchBoxes]); 

//     const handleDeleteBox = async (boxId) => {
//       if (window.confirm('Are you sure you want to delete this box? This action cannot be undone.')) {
//         try {
//           await BoxService.deleteBox(boxId);
//           setBoxes(prev => prev.filter(box => box._id !== boxId));
//           setSelectedBoxes(prev => prev.filter(id => id !== boxId));
//         } catch (err) {
//           const errMsg = err.response?.data?.message || err.message || 'Failed to delete box.';
//           setError(errMsg);
//         }
//       }
//     };

//     const handleFilterChange = (e) => {
//       const { name, value } = e.target;
//       setFilters(prev => ({
//         ...prev,
//         [name]: name === 'isUsed' ? (value === '' ? '' : value) : value
//       }));
//     };  

//     const clearFilters = () => {
//       setFilters({
//         descriptionOfGoods: '',
//         isUsed: '',
//         search: '',
//         startBox: '',
//         endBox: '',
//         startDate: '',
//         endDate: ''
//       });
//     };

//     const toggleBoxSelection = (boxId) => {
//       setSelectedBoxes(prev => 
//         prev.includes(boxId) 
//           ? prev.filter(id => id !== boxId) 
//           : [...prev, boxId]
//       );
//     };

//     const toggleSelectAll = (e) => {
//       if (e.target.checked) {
//         setSelectedBoxes(boxes.map(box => box._id));
//       } else {
//         setSelectedBoxes([]);
//       }
//     };

//     const handlePrintSelected = () => {
//       const boxesToPrint = boxes.filter(box => selectedBoxes.includes(box._id));
//       if (boxesToPrint.length === 0) {
//         alert('Please select at least one box to print.');
//         return;
//       }
//       setShowPrintModal(true);
//     };

//     const handlePrint = (lotNo) => {
//       setPrintLotNo(lotNo);
//       setShowPrintModal(false);
//       setShowPrintView(true);
//     };

//     // Helper function to get active filter description
//     const getActiveFilters = () => {
//       const activeFilters = [];
      
//       if (filters.descriptionOfGoods && filters.descriptionOfGoods !== 'All Descriptions') {
//         activeFilters.push(`Description: ${filters.descriptionOfGoods}`);
//       }
//       if (filters.isUsed !== '') {
//         activeFilters.push(`Status: ${filters.isUsed === 'true' ? 'Used' : 'Available'}`);
//       }
//       if (filters.search.trim()) {
//         activeFilters.push(`Search: "${filters.search.trim()}"`);
//       }
//       if (filters.startBox || filters.endBox) {
//         activeFilters.push(`Box Range: ${filters.startBox || 'Start'} to ${filters.endBox || 'End'}`);
//       }
//       if (filters.startDate || filters.endDate) {
//         const startStr = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Start';
//         const endStr = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'End';
//         activeFilters.push(`Date Range: ${startStr} to ${endStr}`);
//       }
      
//       return activeFilters;
//     };

//     const handleGeneratePDF = async () => {
//       setIsGeneratingPDF(true);
//       setPdfProgress('Preparing PDF generation...');
      
//       try {
//         // Validate filters before sending
//         if (filters.startBox && filters.endBox && parseInt(filters.startBox) > parseInt(filters.endBox)) {
//           throw new Error('Start box number cannot be greater than end box number.');
//         }
        
//         if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
//           throw new Error('Start date cannot be after end date.');
//         }

//         setPdfProgress('Building filter criteria...');
        
//         // Prepare the filters object exactly as the backend expects
//         const pdfFilters = {
//           descriptionOfGoods: filters.descriptionOfGoods || '',
//           isUsed: filters.isUsed || '',
//           search: filters.search || '',
//           startBox: filters.startBox || '',
//           endBox: filters.endBox || '',
//           startDate: filters.startDate || '',
//           endDate: filters.endDate || ''
//         };

//         console.log('Sending PDF filters to backend:', pdfFilters);
//         console.log('Current boxes count in display:', boxes.length);

//         setPdfProgress('Generating PDF report...');
        
//         const response = await BoxService.generateBoxesPDF(pdfFilters);
        
//         setPdfProgress('Processing PDF data...');
        
//         // Create a blob from the PDF data
//         const blob = new Blob([response.data], { type: 'application/pdf' });
        
//         // Create a URL for the blob
//         const url = window.URL.createObjectURL(blob);
        
//         // Create a temporary link element
//         const link = document.createElement('a');
//         link.href = url;
        
//         // Create a descriptive filename with filter information
//         let filename = 'boxes-report';
        
//         // Add timestamp
//         const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
//         // Add filter info to filename
//         if (filters.descriptionOfGoods && filters.descriptionOfGoods !== 'All Descriptions') {
//           filename += `-${filters.descriptionOfGoods.replace(/[^a-zA-Z0-9]/g, '-')}`;
//         }
//         if (filters.startBox || filters.endBox) {
//           filename += `-box-${filters.startBox || 'start'}-to-${filters.endBox || 'end'}`;
//         }
//         if (filters.startDate || filters.endDate) {
//           filename += `-date-${filters.startDate || 'start'}-to-${filters.endDate || 'end'}`;
//         }
//         if (filters.isUsed !== '') {
//           filename += `-${filters.isUsed === 'true' ? 'used' : 'available'}`;
//         }
        
//         filename += `-${timestamp}.pdf`;
        
//         link.download = filename;
        
//         setPdfProgress('Downloading PDF...');
        
//         // Trigger the download
//         document.body.appendChild(link);
//         link.click();
        
//         // Clean up
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(url);
        
//         // Show success message
//         const activeFilters = getActiveFilters();
//         const filterMsg = activeFilters.length > 0 ? ` with filters: ${activeFilters.join(', ')}` : '';
//         alert(`PDF generated successfully for ${boxes.length} boxes${filterMsg}`);
        
//       } catch (err) {
//         console.error('PDF generation error:', err);
//         const errMsg = err.response?.data?.message || err.message || 'Failed to generate PDF.';
//         setError(`PDF Generation Error: ${errMsg}`);
//       } finally {
//         setIsGeneratingPDF(false);
//         setPdfProgress('');
//       }
//     };

//     // Calculate total net weight
//     const totalNetWeight = boxes.reduce((sum, box) => sum + (box.netWeight || 0), 0);

//     return (
//       <motion.div
//         className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.5 }}
//       >
//         {showPrintModal && (
//           <BoxPrintModal 
//             boxes={boxes.filter(box => selectedBoxes.includes(box._id))} 
//             onClose={() => setShowPrintModal(false)}
//             onPrint={handlePrint}
//           />
//         )}

//         {showPrintView && (
//           <BoxSlipPrintView 
//             boxes={boxes.filter(box => selectedBoxes.includes(box._id))}
//             lotNo={printLotNo}
//             onClose={() => setShowPrintView(false)}
//           />
//         )}

//         <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
//           <motion.h1
//             className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 text-center sm:text-left"
//             initial={{ y: -20 }}
//             animate={{ y: 0 }}
//             transition={{ duration: 0.4 }}
//           >
//             Box Management
//           </motion.h1>
//           <div className="flex flex-wrap gap-2">
//             {selectedBoxes.length > 0 && (
//               <button
//                 onClick={handlePrintSelected}
//                 className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all"
//               >
//                 <PrinterIcon className="h-5 w-5 mr-2" />
//                 Print Selected ({selectedBoxes.length})
//               </button>
//             )}
//             <button
//               onClick={handleGeneratePDF}
//               disabled={isGeneratingPDF || boxes.length === 0}
//               className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all ${isGeneratingPDF || boxes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
//               {isGeneratingPDF ? (
//                 <span className="flex items-center">
//                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   {pdfProgress || 'Generating PDF...'}
//                 </span>
//               ) : `Download PDF (${boxes.length} boxes)`}
//             </button>
//             <Link
//               to="/boxes/create"
//               className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
//             >
//               <PlusIcon className="h-5 w-5 mr-2" />
//               Add New Box
//             </Link>
//           </div>
//         </div>

//         {/* Active Filters Display */}
//         {getActiveFilters().length > 0 && (
//           <motion.div
//             className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3 }}
//           >
//             <h3 className="text-sm font-medium text-blue-800 mb-2">Active Filters:</h3>
//             <div className="flex flex-wrap gap-2">
//               {getActiveFilters().map((filter, index) => (
//                 <span
//                   key={index}
//                   className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
//                 >
//                   {filter}
//                 </span>
//               ))}
//             </div>
//           </motion.div>
//         )}

//         {/* Summary Card */}
//         {boxes.length > 0 && (
//           <motion.div
//             className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
//             initial={{ y: 20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ duration: 0.5 }}
//           >
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="text-center p-4 bg-blue-50 rounded-lg">
//                 <h3 className="text-lg font-semibold text-blue-800">Total Boxes</h3>
//                 <p className="text-2xl font-bold text-blue-600">{boxes.length}</p>
//               </div>
//               <div className="text-center p-4 bg-green-50 rounded-lg">
//                 <h3 className="text-lg font-semibold text-green-800">Total Net Weight</h3>
//                 <p className="text-2xl font-bold text-green-600">{totalNetWeight.toFixed(2)} kg</p>
//               </div>
//               <div className="text-center p-4 bg-purple-50 rounded-lg">
//                 <h3 className="text-lg font-semibold text-purple-800">Available Boxes</h3>
//                 <p className="text-2xl font-bold text-purple-600">
//                   {boxes.filter(box => !box.isUsed).length}
//                 </p>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Filters Section */}
//         <motion.div
//           className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.5 }}
//         >
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
//             <div>
//               <label htmlFor="descriptionOfGoods" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
//               <select
//                 id="descriptionOfGoods"
//                 name="descriptionOfGoods"
//                 value={filters.descriptionOfGoods}
//                 onChange={handleFilterChange}
//                 className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
//               >
//                 <option value="">All Descriptions</option>
//                 {availableDescriptions.map(desc => (
//                   <option key={desc} value={desc}>{desc}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label htmlFor="isUsed" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
//               <select
//                 id="isUsed"
//                 name="isUsed"
//                 value={filters.isUsed}
//                 onChange={handleFilterChange}
//                 className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
//               >
//                 <option value="">All Statuses</option>
//                 <option value="false">Available</option>
//                 <option value="true">Used</option>
//               </select>
//             </div>

//             <div>
//               <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
//               <input
//                 type="text"
//                 id="search"
//                 name="search"
//                 value={filters.search}
//                 onChange={handleFilterChange}
//                 placeholder="Search by box number..."
//                 className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-2">
//               <div>
//                 <label htmlFor="startBox" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Box</label>
//                 <input
//                   type="number"
//                   id="startBox"
//                   name="startBox"
//                   value={filters.startBox}
//                   onChange={handleFilterChange}
//                   placeholder="From"
//                   className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
//                 />
//               </div>
//               <div>
//                 <label htmlFor="endBox" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Box</label>
//                 <input
//                   type="number"
//                   id="endBox"
//                   name="endBox"
//                   value={filters.endBox}
//                   onChange={handleFilterChange}
//                   placeholder="To"
//                   className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-2">
//               <div>
//                 <label htmlFor="startDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
//                 <input
//                   type="date"
//                   id="startDate"
//                   name="startDate"
//                   value={filters.startDate}
//                   onChange={handleFilterChange}
//                   className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
//                 />
//               </div>
//               <div>
//                 <label htmlFor="endDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
//                 <input
//                   type="date"
//                   id="endDate"
//                   name="endDate"
//                   value={filters.endDate}
//                   onChange={handleFilterChange}
//                   className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
//                 />
//               </div>
//             </div>
//           </div>
//           <div className="mt-4 flex justify-between items-center">
//             <button
//               onClick={clearFilters}
//               className="px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
//             >
//               Clear Filters
//             </button>
//             <div className="text-sm text-gray-500">
//               Showing {boxes.length} boxes
//             </div>
//           </div>
//         </motion.div>

//         <AnimatePresence>
//           {error && (
//             <motion.div
//               className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-500 rounded-lg text-xs sm:text-sm border border-red-200"
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//             >
//               <div className="flex items-center">
//                 <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//                 {error}
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* PDF Generation Progress */}
//         {isGeneratingPDF && pdfProgress && (
//           <motion.div
//             className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm border border-blue-200"
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//           >
//             <div className="flex items-center">
//               <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//               </svg>
//               {pdfProgress}
//             </div>
//           </motion.div>
//         )}

//         {isLoading && (
//           <motion.div
//             className="text-center py-8 text-gray-500"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.3 }}
//           >
//             <div className="flex justify-center items-center">
//               <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//               </svg>
//               Loading boxes...
//             </div>
//           </motion.div>
//         )}

//         {!isLoading && boxes.length === 0 && (
//           <motion.div
//             className="text-center py-12 bg-white shadow-lg rounded-xl"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <div className="text-gray-400 mb-4">
//               <DocumentArrowDownIcon className="h-16 w-16 mx-auto" />
//             </div>
//             <p className="text-gray-500 text-lg">No boxes found matching your criteria.</p>
//             {getActiveFilters().length > 0 && (
//               <div className="mt-4">
//                 <button
//                   onClick={clearFilters}
//                   className="text-indigo-600 hover:text-indigo-700 underline"
//                 >
//                   Clear all filters to see all boxes
//                 </button>
//               </div>
//             )}
//           </motion.div>
//         )}

//         {!isLoading && boxes.length > 0 && (
//           <motion.div
//             className="bg-white shadow-lg rounded-xl overflow-hidden"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
//                       <input 
//                         type="checkbox" 
//                         onChange={toggleSelectAll}
//                         checked={selectedBoxes.length === boxes.length && boxes.length > 0}
//                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                       />
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Box No.</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cops</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   <AnimatePresence>
//                     {boxes.map((box, index) => (
//                       <motion.tr
//                         key={box._id}
//                         className="hover:bg-gray-50 transition-colors"
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ duration: 0.3, delay: index * 0.05 }}
//                       >
//                         <td className="px-4 py-4 whitespace-nowrap">
//                           <input 
//                             type="checkbox" 
//                             checked={selectedBoxes.includes(box._id)}
//                             onChange={() => toggleBoxSelection(box._id)}
//                             className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                           />
//                         </td>
//                         <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{box.boxNumber}</td>
//                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.descriptionOfGoods}</td>
//                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.netWeight?.toFixed(2) || 'N/A'} kg</td>
//                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.cops}</td>
//                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.grade || 'N/A'}</td>
//                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {new Date(box.createdAt).toLocaleDateString()}
//                         </td>
//                         <td className="px-4 py-4 whitespace-nowrap">
//                           <span className={`px-2 py-1 text-xs font-semibold rounded-full ${box.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
//                             {box.isUsed ? 'Used' : 'Available'}
//                           </span>
//                         </td>
//                         <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
//                           <motion.button
//                             onClick={() => navigate(`/boxes/${box._id}`)}
//                             className="text-blue-600 hover:text-blue-900 transition-colors"
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.9 }}
//                             title="View Box Details"
//                           >
//                             <EyeIcon className="h-5 w-5" />
//                           </motion.button>
//                           {!box.isUsed && (
//                             <motion.button
//                               onClick={() => navigate(`/boxes/edit/${box._id}`)}
//                               className="text-indigo-600 hover:text-indigo-900 transition-colors"
//                               whileHover={{ scale: 1.1 }}
//                               whileTap={{ scale: 0.9 }}
//                               title="Edit Box"
//                             >
//                               <PencilIcon className="h-5 w-5" />
//                             </motion.button>
//                           )}
//                           {!box.isUsed && (
//                             <motion.button
//                               onClick={() => handleDeleteBox(box._id)}
//                               className="text-red-600 hover:text-red-900 transition-colors"
//                               whileHover={{ scale: 1.1 }}
//                               whileTap={{ scale: 0.9 }}
//                               title="Delete Box"
//                             >
//                               <TrashIcon className="h-5 w-5" />
//                             </motion.button>
//                           )}
//                         </td>
//                       </motion.tr>
//                     ))}
//                   </AnimatePresence>
//                 </tbody>
//               </table>
//             </div>
//           </motion.div>
//         )}
//       </motion.div>
//     );
// };

// export default BoxListPage;

// import React, { useState, useEffect, useCallback } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { EyeIcon, PencilIcon, TrashIcon, PlusIcon, PrinterIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
// import BoxService from '../../services/BoxService';
// import SettingsService from '../../services/SettingsService';

// const BoxPrintModal = ({ boxes, onClose, onPrint }) => {
//   const [lotNo, setLotNo] = useState('');

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
//         <h2 className="text-xl font-bold mb-4">Print Box Slips</h2>
        
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">Enter Lot Number:</label>
//           <input
//             type="text"
//             value={lotNo}
//             onChange={(e) => setLotNo(e.target.value)}
//             className="w-full p-2 border border-gray-300 rounded-md"
//             placeholder="Enter lot number"
//             required
//           />
//         </div>

//         <div className="flex justify-end space-x-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => onPrint(lotNo)}
//             disabled={!lotNo}
//             className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${!lotNo ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             Print
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const BoxSlipPrintView = ({ boxes, lotNo, onClose }) => {
//   const handlePrint = () => {
//     const printWindow = window.open('', '_blank');
    
//     // Calculate how many pages we need (12 slips per page)
//     const slipsPerPage = 12;
//     const pageCount = Math.ceil(boxes.length / slipsPerPage);
    
//     let html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>MAHADEV FILAMENTS - Box Slips</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               margin: 0;
//               padding: 0;
//             }
//             .page {
//               width: 210mm;
//               height: 297mm;
//               padding: 10mm;
//               box-sizing: border-box;
//               page-break-after: always;
//               display: grid;
//               grid-template-columns: repeat(2, 1fr);
//               grid-template-rows: repeat(6, 1fr);
//               gap: 5mm;
//             }
//             .slip {
//               border: 1px solid #000;
//               padding: 3mm;
//               box-sizing: border-box;
//               page-break-inside: avoid;
//               display: flex;
//               flex-direction: column;
//             }
//             .company-name {
//               text-align: center;
//               font-weight: bold;
//               font-size: 14pt;
//               margin-bottom: 2mm;
//             }
//             .divider {
//               border-top: 1px solid #000;
//               margin: 2mm 0;
//             }
//             .details {
//               display: grid;
//               grid-template-columns: 1fr 1fr;
//               gap: 1mm;
//               font-size: 10pt;
//               flex-grow: 1;
//             }
//             .detail-label {
//               font-weight: bold;
//             }
//             @page {
//               size: A4;
//               margin: 0;
//             }
//             @media print {
//               body {
//                 margin: 0;
//                 padding: 0;
//               }
//               .page {
//                 margin: 0;
//                 padding: 10mm;
//               }
//             }
//           </style>
//         </head>
//         <body>
//     `;

//     // Split boxes into pages
//     for (let page = 0; page < pageCount; page++) {
//       const startIdx = page * slipsPerPage;
//       const endIdx = Math.min(startIdx + slipsPerPage, boxes.length);
//       const pageBoxes = boxes.slice(startIdx, endIdx);

//       html += `<div class="page">`;
      
//       // Add slips for this page
//       pageBoxes.forEach(box => {
//         html += `
//           <div class="slip">
//             <div class="company-name">MAHADEV FILAMENTS</div>
//             <div class="divider"></div>
//             <div class="details">
//               <span class="detail-label">Lot No:</span> <span>${lotNo}</span>
//               <span class="detail-label">Box No:</span> <span>${box.boxNumber}</span>
//               <span class="detail-label">Gross Wt:</span> <span>${box.grossWeight.toFixed(2)}</span>
//               <span class="detail-label">Tare Wt:</span> <span>${box.tareWeight.toFixed(2)}</span>
//               <span class="detail-label">Net Wt:</span> <span>${box.netWeight.toFixed(2)}</span>
//               <span class="detail-label">Cops:</span> <span>${box.cops}</span>
//               <span class="detail-label">Grade:</span> <span>${box.grade || 'N/A'}</span>
//               <span class="detail-label">Desc:</span> <span>${box.descriptionOfGoods}</span>
//             </div>
//           </div>
//         `;
//       });

//       // Fill remaining slots with empty slips if needed
//       const remaining = slipsPerPage - pageBoxes.length;
//       for (let i = 0; i < remaining; i++) {
//         html += `<div class="slip"></div>`;
//       }

//       html += `</div>`;
//     }

//     html += `
//         </body>
//       </html>
//     `;

//     printWindow.document.write(html);
//     printWindow.document.close();
//     printWindow.print();
//     printWindow.close();
//     onClose();
//   };

//   useEffect(() => {
//     handlePrint();
//   }, []);

//   return null;
// };

// const BoxListPage = () => {
//   const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'detail'
//   const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
//   const [selectedBoxId, setSelectedBoxId] = useState(null);
//   const [selectedBox, setSelectedBox] = useState(null);
//   const [boxes, setBoxes] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [selectedBoxes, setSelectedBoxes] = useState([]);
//   const [showPrintModal, setShowPrintModal] = useState(false);
//   const [printBoxes, setPrintBoxes] = useState([]);
//   const [showPrintView, setShowPrintView] = useState(false);
//   const [printLotNo, setPrintLotNo] = useState('');
//   const [availableDescriptions, setAvailableDescriptions] = useState([]);
//   const [formData, setFormData] = useState({
//     boxNumber: '',
//     descriptionOfGoods: '',
//     grossWeight: '',
//     tareWeight: '',
//     netWeight: '',
//     cops: '',
//     grade: ''
//   });
//   const [formErrors, setFormErrors] = useState({});

//   // Fetch boxes
//   const fetchBoxes = useCallback(async () => {
//     setIsLoading(true);
//     setError('');
//     try {
//       const response = await BoxService.getAllBoxes();
//       setBoxes(response.data);
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || 'Failed to fetch boxes.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (viewMode === 'list') {
//       fetchBoxes();
//     }
//   }, [viewMode, fetchBoxes]);

//   // Fetch settings for descriptions
//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const response = await SettingsService.getSettings();
//         setAvailableDescriptions(response.data.itemConfigurations.map(item => item.description) || []);
//       } catch (err) {
//         console.error('Failed to fetch settings:', err);
//       }
//     };
//     fetchSettings();
//   }, []);

//   // Fetch single box for detail or edit
//   const fetchBox = useCallback(async (id) => {
//     setIsLoading(true);
//     setError('');
//     try {
//       const response = await BoxService.getBoxById(id);
//       setSelectedBox(response.data);
//       if (viewMode === 'form' && formMode === 'edit') {
//         const { _id, createdBy, createdAt, updatedAt, isUsed, ...box } = response.data;
//         setFormData({
//           ...box,
//           grossWeight: box.grossWeight.toString(),
//           tareWeight: box.tareWeight.toString(),
//           netWeight: box.netWeight.toString(),
//           cops: box.cops.toString()
//         });
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || 'Failed to fetch box details.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [viewMode, formMode]);

//   useEffect(() => {
//     if (selectedBoxId && (viewMode === 'detail' || (viewMode === 'form' && formMode === 'edit'))) {
//       fetchBox(selectedBoxId);
//     }
//   }, [selectedBoxId, viewMode, formMode, fetchBox]);

//   // Handle form change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => {
//       const newData = { ...prev, [name]: value };
//       if (name === 'grossWeight' || name === 'tareWeight') {
//         const gross = parseFloat(newData.grossWeight) || 0;
//         const tare = parseFloat(newData.tareWeight) || 0;
//         newData.netWeight = (gross - tare).toFixed(2);
//       }
//       return newData;
//     });
//   };

//   // Validate form
//   const validateForm = () => {
//     const errors = {};
//     if (!formData.boxNumber.trim()) errors.boxNumber = 'Box number is required.';
//     if (!formData.descriptionOfGoods) errors.descriptionOfGoods = 'Description is required.';
//     if (!formData.grossWeight || isNaN(parseFloat(formData.grossWeight)) || parseFloat(formData.grossWeight) <= 0) errors.grossWeight = 'Valid gross weight is required.';
//     if (!formData.tareWeight || isNaN(parseFloat(formData.tareWeight)) || parseFloat(formData.tareWeight) < 0) errors.tareWeight = 'Valid tare weight is required.';
//     if (!formData.cops || isNaN(parseInt(formData.cops)) || parseInt(formData.cops) <= 0) errors.cops = 'Valid cops count is required.';

//     const gross = parseFloat(formData.grossWeight) || 0;
//     const tare = parseFloat(formData.tareWeight) || 0;
//     if (tare >= gross) errors.tareWeight = 'Tare weight must be less than gross weight.';

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // Handle form submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) {
//       setError('Please correct the errors in the form.');
//       return;
//     }
//     setIsLoading(true);
//     setError('');

//     const payload = {
//       ...formData,
//       grossWeight: parseFloat(formData.grossWeight),
//       tareWeight: parseFloat(formData.tareWeight),
//       netWeight: parseFloat(formData.netWeight),
//       cops: parseInt(formData.cops)
//     };

//     try {
//       if (formMode === 'create') {
//         await BoxService.createBox(payload);
//       } else {
//         await BoxService.updateBox(selectedBoxId, payload);
//       }
//       setSuccessMessage(`Box ${formMode === 'create' ? 'created' : 'updated'} successfully!`);
//       setTimeout(() => {
//         setViewMode('list');
//       }, 1500);
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || `Failed to ${formMode === 'create' ? 'create' : 'update'} box.`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle delete box
//   const handleDeleteBox = async (id) => {
//     if (window.confirm('Are you sure you want to delete this box?')) {
//       setIsLoading(true);
//       try {
//         await BoxService.deleteBox(id);
//         fetchBoxes();
//       } catch (err) {
//         setError(err.response?.data?.message || err.message || 'Failed to delete box.');
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   // Toggle box selection for print
//   const toggleBoxSelection = (id) => {
//     setSelectedBoxes(prev =>
//       prev.includes(id) ? prev.filter(boxId => boxId !== id) : [...prev, id]
//     );
//   };

//   // Handle print slips
//   const handlePrintSlips = () => {
//     const printBoxesData = boxes.filter(box => selectedBoxes.includes(box._id));
//     if (printBoxesData.length > 0) {
//       setPrintBoxes(printBoxesData);
//       setShowPrintModal(true);
//     } else {
//       alert('Please select at least one box to print.');
//     }
//   };

//   // Handle print with lot no
//   const handlePrintWithLot = (lotNo) => {
//     setPrintLotNo(lotNo);
//     setShowPrintModal(false);
//     setShowPrintView(true);
//   };

//   // Render list view
//   const renderListView = () => (
//     <>
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800">Boxes</h1>
//         <div className="flex gap-3">
//           <button
//             onClick={() => {
//               setFormMode('create');
//               setFormData({
//                 boxNumber: '',
//                 descriptionOfGoods: '',
//                 grossWeight: '',
//                 tareWeight: '',
//                 netWeight: '',
//                 cops: '',
//                 grade: ''
//               });
//               setFormErrors({});
//               setError('');
//               setSuccessMessage('');
//               setViewMode('form');
//             }}
//             className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
//           >
//             <PlusIcon className="h-5 w-5" />
//             Create Box
//           </button>
//           <button
//             onClick={handlePrintSlips}
//             disabled={selectedBoxes.length === 0}
//             className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ${selectedBoxes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             <PrinterIcon className="h-5 w-5" />
//             Print Slips
//           </button>
//         </div>
//       </div>

//       {error && <div className="p-4 bg-red-50 text-red-500 rounded-lg mb-6">{error}</div>}

//       {isLoading ? (
//         <div className="text-center py-12">Loading...</div>
//       ) : boxes.length === 0 ? (
//         <div className="text-center py-12 bg-white shadow-lg rounded-xl">
//           <p className="text-gray-500 text-lg mb-2">No boxes found.</p>
//         </div>
//       ) : (
//         <div className="bg-white shadow-lg rounded-xl overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Box #</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cops</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               <AnimatePresence>
//                 {boxes.map((box, index) => (
//                   <motion.tr
//                     key={box._id}
//                     className="hover:bg-gray-50 transition-colors"
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.3, delay: index * 0.05 }}
//                   >
//                     <td className="px-4 py-4 whitespace-nowrap">
//                       <input 
//                         type="checkbox" 
//                         checked={selectedBoxes.includes(box._id)}
//                         onChange={() => toggleBoxSelection(box._id)}
//                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//                         disabled={box.isUsed}
//                       />
//                     </td>
//                     <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{box.boxNumber}</td>
//                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.descriptionOfGoods}</td>
//                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.netWeight?.toFixed(2) || 'N/A'} kg</td>
//                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.cops}</td>
//                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.grade || 'N/A'}</td>
//                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
//                       {new Date(box.createdAt).toLocaleDateString()}
//                     </td>
//                     <td className="px-4 py-4 whitespace-nowrap">
//                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${box.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
//                         {box.isUsed ? 'Used' : 'Available'}
//                       </span>
//                     </td>
//                     <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
//                       <motion.button
//                         onClick={() => {
//                           setSelectedBoxId(box._id);
//                           setViewMode('detail');
//                         }}
//                         className="text-blue-600 hover:text-blue-900 transition-colors"
//                         whileHover={{ scale: 1.1 }}
//                         whileTap={{ scale: 0.9 }}
//                         title="View Box Details"
//                       >
//                         <EyeIcon className="h-5 w-5" />
//                       </motion.button>
//                       {!box.isUsed && (
//                         <motion.button
//                           onClick={() => {
//                             setSelectedBoxId(box._id);
//                             setFormMode('edit');
//                             setViewMode('form');
//                           }}
//                           className="text-indigo-600 hover:text-indigo-900 transition-colors"
//                           whileHover={{ scale: 1.1 }}
//                           whileTap={{ scale: 0.9 }}
//                           title="Edit Box"
//                         >
//                           <PencilIcon className="h-5 w-5" />
//                         </motion.button>
//                       )}
//                       {!box.isUsed && (
//                         <motion.button
//                           onClick={() => handleDeleteBox(box._id)}
//                           className="text-red-600 hover:text-red-900 transition-colors"
//                           whileHover={{ scale: 1.1 }}
//                           whileTap={{ scale: 0.9 }}
//                           title="Delete Box"
//                         >
//                           <TrashIcon className="h-5 w-5" />
//                         </motion.button>
//                       )}
//                     </td>
//                   </motion.tr>
//                 ))}
//               </AnimatePresence>
//             </tbody>
//           </table>
//         </div>
//       )}

//       {showPrintModal && (
//         <BoxPrintModal
//           boxes={printBoxes}
//           onClose={() => setShowPrintModal(false)}
//           onPrint={handlePrintWithLot}
//         />
//       )}

//       {showPrintView && (
//         <BoxSlipPrintView
//           boxes={printBoxes}
//           lotNo={printLotNo}
//           onClose={() => setShowPrintView(false)}
//         />
//       )}
//     </>
//   );

//   // Render form view
//   const renderFormView = () => {
//     const title = formMode === 'create' ? 'Create New Box' : 'Edit Box';

//     return (
//       <>
//         <div className="flex items-center mb-6 gap-4">
//           <button
//             onClick={() => setViewMode('list')}
//             className="text-indigo-600 hover:text-indigo-800 transition-colors"
//           >
//             <ArrowLeftIcon className="h-6 w-6" />
//           </button>
//           <h1 className="text-3xl font-extrabold text-gray-800">{title}</h1>
//         </div>

//         {successMessage && <div className="p-4 bg-green-50 text-green-500 rounded-lg mb-6">{successMessage}</div>}
//         {error && <div className="p-4 bg-red-50 text-red-500 rounded-lg mb-6">{error}</div>}

//         <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Box Number <span className="text-red-500">*</span></label>
//               <input
//                 type="text"
//                 name="boxNumber"
//                 value={formData.boxNumber}
//                 onChange={handleChange}
//                 className={`w-full p-3 border ${formErrors.boxNumber ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
//               />
//               {formErrors.boxNumber && <p className="text-xs text-red-500 mt-1">{formErrors.boxNumber}</p>}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
//               <select
//                 name="descriptionOfGoods"
//                 value={formData.descriptionOfGoods}
//                 onChange={handleChange}
//                 className={`w-full p-3 border ${formErrors.descriptionOfGoods ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
//               >
//                 <option value="">Select Description</option>
//                 {availableDescriptions.map(desc => (
//                   <option key={desc} value={desc}>{desc}</option>
//                 ))}
//               </select>
//               {formErrors.descriptionOfGoods && <p className="text-xs text-red-500 mt-1">{formErrors.descriptionOfGoods}</p>}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight (kg) <span className="text-red-500">*</span></label>
//               <input
//                 type="number"
//                 name="grossWeight"
//                 value={formData.grossWeight}
//                 onChange={handleChange}
//                 step="0.01"
//                 className={`w-full p-3 border ${formErrors.grossWeight ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
//               />
//               {formErrors.grossWeight && <p className="text-xs text-red-500 mt-1">{formErrors.grossWeight}</p>}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Tare Weight (kg) <span className="text-red-500">*</span></label>
//               <input
//                 type="number"
//                 name="tareWeight"
//                 value={formData.tareWeight}
//                 onChange={handleChange}
//                 step="0.01"
//                 className={`w-full p-3 border ${formErrors.tareWeight ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
//               />
//               {formErrors.tareWeight && <p className="text-xs text-red-500 mt-1">{formErrors.tareWeight}</p>}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight (kg)</label>
//               <input
//                 type="text"
//                 value={formData.netWeight}
//                 readOnly
//                 className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Cops <span className="text-red-500">*</span></label>
//               <input
//                 type="number"
//                 name="cops"
//                 value={formData.cops}
//                 onChange={handleChange}
//                 step="1"
//                 className={`w-full p-3 border ${formErrors.cops ? 'border-red-500' : 'border-gray-200'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
//               />
//               {formErrors.cops && <p className="text-xs text-red-500 mt-1">{formErrors.cops}</p>}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
//               <input
//                 type="text"
//                 name="grade"
//                 value={formData.grade}
//                 onChange={handleChange}
//                 className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
//               />
//             </div>
//           </div>

//           <div className="flex justify-end pt-6">
//             <button
//               type="submit"
//               disabled={isLoading}
//               className={`px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {isLoading ? 'Processing...' : (formMode === 'create' ? 'Create Box' : 'Update Box')}
//             </button>
//           </div>
//         </form>
//       </>
//     );
//   };

//   // Render detail view
//   const renderDetailView = () => {
//     if (isLoading) return <div className="text-center py-12">Loading...</div>;
//     if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;
//     if (!selectedBox) return <div className="text-center py-12">Box not found.</div>;

//     return (
//       <>
//         <div className="flex items-center mb-6 gap-4">
//           <button
//             onClick={() => setViewMode('list')}
//             className="text-indigo-600 hover:text-indigo-800 transition-colors"
//           >
//             <ArrowLeftIcon className="h-6 w-6" />
//           </button>
//           <h1 className="text-3xl font-extrabold text-gray-800">Box Details</h1>
//         </div>

//         <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
//               <div className="space-y-4">
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Box Number</p>
//                   <p className="text-base text-gray-800 mt-1">{selectedBox.boxNumber}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Description</p>
//                   <p className="text-base text-gray-800 mt-1">{selectedBox.descriptionOfGoods}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Status</p>
//                   <p className="mt-1">
//                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedBox.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
//                       {selectedBox.isUsed ? 'Used' : 'Available'}
//                     </span>
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">Weight Details</h3>
//               <div className="space-y-4">
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Gross Weight</p>
//                   <p className="text-base text-gray-800 mt-1">{selectedBox.grossWeight.toFixed(2)} kg</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Tare Weight</p>
//                   <p className="text-base text-gray-800 mt-1">{selectedBox.tareWeight.toFixed(2)} kg</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Net Weight</p>
//                   <p className="text-base text-gray-800 mt-1">{selectedBox.netWeight.toFixed(2)} kg</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
//               <div className="space-y-4">
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Cops</p>
//                   <p className="text-base text-gray-800 mt-1">{selectedBox.cops}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Grade</p>
//                   <p className="text-base text-gray-800 mt-1">{selectedBox.grade || 'N/A'}</p>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
//               <div className="space-y-4">
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Created At</p>
//                   <p className="text-base text-gray-800 mt-1">
//                     {new Date(selectedBox.createdAt).toLocaleString('en-IN')}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-500">Last Updated</p>
//                   <p className="text-base text-gray-800 mt-1">
//                     {new Date(selectedBox.updatedAt).toLocaleString('en-IN')}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end pt-6">
//             <button
//               onClick={() => {
//                 setFormMode('edit');
//                 setViewMode('form');
//               }}
//               className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
//             >
//               Edit Box
//             </button>
//           </div>
//         </div>
//       </>
//     );
//   };

//   return (
//     <motion.div
//       className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       {viewMode === 'list' && renderListView()}
//       {viewMode === 'form' && renderFormView()}
//       {viewMode === 'detail' && renderDetailView()}
//     </motion.div>
//   );
// };

// export default BoxListPage;


import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, PencilIcon, TrashIcon, PlusIcon, PrinterIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Package,
  X
} from 'lucide-react';
import BoxService from '../../services/BoxService';
import SettingsService from '../../services/SettingsService';

const BoxPrintModal = ({ boxes, onClose, onPrint }) => {
  const [lotNo, setLotNo] = useState('');

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-xl">
              <PrinterIcon className="h-5 w-5 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Print Box Slips</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Enter Lot Number:</label>
          <input
            type="text"
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
            className="w-full px-2 py-2.5 text-sm border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white"
            placeholder="Enter lot number"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onPrint(lotNo)}
            disabled={!lotNo}
            className={`px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all ${!lotNo ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Print
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BoxSlipPrintView = ({ boxes, lotNo, onClose }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    // Calculate how many pages we need (12 slips per page)
    const slipsPerPage = 12;
    const pageCount = Math.ceil(boxes.length / slipsPerPage);
    
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MAHADEV FILAMENTS - Box Slips</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .page {
              width: 210mm;
              height: 297mm;
              padding: 10mm;
              box-sizing: border-box;
              page-break-after: always;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(6, 1fr);
              gap: 5mm;
            }
            .slip {
              border: 1px solid #000;
              padding: 3mm;
              box-sizing: border-box;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
            }
            .company-name {
              text-align: center;
              font-weight: bold;
              font-size: 14pt;
              margin-bottom: 2mm;
            }
            .divider {
              border-top: 1px solid #000;
              margin: 2mm 0;
            }
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1mm;
              font-size: 10pt;
              flex-grow: 1;
            }
            .detail-label {
              font-weight: bold;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .page {
                margin: 0;
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
    `;

    // Split boxes into pages
    for (let page = 0; page < pageCount; page++) {
      const startIdx = page * slipsPerPage;
      const endIdx = Math.min(startIdx + slipsPerPage, boxes.length);
      const pageBoxes = boxes.slice(startIdx, endIdx);

      html += `<div class="page">`;
      
      // Add slips for this page
      pageBoxes.forEach(box => {
        html += `
          <div class="slip">
            <div class="company-name">MAHADEV FILAMENTS</div>
            <div class="divider"></div>
            <div class="details">
              <span class="detail-label">Lot No:</span> <span>${lotNo}</span>
              <span class="detail-label">Box No:</span> <span>${box.boxNumber}</span>
              <span class="detail-label">Gross Wt:</span> <span>${box.grossWeight.toFixed(2)}</span>
              <span class="detail-label">Tare Wt:</span> <span>${box.tareWeight.toFixed(2)}</span>
              <span class="detail-label">Net Wt:</span> <span>${box.netWeight.toFixed(2)}</span>
              <span class="detail-label">Cops:</span> <span>${box.cops}</span>
              <span class="detail-label">Grade:</span> <span>${box.grade || 'N/A'}</span>
              <span class="detail-label">Desc:</span> <span>${box.descriptionOfGoods}</span>
            </div>
          </div>
        `;
      });

      // Fill remaining slots with empty slips if needed
      const remaining = slipsPerPage - pageBoxes.length;
      for (let i = 0; i < remaining; i++) {
        html += `<div class="slip"></div>`;
      }

      html += `</div>`;
    }

    html += `
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    onClose();
  };

  useEffect(() => {
    handlePrint();
  }, []);

  return null;
};

const BoxListPage = () => {
  const [boxes, setBoxes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printBoxes, setPrintBoxes] = useState([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printLotNo, setPrintLotNo] = useState('');
  const [availableDescriptions, setAvailableDescriptions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingBox, setEditingBox] = useState(null);
  const [formData, setFormData] = useState({
    boxNumber: '',
    descriptionOfGoods: '',
    grossWeight: '',
    tareWeight: '',
    netWeight: '',
    cops: '',
    grade: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset index when boxes change
  useEffect(() => {
    setCurrentBoxIndex(0);
  }, [boxes]);

  // Fetch boxes
  const fetchBoxes = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await BoxService.getAllBoxes();
      setBoxes(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch boxes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  // Fetch settings for descriptions
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await SettingsService.getSettings();
        setAvailableDescriptions(response.data.itemConfigurations.map(item => item.description) || []);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'grossWeight' || name === 'tareWeight') {
        const gross = parseFloat(newData.grossWeight) || 0;
        const tare = parseFloat(newData.tareWeight) || 0;
        newData.netWeight = (gross - tare).toFixed(2);
      }
      return newData;
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.boxNumber.trim()) errors.boxNumber = 'Box number is required.';
    if (!formData.descriptionOfGoods) errors.descriptionOfGoods = 'Description is required.';
    if (!formData.grossWeight || isNaN(parseFloat(formData.grossWeight)) || parseFloat(formData.grossWeight) <= 0) errors.grossWeight = 'Valid gross weight is required.';
    if (!formData.tareWeight || isNaN(parseFloat(formData.tareWeight)) || parseFloat(formData.tareWeight) < 0) errors.tareWeight = 'Valid tare weight is required.';
    if (!formData.cops || isNaN(parseInt(formData.cops)) || parseInt(formData.cops) <= 0) errors.cops = 'Valid cops count is required.';

    const gross = parseFloat(formData.grossWeight) || 0;
    const tare = parseFloat(formData.tareWeight) || 0;
    if (tare >= gross) errors.tareWeight = 'Tare weight must be less than gross weight.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');

    const payload = {
      ...formData,
      grossWeight: parseFloat(formData.grossWeight),
      tareWeight: parseFloat(formData.tareWeight),
      netWeight: parseFloat(formData.netWeight),
      cops: parseInt(formData.cops)
    };

    try {
      if (formMode === 'create') {
        await BoxService.createBox(payload);
      } else {
        await BoxService.updateBox(editingBox._id, payload);
      }
      setSuccessMessage(`Box ${formMode === 'create' ? 'created' : 'updated'} successfully!`);
      setShowFormModal(false);
      setEditingBox(null);
      fetchBoxes();
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to ${formMode === 'create' ? 'create' : 'update'} box.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete box
  const handleDeleteBox = async (id) => {
    if (window.confirm('Are you sure you want to delete this box?')) {
      setIsLoading(true);
      try {
        await BoxService.deleteBox(id);
        fetchBoxes();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to delete box.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Toggle box selection for print
  const toggleBoxSelection = (id) => {
    setSelectedBoxes(prev =>
      prev.includes(id) ? prev.filter(boxId => boxId !== id) : [...prev, id]
    );
  };

  // Handle print slips
  const handlePrintSlips = () => {
    const printBoxesData = boxes.filter(box => selectedBoxes.includes(box._id));
    if (printBoxesData.length > 0) {
      setPrintBoxes(printBoxesData);
      setShowPrintModal(true);
    } else {
      alert('Please select at least one box to print.');
    }
  };

  // Handle print with lot no
  const handlePrintWithLot = (lotNo) => {
    setPrintLotNo(lotNo);
    setShowPrintModal(false);
    setShowPrintView(true);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Get box stats
  const getBoxStats = () => {
    const stats = {
      total: boxes.length,
      available: boxes.filter(b => !b.isUsed).length,
      used: boxes.filter(b => b.isUsed).length,
    };
    return stats;
  };

  const stats = getBoxStats();

  const renderBoxList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-12 w-12 text-violet-600 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <motion.div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="p-1 rounded-full bg-red-100">
            <XMarkIcon className="h-4 w-4" />
          </div>
          Error: {error}
        </motion.div>
      );
    }

    if (boxes.length === 0) {
      return (
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 w-fit mx-auto mb-6">
            <Package className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No boxes yet</h3>
          <p className="text-slate-500 mb-6">Get started by adding your first box.</p>
        </motion.div>
      );
    }

    if (isMobile) {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 mb-6">
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase">Boxes</h3>
              <p className="text-xs text-slate-500">{currentBoxIndex + 1} of {boxes.length}</p>
            </div>
          </div>

          <div className="relative">
            <motion.div
              key={boxes[currentBoxIndex]._id}
              className="bg-white/80 backdrop-blur-sm rounded-xl border p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">
                    Box #{boxes[currentBoxIndex].boxNumber}
                  </h3>
                  <p className="text-xs text-slate-500">{boxes[currentBoxIndex].descriptionOfGoods}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                    boxes[currentBoxIndex].isUsed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {boxes[currentBoxIndex].isUsed ? 'Used' : 'Available'}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-600 mb-3">
                <p><b>Net Weight:</b> {boxes[currentBoxIndex].netWeight.toFixed(2)} kg</p>
                <p><b>Cops:</b> {boxes[currentBoxIndex].cops}</p>
                <p><b>Grade:</b> {boxes[currentBoxIndex].grade || 'N/A'}</p>
                <p><b>Date:</b> {formatDisplayDate(boxes[currentBoxIndex].createdAt)}</p>
              </div>

              <div className="flex justify-between gap-2">
                <motion.button
                  onClick={() => {
                    setSelectedBoxId(boxes[currentBoxIndex]._id);
                    setViewMode('detail');
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  <EyeIcon className="h-4 w-4" /> View
                </motion.button>
                {!boxes[currentBoxIndex].isUsed && (
                  <motion.button
                    onClick={() => {
                      setEditingBox(boxes[currentBoxIndex]);
                      setFormMode('edit');
                      setShowFormModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    <PencilIcon className="h-4 w-4" /> Edit
                  </motion.button>
                )}
                {!boxes[currentBoxIndex].isUsed && (
                  <motion.button
                    onClick={() => handleDeleteBox(boxes[currentBoxIndex]._id)}
                    className="flex-1 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl font-medium hover:bg-rose-100 transition-colors flex items-center justify-center gap-1 text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    <TrashIcon className="h-4 w-4" /> Delete
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-4 px-2">
              <motion.button
                onClick={() => setCurrentBoxIndex(prev => Math.max(0, prev - 1))}
                disabled={currentBoxIndex === 0}
                className={`p-2 rounded-lg ${
                  currentBoxIndex === 0
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                } transition-colors`}
                whileHover={currentBoxIndex !== 0 ? { scale: 1.05 } : {}}
                whileTap={currentBoxIndex !== 0 ? { scale: 0.95 } : {}}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </motion.button>
              <div className="flex items-center gap-2">
                {[...Array(Math.min(5, boxes.length))].map((_, i) => {
                  const pageIndex = Math.floor(currentBoxIndex / 5) * 5 + i;
                  if (pageIndex >= boxes.length) return null;
                  return (
                    <motion.button
                      key={pageIndex}
                      onClick={() => setCurrentBoxIndex(pageIndex)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentBoxIndex === pageIndex
                          ? 'bg-violet-600 scale-125'
                          : 'bg-slate-300 hover:bg-violet-400'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                    />
                  );
                })}
              </div>
              <motion.button
                onClick={() => setCurrentBoxIndex(prev => 
                  Math.min(boxes.length - 1, prev + 1)
                )}
                disabled={currentBoxIndex === boxes.length - 1}
                className={`p-2 rounded-lg ${
                  currentBoxIndex === boxes.length - 1
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                } transition-colors`}
                whileHover={currentBoxIndex !== boxes.length - 1 ? { scale: 1.05 } : {}}
                whileTap={currentBoxIndex !== boxes.length - 1 ? { scale: 0.95 } : {}}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Box #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cops</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {boxes.map((box, index) => (
                  <motion.tr
                    key={box._id}
                    className="hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedBoxes.includes(box._id)}
                        onChange={() => toggleBoxSelection(box._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={box.isUsed}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{box.boxNumber}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.descriptionOfGoods}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.netWeight?.toFixed(2) || 'N/A'} kg</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.cops}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.grade || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(box.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${box.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {box.isUsed ? 'Used' : 'Available'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                      <motion.button
                        onClick={() => {
                          setSelectedBoxId(box._id);
                          setViewMode('detail');
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="View Box Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </motion.button>
                      {!box.isUsed && (
                        <motion.button
                          onClick={() => {
                            setEditingBox(box);
                            setFormMode('edit');
                            setShowFormModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Edit Box"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </motion.button>
                      )}
                      {!box.isUsed && (
                        <motion.button
                          onClick={() => handleDeleteBox(box._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete Box"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-4">
        {/* Header Section */}
        <motion.div
          className="mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Box Management
                </h1>
                <p className="text-slate-500 text-xs lg:text-sm font-medium">
                  Manage your box inventory and details
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={handlePrintSlips}
                disabled={selectedBoxes.length === 0}
                className={`px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ${selectedBoxes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PrinterIcon className="h-4 w-4" />
                <span className="text-xs lg:text-base">Print Slips</span>
              </motion.button>
              <motion.button
                onClick={() => {
                  setFormMode('create');
                  setShowFormModal(true);
                }}
                className="hidden lg:flex px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusIcon className="h-4 w-4" />
                <span className="text-xs lg:text-base">Add Box</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatCard
            title="Total Boxes"
            value={stats.total}
            icon={<Package className="h-5 w-5" />}
            gradient="from-slate-500 to-slate-600"
            bgGradient="from-slate-50 to-slate-100"
          />
          <StatCard
            title="Available"
            value={stats.available}
            icon={<CheckCircle className="h-5 w-5" />}
            gradient="from-emerald-500 to-emerald-600"
            bgGradient="from-emerald-50 to-emerald-100"
          />
          <StatCard
            title="Used"
            value={stats.used}
            icon={<XCircle className="h-5 w-5" />}
            gradient="from-red-500 to-red-600"
            bgGradient="from-red-50 to-red-100"
          />
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-1 rounded-full bg-red-100">
                <XMarkIcon className="h-4 w-4" />
              </div>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-1 rounded-full bg-emerald-100">
                <Sparkles className="h-4 w-4" />
              </div>
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {renderBoxList()}

        {/* Form Modal */}
        <AnimatePresence>
          {showFormModal && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFormModal(false)}
              />
              
              {/* Modal Content */}
              <motion.div
                className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 z-10 backdrop-blur-md bg-white/90 border-b border-gray-200/50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
                          {formMode === 'create' ? 'Add New Box' : 'Edit Box'}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">
                          {formMode === 'create' ? 'Enter details for the new box' : 'Update box details'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFormModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                {/* Modal Content with Scroll */}
                <div className="relative px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Box Number <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="boxNumber"
                          value={formData.boxNumber}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm ${formErrors.boxNumber ? 'border-red-500' : ''}`}
                        />
                        {formErrors.boxNumber && <p className="text-xs text-red-500 mt-1">{formErrors.boxNumber}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description <span className="text-red-500">*</span></label>
                        <select
                          name="descriptionOfGoods"
                          value={formData.descriptionOfGoods}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm ${formErrors.descriptionOfGoods ? 'border-red-500' : ''}`}
                        >
                          <option value="">Select Description</option>
                          {availableDescriptions.map(desc => (
                            <option key={desc} value={desc}>{desc}</option>
                          ))}
                        </select>
                        {formErrors.descriptionOfGoods && <p className="text-xs text-red-500 mt-1">{formErrors.descriptionOfGoods}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Gross Weight (kg) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          name="grossWeight"
                          value={formData.grossWeight}
                          onChange={handleChange}
                          step="0.01"
                          className={`w-full px-4 py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm ${formErrors.grossWeight ? 'border-red-500' : ''}`}
                        />
                        {formErrors.grossWeight && <p className="text-xs text-red-500 mt-1">{formErrors.grossWeight}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tare Weight (kg) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          name="tareWeight"
                          value={formData.tareWeight}
                          onChange={handleChange}
                          step="0.01"
                          className={`w-full px-4 py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm ${formErrors.tareWeight ? 'border-red-500' : ''}`}
                        />
                        {formErrors.tareWeight && <p className="text-xs text-red-500 mt-1">{formErrors.tareWeight}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Net Weight (kg)</label>
                        <input
                          type="text"
                          value={formData.netWeight}
                          readOnly
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-slate-50 text-sm text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Cops <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          name="cops"
                          value={formData.cops}
                          onChange={handleChange}
                          step="1"
                          className={`w-full px-4 py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm ${formErrors.cops ? 'border-red-500' : ''}`}
                        />
                        {formErrors.cops && <p className="text-xs text-red-500 mt-1">{formErrors.cops}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Grade</label>
                        <input
                          type="text"
                          name="grade"
                          value={formData.grade}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-200 text-black rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all bg-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button
                        type="button"
                        onClick={() => setShowFormModal(false)}
                        className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center space-x-2 mr-3"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>{isLoading ? 'Processing...' : (formMode === 'create' ? 'Create Box' : 'Update Box')}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Floating Action Button */}
        {window.innerWidth < 1080 && (
          <motion.button
            onClick={() => {
              setFormMode('create');
              setShowFormModal(true);
            }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <PlusIcon className="h-6 w-6" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Reusable StatCard Component
const StatCard = ({ title, value, icon, gradient, bgGradient }) => (
  <motion.div
    className={`relative p-4 bg-gradient-to-br ${bgGradient} rounded-xl shadow-lg border border-slate-200/50 overflow-hidden group`}
    whileHover={{ y: -2 }}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-lg`}>{icon}</div>
        <TrendingUp className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors duration-300" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{title}</p>
      </div>
    </div>
  </motion.div>
);

export default BoxListPage;