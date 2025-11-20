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

  create: async (data: CreateKitDto, image?: File): Promise<Kit> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.currency) formData.append('currency', data.currency);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.status) formData.append('status', data.status);
    if (data.item_template_ids && data.item_template_ids.length > 0) {
      data.item_template_ids.forEach(id => formData.append('item_template_ids[]', id.toString()));
    }
    if (image) {
      formData.append('image', image);
    }
    const response = await api.post('/kits', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateKitDto, image?: File): Promise<Kit> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.currency) formData.append('currency', data.currency);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.status) formData.append('status', data.status);
    if (data.image_path) formData.append('image_path', data.image_path);
    if (data.item_template_ids && data.item_template_ids.length > 0) {
      data.item_template_ids.forEach(id => formData.append('item_template_ids[]', id.toString()));
    }
    if (image) {
      formData.append('image', image);
    }
    const response = await api.patch(`/kits/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/kits/${id}`);
  },
};

