import api from './api';
import type { PaginationParams, PaginatedResponse, UserGuard, CreateUserGuardDto, UpdateUserGuardDto } from '../types';

export type { UserGuard, CreateUserGuardDto, UpdateUserGuardDto };

export const userGuardsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<UserGuard>> => {
    const response = await api.get('/user-guards', { params });
    return response.data;
  },

  getById: async (id: number): Promise<UserGuard> => {
    const response = await api.get(`/user-guards/${id}`);
    return response.data;
  },

  create: async (data: CreateUserGuardDto): Promise<UserGuard> => {
    const response = await api.post('/user-guards', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserGuardDto): Promise<UserGuard> => {
    const response = await api.patch(`/user-guards/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/user-guards/${id}`);
  },
};

