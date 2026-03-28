import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach JWT token to every request if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('fw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors so callers always get a plain error message string
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.errors?.[0]?.msg ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  },
);

export default client;
