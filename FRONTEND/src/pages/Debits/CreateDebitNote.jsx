import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BillService from '../../services/BillService';
import DebitService from '../../services/DebitService';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const CreateDebitNote = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bill, setBill] = useState(null);
  const [lateDays, setLateDays] = useState(0);
  const [debitNoteData, setDebitNoteData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    overrideInterestRate: 1.5, // Monthly rate in percentage
    overrideCgstPercentage: 6,
    overrideSgstPercentage: 6,
    overrideTdsPercentage: 1,
  });

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const billResponse = await BillService.getBillById(billId);
        setBill(billResponse.data);
        
        const canHaveDebitNote = await DebitService.checkBillCanHaveDebitNote(billId);
        if (!canHaveDebitNote.data.canHaveDebitNote) {
          setError(canHaveDebitNote.data.reason || 'Cannot create debit note for this bill');
          navigate('/bills');
          return;
        }

        // Calculate initial late days
        calculateLateDays(new Date().toISOString().split('T')[0], billResponse.data);
      } catch (error) {
        setError(error.response?.data?.message || error.message || 'Failed to fetch bill details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBill();
  }, [billId, navigate]);

  const calculateLateDays = (paymentDate, billData) => {
    if (!billData) return;
    
    const dueDate = new Date(billData.billDate);
    dueDate.setDate(dueDate.getDate() + (billData.creditPeriod || 30));
    
    const paymentDateObj = new Date(paymentDate);
    const days = Math.max(0, Math.ceil((paymentDateObj - dueDate) / (1000 * 60 * 60 * 24)));
    setLateDays(days);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name.includes('Percentage') || name === 'overrideInterestRate' 
      ? parseFloat(value) 
      : value;

    const updatedData = {
      ...debitNoteData,
      [name]: newValue
    };

    setDebitNoteData(updatedData);

    // Recalculate late days when payment date changes
    if (name === 'paymentDate') {
      calculateLateDays(value, bill);
    }
  };

  const calculateEstimatedInterest = () => {
    if (!bill || lateDays <= 0) return 0;
    const dailyRate = debitNoteData.overrideInterestRate / 30 / 100; // Convert monthly % to daily decimal
    return bill.totalAmount * dailyRate * lateDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert monthly rate to daily decimal for backend
      const payload = {
        originalBillId: billId,
        ...debitNoteData,
        overrideInterestRate: debitNoteData.overrideInterestRate // Keep as monthly percentage
      };

      const response = await DebitService.createDebitNote(payload);
      
      setSuccess('Debit note created successfully!');
      setTimeout(() => {
        navigate(`/debit-notes/${response.data._id}`);
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to create debit note');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  const estimatedInterest = calculateEstimatedInterest();
  const estimatedTotal = estimatedInterest + 
                        (estimatedInterest * debitNoteData.overrideCgstPercentage / 100) + 
                        (estimatedInterest * debitNoteData.overrideSgstPercentage / 100);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Create Debit Note for Bill #{bill?.billNumber}</h1>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          <CheckCircleIcon className="h-5 w-5 inline mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Original Bill Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Bill Number:</span> {bill?.billNumber}</p>
              <p><span className="font-medium">Bill Date:</span> {new Date(bill?.billDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Due Date:</span> {new Date(new Date(bill?.billDate).setDate(new Date(bill?.billDate).getDate() + (bill?.creditPeriod || 30))).toLocaleDateString()}</p>
              <p><span className="font-medium">Total Amount:</span> ₹{bill?.totalAmount?.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Late Payment Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Late Days:</span> {lateDays}</p>
              <p><span className="font-medium">Interest Rate:</span> {debitNoteData.overrideInterestRate}% per month ({(debitNoteData.overrideInterestRate / 30).toFixed(4)}% per day)</p>
              <p><span className="font-medium">Estimated Interest:</span> ₹{estimatedInterest.toFixed(2)}</p>
              <p><span className="font-medium">Estimated Total:</span> ₹{estimatedTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                name="paymentDate"
                value={debitNoteData.paymentDate}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="form-group">
              <label>Monthly Interest Rate (%)</label>
              <input
                type="number"
                name="overrideInterestRate"
                value={debitNoteData.overrideInterestRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="form-group">
              <label>CGST Percentage</label>
              <input
                type="number"
                name="overrideCgstPercentage"
                value={debitNoteData.overrideCgstPercentage}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="form-group">
              <label>SGST Percentage</label>
              <input
                type="number"
                name="overrideSgstPercentage"
                value={debitNoteData.overrideSgstPercentage}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="form-group">
              <label>TDS Percentage</label>
              <input
                type="number"
                name="overrideTdsPercentage"
                value={debitNoteData.overrideTdsPercentage}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Debit Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDebitNote;