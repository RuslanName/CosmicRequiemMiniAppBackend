import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

export const getAllowedOrigins = (): string[] => {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((h) => h.trim())
    : [];
};

export const setupCors = (app: INestApplication): void => {
  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};
