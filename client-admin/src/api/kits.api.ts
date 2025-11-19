import api from './api';
import type { PaginationParams, PaginatedResponse, Kit, CreateKitDto, UpdateKitDto } from '../types';

export type { Kit, CreateKitDto, UpdateKitDto };

export const kitsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Kit>> => {
    const response = await api.get('/kits', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Kit> => {
    const response = await api.get(`/kits/${id}`);
    return response.data;
  },

  create: async (data: CreateKitDto): Promise<Kit> => {
    const response = await api.post('/kits', data);
    return response.data;
  },

  update: async (id: number, data: UpdateKitDto): Promise<Kit> => {
    const response = await api.patch(`/kits/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/kits/${id}`);
  },
};

