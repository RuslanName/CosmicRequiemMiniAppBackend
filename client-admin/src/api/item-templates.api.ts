import api from './api';
import type { PaginationParams, PaginatedResponse, ItemTemplate, CreateItemTemplateDto, UpdateItemTemplateDto } from '../types';

export type { ItemTemplate, CreateItemTemplateDto, UpdateItemTemplateDto };

export const itemTemplatesApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<ItemTemplate>> => {
    const response = await api.get('/item-templates', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ItemTemplate> => {
    const response = await api.get(`/item-templates/${id}`);
    return response.data;
  },

  create: async (data: CreateItemTemplateDto): Promise<ItemTemplate> => {
    const response = await api.post('/item-templates', data);
    return response.data;
  },

  update: async (id: number, data: UpdateItemTemplateDto): Promise<ItemTemplate> => {
    const response = await api.patch(`/item-templates/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/item-templates/${id}`);
  },
};
