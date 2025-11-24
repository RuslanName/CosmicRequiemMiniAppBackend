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

  create: async (data: CreateItemTemplateDto, image?: File): Promise<ItemTemplate> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.type) formData.append('type', data.type);
    if (data.value) formData.append('value', data.value);
    if (image) {
      formData.append('image', image);
    }
    const response = await api.post('/item-templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateItemTemplateDto, image?: File): Promise<ItemTemplate> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.type) formData.append('type', data.type);
    if (data.value !== undefined) formData.append('value', data.value || '');
    if (data.image_path) formData.append('image_path', data.image_path);
    if (image) {
      formData.append('image', image);
    }
    const response = await api.patch(`/item-templates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/item-templates/${id}`);
  },
};
