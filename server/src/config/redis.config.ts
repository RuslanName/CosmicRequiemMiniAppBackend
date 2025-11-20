import { ENV } from './constants';

export const redisConfig = {
  host: ENV.REDIS_HOST,
  port: 6379,
  password: ENV.REDIS_PASSWORD,
};
