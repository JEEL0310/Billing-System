import axios from 'axios';
import AuthService from './AuthService';

const API_URL = import.meta.env.VITE_API_BASE_URL + '/dashboard/';

const getAuthHeaders = () => {
  const user = AuthService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    console.error("User token not found for dashboard service.");
    return {};
  }
};

const getOverdueBills = () => {
  return axios.get(API_URL + 'overdue-bills', { headers: getAuthHeaders() });
};

const getOverduePurchases = () => {
  return axios.get(API_URL + 'overdue-purchases', { headers: getAuthHeaders() });
};

const getAccountSummary = () => {
  return axios.get(API_URL + 'account-summary', { headers: getAuthHeaders() });
};

const getMonthlyTransactionSummary = () => {
  return axios.get(API_URL + 'monthly-transaction-summary', { headers: getAuthHeaders() });
};

const getMonthlyMaterialFlowSummary = () => {
  return axios.get(API_URL + 'monthly-material-flow', { headers: getAuthHeaders() });
};

const getUpcomingBillDues = () => {
  return axios.get(API_URL + 'upcoming-bill-dues', { headers: getAuthHeaders() });
};

const getUpcomingPurchaseDues = () => {
  return axios.get(API_URL + 'upcoming-purchase-dues', { headers: getAuthHeaders() });
};

const DashboardService = {
  getOverdueBills,
  getOverduePurchases,
  getAccountSummary,
  getMonthlyTransactionSummary,
  getMonthlyMaterialFlowSummary,
  getUpcomingBillDues,    // Added
  getUpcomingPurchaseDues, // Added
};

export default DashboardService;