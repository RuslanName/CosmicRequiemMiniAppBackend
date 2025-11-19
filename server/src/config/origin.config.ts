import { INestApplication } from '@nestjs/common';
import { ENV } from './constants';

export const getAllowedOrigins = (): string[] => {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((h) => h.trim())
    : [];
};

export const setupCors = (app: INestApplication): void => {
  app.enableCors({
    origin: ENV.ALLOWED_ORIGINS.length > 0 ? ENV.ALLOWED_ORIGINS : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  });
};
