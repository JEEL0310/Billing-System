import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import BoxService from '../../services/BoxService';

const BoxDetailPage = () => {
  const { id } = useParams();
  const [box, setBox] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBox = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await BoxService.getBoxById(id);
        setBox(response.data);
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to fetch box details.';
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBox();
  }, [id]);

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading box details...
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-red-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Error: {error}
      </motion.div>
    );
  }

  if (!box) {
    return (
      <motion.div
        className="container mx-auto p-8 text-center text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Box not found.
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
          Box Details
        </motion.h1>
      </div>

      <motion.div
        className="bg-white shadow-lg rounded-xl p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Box Number</p>
                <p className="text-base text-gray-800 mt-1">{box.boxNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-base text-gray-800 mt-1">{box.descriptionOfGoods}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${box.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {box.isUsed ? 'Used' : 'Available'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weight Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Gross Weight</p>
                <p className="text-base text-gray-800 mt-1">{box.grossWeight.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tare Weight</p>
                <p className="text-base text-gray-800 mt-1">{box.tareWeight.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Net Weight</p>
                <p className="text-base text-gray-800 mt-1">{box.netWeight.toFixed(2)} kg</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Cops</p>
                <p className="text-base text-gray-800 mt-1">{box.cops}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Grade</p>
                <p className="text-base text-gray-800 mt-1">{box.grade || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="text-base text-gray-800 mt-1">
                  {new Date(box.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-base text-gray-800 mt-1">
                  {new Date(box.updatedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Link
            to={`/boxes/edit/${box._id}`}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
          >
            Edit Box
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BoxDetailPage;