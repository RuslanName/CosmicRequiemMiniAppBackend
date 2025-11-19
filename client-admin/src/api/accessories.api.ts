import api from './api';
import type { PaginationParams, PaginatedResponse, Accessory, CreateAccessoryDto, UpdateAccessoryDto } from '../types';

export type { Accessory, CreateAccessoryDto, UpdateAccessoryDto };

export const accessoriesApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Accessory>> => {
    const response = await api.get('/accessories', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Accessory> => {
    const response = await api.get(`/accessories/${id}`);
    return response.data;
  },

  create: async (data: CreateAccessoryDto): Promise<Accessory> => {
    const response = await api.post('/accessories', data);
    return response.data;
  },

  update: async (id: number, data: UpdateAccessoryDto): Promise<Accessory> => {
    const response = await api.patch(`/accessories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/accessories/${id}`);
  },
};

