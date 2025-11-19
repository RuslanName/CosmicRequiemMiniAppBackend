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
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '4h',
    JWT_ADMIN_EXPIRES_IN: process.env.JWT_ADMIN_EXPIRES_IN || '8h',
    PORT: process.env.PORT || '5000',
    MODE: process.env.MODE || 'dev',
    CLUSTER_ENABLED: process.env.CLUSTER_ENABLED !== 'false',
    CLUSTER_WORKERS: process.env.CLUSTER_WORKERS || undefined,
    ALLOWED_ORIGINS: getAllowedOrigins(),
} as const;