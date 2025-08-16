import axios from 'axios';
import AuthService from './AuthService';

const API_URL = import.meta.env.VITE_API_BASE_URL + '/debit-notes/';

const getAuthHeaders = () => {
  const user = AuthService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    console.error("User token not found for debit note service.");
    throw new Error('User not authenticated');
  }
};

const createManualDebitNote = async (debitNoteData) => {
  try {
    return await axios.post(`${API_URL}manual`, debitNoteData, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create manual debit note');
  }
};

const getEligibleBillsForManualDebitNote = async () => {
  try {
    return await axios.get(`${API_URL}manual/eligible-bills`, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch eligible bills for manual debit note');
  }
};

const createDebitNote = async (debitNoteData) => {
  try {
    return await axios.post(API_URL, debitNoteData, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create debit note');
  }
};

const getAllDebitNotes = async (params = {}) => {
  try {
    return await axios.get(API_URL, { headers: getAuthHeaders(), params });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch debit notes');
  }
};

const getDebitNoteById = async (id) => {
  try {
    return await axios.get(`${API_URL}${id}`, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch debit note');
  }
};

const updateDebitNote = async (id, debitNoteData) => {
  try {
    return await axios.put(`${API_URL}${id}`, debitNoteData, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update debit note');
  }
};

const deleteDebitNote = async (id) => {
  try {
    return await axios.delete(`${API_URL}${id}`, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete debit note');
  }
};

const downloadDebitNoteExcel = async (id) => {
  try {
    const response = await axios.get(`${API_URL}${id}/excel`, {
      headers: getAuthHeaders(),
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to download Excel file');
  }
};

const downloadDebitNotePdf = async (id) => {
  try {
    const response = await axios.get(`${API_URL}${id}/pdf`, {
      headers: getAuthHeaders(),
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to download PDF file');
  }
};

const getDebitNotesForBill = async (billId) => {
  try {
    return await axios.get(`${API_URL}bills/${billId}/debit-notes`, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch debit notes for bill');
  }
};

const checkBillCanHaveDebitNote = async (billId) => {
  try {
    return await axios.get(`${API_URL}bills/${billId}/can-have-debit-note`, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to check if bill can have debit note');
  }
};

const downloadDebitNotesExcel = async () => {
  try {
    return await axios.get(`${API_URL}download/excel`, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to download debit notes Excel');
  }
};

const downloadDebitNotesPdf = async () => {
  try {
    return await axios.get(`${API_URL}download/pdf`, { headers: getAuthHeaders() });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to download debit notes PDF');
  }
};

const DebitService = {
  createDebitNote,
  getAllDebitNotes,
  getDebitNoteById,
  updateDebitNote,
  deleteDebitNote,
  downloadDebitNoteExcel,
  downloadDebitNotePdf,
  getDebitNotesForBill,
  checkBillCanHaveDebitNote,
  createManualDebitNote,
  getEligibleBillsForManualDebitNote,
    downloadDebitNotesExcel,
  downloadDebitNotesPdf
};

export default DebitService;