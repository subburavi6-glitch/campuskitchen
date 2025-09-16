import axios from 'axios';
import { showError } from './sweetAlert';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show automatic alerts - let components handle errors
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;