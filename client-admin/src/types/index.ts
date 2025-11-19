export * from './users.types';
export * from './user-guards.types';
export * from './clans.types';
export * from './clan-wars.types';
export * from './accessories.types';
export * from './kits.types';
export * from './admins.types';
export * from './settings.types';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

