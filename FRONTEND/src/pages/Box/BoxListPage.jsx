import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, PencilIcon, TrashIcon, PlusIcon, PrinterIcon } from '@heroicons/react/24/outline';
import BoxService from '../../services/BoxService';
import SettingsService from '../../services/SettingsService';

const BoxPrintModal = ({ boxes, onClose, onPrint }) => {
  const [lotNo, setLotNo] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Print Box Slips</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Enter Lot Number:</label>
          <input
            type="text"
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter lot number"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => onPrint(lotNo)}
            disabled={!lotNo}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${!lotNo ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Print
          </button>
        </div>
      </div>
    </div>
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
              <div>DENIER/FILAMENT:</div>
              <div>${box.descriptionOfGoods}</div>
              
              <div>BOX NO:</div>
              <div>${box.boxNumber}</div>
              
              <div>LOT NO:</div>
              <div>${lotNo}</div>
              
              <div>COPS:</div>
              <div>${box.cops}</div>
              
              <div>GRS WEIGHT:</div>
              <div>${box.grossWeight?.toFixed(3) || 'N/A'}</div>
              
              <div>NET WEIGHT:</div>
              <div>${box.netWeight?.toFixed(3) || 'N/A'}</div>
            </div>
          </div>
        `;
      });

      // Fill remaining slots with empty slips if needed
      const remainingSlots = slipsPerPage - pageBoxes.length;
      for (let i = 0; i < remainingSlots; i++) {
        html += `<div class="slip"></div>`;
      }

      html += `</div>`; // Close page
    }

    html += `
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <div className="fixed inset-0 bg-white p-4 z-50 overflow-auto">
      <div className="flex justify-between items-center mb-4 no-print">
        <h2 className="text-xl font-bold">Box Slips Preview</h2>
        <div className="space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Print Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 no-print">
        {boxes.map((box, index) => (
          <div key={index} className="border border-gray-300 p-4">
            <div className="text-center font-bold text-lg mb-2">MAHADEV FILAMENTS</div>
            <div className="border-t border-black mb-2"></div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>DENIER/FILAMENT:</div>
              <div className="font-medium">{box.descriptionOfGoods}</div>
              <div>BOX NO:</div>
              <div className="font-medium">{box.boxNumber}</div>
              <div>LOT NO:</div>
              <div className="font-medium">{lotNo}</div>
              <div>COPS:</div>
              <div className="font-medium">{box.cops}</div>
              <div>GRS WEIGHT:</div>
              <div className="font-medium">{box.grossWeight?.toFixed(3) || 'N/A'}</div>
              <div>NET WEIGHT:</div>
              <div className="font-medium">{box.netWeight?.toFixed(3) || 'N/A'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BoxListPage = () => {
    const navigate = useNavigate();
    const [boxes, setBoxes] = useState([]);
    const [selectedBoxes, setSelectedBoxes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableDescriptions, setAvailableDescriptions] = useState([]);
    const [filters, setFilters] = useState({
      descriptionOfGoods: '',
      isUsed: '',
      search: ''
    });
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showPrintView, setShowPrintView] = useState(false);
    const [printLotNo, setPrintLotNo] = useState('');

    const fetchBoxes = useCallback(async () => {
      setIsLoading(true);
      setError('');
      try {
        const params = {};
        if (filters.descriptionOfGoods && filters.descriptionOfGoods !== 'All Descriptions') {
          params.descriptionOfGoods = filters.descriptionOfGoods;
        }
        if (filters.isUsed !== '') {
          params.isUsed = filters.isUsed;
        }
        if (filters.search.trim()) {
          params.search = filters.search.trim();
        }

        const response = await BoxService.getAllBoxes(params);
        setBoxes(response.data);
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to fetch boxes.';
        setError(errMsg);
        setBoxes([]);
      } finally {
        setIsLoading(false);
      }
    }, [filters]);

    useEffect(() => {
      const fetchInitialData = async () => {
        try {
          const settingsRes = await SettingsService.getSettings();
          setAvailableDescriptions(settingsRes.data.itemConfigurations.map(item => item.description) || []);
        } catch (err) {
          console.error("Error fetching settings:", err);
        }
      };
      fetchInitialData();
    }, []); 
    
    useEffect(() => {
      fetchBoxes(); 
    }, [filters, fetchBoxes]); 

    const handleDeleteBox = async (boxId) => {
      if (window.confirm('Are you sure you want to delete this box? This action cannot be undone.')) {
        try {
          await BoxService.deleteBox(boxId);
          setBoxes(prev => prev.filter(box => box._id !== boxId));
          setSelectedBoxes(prev => prev.filter(id => id !== boxId));
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message || 'Failed to delete box.';
          setError(errMsg);
        }
      }
    };

    const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({
        ...prev,
        [name]: name === 'isUsed' ? (value === '' ? '' : value) : value
      }));
    };  

    const clearFilters = () => {
      setFilters({
        descriptionOfGoods: '',
        isUsed: '',
        search: ''
      });
    };

    const toggleBoxSelection = (boxId) => {
      setSelectedBoxes(prev => 
        prev.includes(boxId) 
          ? prev.filter(id => id !== boxId) 
          : [...prev, boxId]
      );
    };

    const toggleSelectAll = (e) => {
      if (e.target.checked) {
        setSelectedBoxes(boxes.map(box => box._id));
      } else {
        setSelectedBoxes([]);
      }
    };

    const handlePrintSelected = () => {
      const boxesToPrint = boxes.filter(box => selectedBoxes.includes(box._id));
      if (boxesToPrint.length === 0) {
        alert('Please select at least one box to print.');
        return;
      }
      setShowPrintModal(true);
    };

    const handlePrint = (lotNo) => {
      setPrintLotNo(lotNo);
      setShowPrintModal(false);
      setShowPrintView(true);
    };

    return (
      <motion.div
        className="container mx-auto p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {showPrintModal && (
          <BoxPrintModal 
            boxes={boxes.filter(box => selectedBoxes.includes(box._id))} 
            onClose={() => setShowPrintModal(false)}
            onPrint={handlePrint}
          />
        )}

        {showPrintView && (
          <BoxSlipPrintView 
            boxes={boxes.filter(box => selectedBoxes.includes(box._id))}
            lotNo={printLotNo}
            onClose={() => setShowPrintView(false)}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 text-center sm:text-left"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Box Management
          </motion.h1>
          <div className="flex space-x-2">
            {selectedBoxes.length > 0 && (
              <button
                onClick={handlePrintSelected}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all"
              >
                <PrinterIcon className="h-5 w-5 mr-2" />
                Print Selected ({selectedBoxes.length})
              </button>
            )}
            <Link
              to="/boxes/create"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Box
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <motion.div
          className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="descriptionOfGoods" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
              <select
                id="descriptionOfGoods"
                name="descriptionOfGoods"
                value={filters.descriptionOfGoods}
                onChange={handleFilterChange}
                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
              >
                <option value="">All Descriptions</option>
                {availableDescriptions.map(desc => (
                  <option key={desc} value={desc}>{desc}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="isUsed" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="isUsed"
                name="isUsed"
                value={filters.isUsed}
                onChange={handleFilterChange}
                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="false">Available</option>
                <option value="true">Used</option>
              </select>
            </div>

            <div>
              <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by box number..."
                className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>

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

        {isLoading && (
          <motion.div
            className="text-center py-8 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Loading boxes...
          </motion.div>
        )}

        {!isLoading && boxes.length === 0 && (
          <motion.div
            className="text-center py-8 bg-white shadow-lg rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-500">No boxes found matching your criteria.</p>
          </motion.div>
        )}

        {!isLoading && boxes.length > 0 && (
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll}
                        checked={selectedBoxes.length === boxes.length && boxes.length > 0}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Box No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cops</th>
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
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{box.boxNumber}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.descriptionOfGoods}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.netWeight?.toFixed(2) || 'N/A'} kg</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{box.cops}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${box.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {box.isUsed ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                          <motion.button
                            onClick={() => navigate(`/boxes/${box._id}`)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteBox(box._id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
};

export default BoxListPage;