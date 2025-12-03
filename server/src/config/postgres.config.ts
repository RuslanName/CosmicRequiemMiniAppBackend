import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { ENV } from './constants';

const isDev = ENV.MODE === 'dev';

export const postgresConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: ENV.POSTGRES_HOST,
  port: 5432,
  username: ENV.POSTGRES_USERNAME,
  password: ENV.POSTGRES_PASSWORD,
  database: ENV.POSTGRES_DB,
  schema: ENV.POSTGRES_SCHEMA,
  entities: [join(__dirname, '..', '**', '*.entity.js')],
  synchronize: isDev,
  ssl: false,
  extra: {
    max: ENV.POSTGRES_POOL_MAX,
    min: ENV.POSTGRES_POOL_MIN,
    idleTimeoutMillis: ENV.POSTGRES_POOL_IDLE_TIMEOUT,
    connectionTimeoutMillis: ENV.POSTGRES_POOL_CONNECTION_TIMEOUT,
  },
  logging: isDev ? ['error', 'warn', 'schema'] : ['error'],
};
