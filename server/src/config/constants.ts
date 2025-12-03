import * as dotenv from 'dotenv';
import { getAllowedOrigins } from './origin.config';

dotenv.config();

export const ENV = {
  POSTGRES_HOST: process.env.POSTGRES_HOST!,
  POSTGRES_USERNAME: process.env.POSTGRES_USERNAME!,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
  POSTGRES_DB: process.env.POSTGRES_DB!,
  POSTGRES_SCHEMA: process.env.POSTGRES_SCHEMA || 'public',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  VK_APP_SECRET: process.env.VK_APP_SECRET!,
  VK_APP_URL: process.env.VK_APP_URL!,
  VK_SERVICE_TOKEN: process.env.VK_SERVICE_TOKEN || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    (process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!) + '_refresh',
  JWT_ADMIN_ACCESS_SECRET:
    process.env.JWT_ADMIN_ACCESS_SECRET ||
    process.env.JWT_ADMIN_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET!,
  JWT_ADMIN_REFRESH_SECRET:
    process.env.JWT_ADMIN_REFRESH_SECRET ||
    (process.env.JWT_ADMIN_ACCESS_SECRET ||
      process.env.JWT_ADMIN_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET!) + '_admin_refresh',
  JWT_ACCESS_EXPIRES_IN: String(process.env.JWT_ACCESS_EXPIRES_IN || '15m'),
  JWT_REFRESH_EXPIRES_IN: String(process.env.JWT_REFRESH_EXPIRES_IN || '30d'),
  JWT_ADMIN_ACCESS_EXPIRES_IN: String(
    process.env.JWT_ADMIN_ACCESS_EXPIRES_IN || '15m',
  ),
  JWT_ADMIN_REFRESH_EXPIRES_IN: String(
    process.env.JWT_ADMIN_REFRESH_EXPIRES_IN || '30d',
  ),
  ADMIN_VK_ID: process.env.ADMIN_VK_ID || '',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || '',
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || '',
  PORT: process.env.PORT || '5000',
  MODE: process.env.MODE || 'dev',
  CLUSTER_ENABLED: process.env.CLUSTER_ENABLED !== 'false',
  CLUSTER_WORKERS: process.env.CLUSTER_WORKERS || undefined,
  VERIFY_VK_SIGNATURE: process.env.VERIFY_VK_SIGNATURE !== 'false',
  ALLOWED_ORIGINS: getAllowedOrigins(),
  THROTTLER_TTL: Number(process.env.THROTTLER_TTL || 30000),
  THROTTLER_LIMIT: Number(process.env.THROTTLER_LIMIT || 60),
  POSTGRES_POOL_MAX: Number(process.env.POSTGRES_POOL_MAX || 20),
  POSTGRES_POOL_MIN: Number(process.env.POSTGRES_POOL_MIN || 5),
  POSTGRES_POOL_IDLE_TIMEOUT: Number(
    process.env.POSTGRES_POOL_IDLE_TIMEOUT || 30000,
  ),
  POSTGRES_POOL_CONNECTION_TIMEOUT: Number(
    process.env.POSTGRES_POOL_CONNECTION_TIMEOUT || 5000,
  ),
};
