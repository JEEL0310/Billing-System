import axios from 'axios';
import AuthService from './AuthService';

const API_URL = import.meta.env.VITE_API_BASE_URL + '/bills/';
// const CHALLAN_API_URL = import.meta.env.VITE_API_BASE_URL + '/challans/';

const getAuthHeaders = () => {
  const user = AuthService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    console.error("User token not found for bill service.");
    return {};
  }
};

// Basic CRUD operations
const createBill = (billData) => {
  return axios.post(API_URL, billData, { headers: getAuthHeaders() });
};

const getAllBills = (params = {}) => {
  return axios.get(API_URL, { headers: getAuthHeaders(), params });
};

const getBillById = (id) => {
  return axios.get(API_URL + id, { headers: getAuthHeaders() });
};

const updateBill = (id, billData) => {
  return axios.put(API_URL + id, billData, { headers: getAuthHeaders() });
};

const deleteBill = (id) => {
  return axios.delete(API_URL + id, { headers: getAuthHeaders() });
};

// Single bill downloads
const downloadBillExcel = (id) => {
  return axios.get(API_URL + id + '/excel', {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
};

const downloadBillPdf = (id) => {
  return axios.get(API_URL + id + '/pdf', {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
};

// Bulk download operations
const downloadBulkExcel = (filters = {}) => {
  return axios.get(API_URL + 'download/excel', {
    headers: getAuthHeaders(),
    params: filters,
    responseType: 'blob',
  });
};

const downloadBulkPdf = (filters = {}) => {
  return axios.get(API_URL + 'download/pdf', {
    headers: getAuthHeaders(),
    params: filters,
    responseType: 'blob',
  });
};

// Get available challans for a company
const getAvailableChallans = (companyId) => {
  return axios.get(API_URL + 'available-challans/' + companyId, {
    headers: getAuthHeaders(),
  });
};

// Helper function to trigger file download
const triggerDownload = (blobData, fileName) => {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const BillService = {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
  downloadBillExcel,
  downloadBillPdf,
  downloadBulkExcel,
  downloadBulkPdf,
  triggerDownload,
  getAvailableChallans,
};

export default BillService;