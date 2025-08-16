// import axios from 'axios';
// import AuthService from './AuthService';

// const API_URL = import.meta.env.VITE_API_BASE_URL + '/boxes/';

// const getAuthHeaders = () => {
//   const user = AuthService.getCurrentUser();
//   if (user && user.token) {
//     return { Authorization: 'Bearer ' + user.token };
//   } else {
//     console.error("User token not found for box service.");
//     return {};
//   }
// };

// const createBox = (boxData) => {
//   return axios.post(API_URL, boxData, { headers: getAuthHeaders() });
// };

// const getAllBoxes = (params = {}) => {
//   return axios.get(API_URL, {
//     headers: getAuthHeaders(),
//     params: params
//   });
// };

// const getBoxById = (id) => {
//   return axios.get(API_URL + id, { headers: getAuthHeaders() });
// };

// const updateBox = (id, boxData) => {
//   return axios.put(API_URL + id, boxData, { headers: getAuthHeaders() });
// };

// const deleteBox = (id) => {
//   return axios.delete(API_URL + id, { headers: getAuthHeaders() });
// };

// const getAvailableBoxes = (descriptionOfGoods) => {
//   const cleanedDescription = descriptionOfGoods
//     .trim()
//     .replace(/\s+/g, ' '); 
  
//   const encodedDescription = encodeURIComponent(cleanedDescription);
  
//   return axios.get(`${API_URL}available?descriptionOfGoods=${encodedDescription}`, { 
//     headers: getAuthHeaders()
//   });
// };
// export default {
//   createBox,
//   getAllBoxes,
//   getBoxById,
//   updateBox,
//   deleteBox,
//   getAvailableBoxes,
// };



import axios from 'axios';
import AuthService from './AuthService';

const API_URL = import.meta.env.VITE_API_BASE_URL + '/boxes/';

const getAuthHeaders = () => {
  const user = AuthService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    console.error("User token not found for box service.");
    return {};
  }
};

const createBox = (boxData) => {
  return axios.post(API_URL, boxData, { headers: getAuthHeaders() });
};

const getAllBoxes = (params = {}) => {
  return axios.get(API_URL, {
    headers: getAuthHeaders(),
    params: params
  });
};

const getBoxById = (id) => {
  return axios.get(API_URL + id, { headers: getAuthHeaders() });
};

const updateBox = (id, boxData) => {
  return axios.put(API_URL + id, boxData, { headers: getAuthHeaders() });
};

const deleteBox = (id) => {
  return axios.delete(API_URL + id, { headers: getAuthHeaders() });
};

const getAvailableBoxes = (descriptionOfGoods) => {
  const cleanedDescription = descriptionOfGoods
    .trim()
    .replace(/\s+/g, ' '); 
  
  const encodedDescription = encodeURIComponent(cleanedDescription);
  
  return axios.get(`${API_URL}available?descriptionOfGoods=${encodedDescription}`, { 
    headers: getAuthHeaders()
  });
};

export default {
  createBox,
  getAllBoxes,
  getBoxById,
  updateBox,
  deleteBox,
  getAvailableBoxes,
};