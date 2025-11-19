import api from './api';
import type { PaginationParams, PaginatedResponse, Setting, UpdateSettingDto } from '../types';

export type { Setting, UpdateSettingDto };

export const settingsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Setting>> => {
    const response = await api.get('/settings', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Setting> => {
    const response = await api.get(`/settings/${id}`);
    return response.data;
  },

  getByKey: async (key: string): Promise<Setting | null> => {
    const response = await api.get(`/settings/key/${key}`);
    return response.data;
  },

  update: async (id: number, data: UpdateSettingDto): Promise<Setting> => {
    const response = await api.patch(`/settings/${id}`, data);
    return response.data;
  },
};

