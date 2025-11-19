import { getAllowedHosts } from './origin.config';

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  ALLOWED_HOSTS: getAllowedHosts(import.meta.env.VITE_ALLOWED_HOSTS),
  DEV_SERVER_HOST: import.meta.env.VITE_DEV_SERVER_HOST || 'localhost',
  DEV_SERVER_PORT: import.meta.env.VITE_DEV_SERVER_PORT || '5173',
  BASE_URL: import.meta.env.BASE_URL || '/',
} as const;

