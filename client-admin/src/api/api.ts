import axios from 'axios';
import { ENV } from '../config/constants';

const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const loginPath = `${ENV.BASE_URL}login`.replace(/\/+/g, '/');
      const currentPath = window.location.pathname;
      if (!currentPath.endsWith('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

