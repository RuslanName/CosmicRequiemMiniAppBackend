import * as dotenv from 'dotenv';

dotenv.config();

export const ENV = {
    POSTGRES_HOST: process.env.POSTGRES_HOST!,
    POSTGRES_USERNAME: process.env.POSTGRES_USERNAME!,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
    POSTGRES_DB: process.env.POSTGRES_DB!,
    POSTGRES_SCHEMA: process.env.POSTGRES_SCHEMA || 'public',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
    APP_SECRET: process.env.APP_SECRET!,
    JWT_SECRET: process.env.JWT_SECRET!,
    PORT: process.env.PORT || '5000',
    MODE: process.env.MODE || 'dev',
    CLUSTER_ENABLED: process.env.CLUSTER_ENABLED !== 'false',
    CLUSTER_WORKERS: process.env.CLUSTER_WORKERS || undefined,
} as const;