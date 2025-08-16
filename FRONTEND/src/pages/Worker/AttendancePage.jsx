import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WorkerService from '../../services/WorkerService';
import AttendanceService from '../../services/AttendanceService';

const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('day');
  const [workers, setWorkers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const attendanceStatuses = ['Present', 'Absent', 'Half Day', 'Leave'];
  const shifts = ['day', 'night'];

  const fetchDataForDate = useCallback(async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Fetch active workers
      const workerRes = await WorkerService.getAllWorkers({ active: true });
      setWorkers(workerRes.data || []);

      // Fetch attendance records
      const attendanceRes = await AttendanceService.getAttendanceRecords({ 
        specificDate: selectedDate,
        shift: selectedShift
      });
      
      const recordsMap = {};
      (attendanceRes.data || []).forEach(record => {
        if (record.worker && record.worker._id) {
          recordsMap[record.worker._id] = {
            status: record.shifts?.[selectedShift]?.status || '',
            notes: record.shifts?.[selectedShift]?.notes || ''
          };
        }
      });
      setAttendanceRecords(recordsMap);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch data.';
      setError(errMsg);
      console.error("Error fetching attendance data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedShift]);

  useEffect(() => {
    fetchDataForDate();
  }, [fetchDataForDate]);

  const handleStatusChange = (workerId, field, value) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [workerId]: {
        ...(prev[workerId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveAttendance = async () => {
    if (Object.keys(attendanceRecords).length === 0 && workers.length > 0) {
      setError("No attendance changes to save. Mark attendance for at least one worker.");
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    const dataToSave = workers
      .filter(worker => attendanceRecords[worker._id]?.status)
      .map(worker => ({
        workerId: worker._id,
        status: attendanceRecords[worker._id].status,
        notes: attendanceRecords[worker._id].notes || '',
        shift: selectedShift
      }));

    if (dataToSave.length === 0) {
      setError("No attendance marked to save.");
      setIsSaving(false);
      return;
    }

    try {
      await AttendanceService.recordBulkAttendance({ 
        date: selectedDate, 
        shift: selectedShift,
        attendanceData: dataToSave 
      });
      setSuccessMessage('Attendance saved successfully!');
      fetchDataForDate(); // Refresh data after save
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to save attendance.';
      setError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="container mx-auto p-6 md:p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <motion.h1
          className="text-3xl sm:text-4xl font-extrabold text-gray-800"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Mark Attendance
        </motion.h1>
        <div className="flex items-center gap-4">
          <Link
            to="/attendance/report"
            className="text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
          >
            View Reports →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {shifts.map(shift => (
              <option key={shift} value={shift}>
                {shift === 'day' ? 'Day Shift' : 'Night Shift'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={fetchDataForDate}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load Data
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg"
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
            className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <motion.p
          className="text-center text-gray-600 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Loading workers and attendance...
        </motion.p>
      )}

      {!isLoading && workers.length === 0 && !error && (
        <motion.p
          className="text-center text-gray-600 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          No active workers found.
        </motion.p>
      )}

      {!isLoading && workers.length > 0 && (
        <>
          <motion.div
            className="bg-white shadow-lg rounded-xl overflow-hidden mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workers.map((worker) => (
                    <motion.tr
                      key={worker._id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {worker.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {worker.workerId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={attendanceRecords[worker._id]?.status || ''}
                          onChange={(e) => handleStatusChange(worker._id, 'status', e.target.value)}
                          className="block w-full max-w-xs p-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                        >
                          <option value="">Select Status</option>
                          {attendanceStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="text"
                          value={attendanceRecords[worker._id]?.notes || ''}
                          onChange={(e) => handleStatusChange(worker._id, 'notes', e.target.value)}
                          placeholder="Notes"
                          className="block w-full max-w-xs p-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                        />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          <motion.div
            className="flex justify-end gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <motion.button
              onClick={() => {
                const newRecords = {};
                workers.forEach(worker => {
                  newRecords[worker._id] = { status: 'Present', notes: '' };
                });
                setAttendanceRecords(newRecords);
              }}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mark All Present
            </motion.button>
            <motion.button
              onClick={handleSaveAttendance}
              disabled={isSaving || isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </motion.button>
          </motion.div>
        </>
      )}

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Back to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default AttendancePage;