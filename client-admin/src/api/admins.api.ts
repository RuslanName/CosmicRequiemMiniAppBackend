import api from './api';
import type { PaginationParams, PaginatedResponse, Admin, CreateAdminDto, UpdateAdminDto } from '../types';

export type { Admin, CreateAdminDto, UpdateAdminDto };

export const adminsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Admin>> => {
    const response = await api.get('/admins', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Admin> => {
    const response = await api.get(`/admins/${id}`);
    return response.data;
  },

  create: async (data: CreateAdminDto): Promise<Admin> => {
    const response = await api.post('/admins', data);
    return response.data;
  },

  update: async (id: number, data: UpdateAdminDto): Promise<Admin> => {
    const response = await api.patch(`/admins/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admins/${id}`);
  },
};

