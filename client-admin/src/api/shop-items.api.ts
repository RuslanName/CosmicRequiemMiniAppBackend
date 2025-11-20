import api from './api';
import type { PaginationParams, PaginatedResponse, ShopItem, CreateShopItemDto, UpdateShopItemDto } from '../types';

export type { ShopItem, CreateShopItemDto, UpdateShopItemDto };

export const shopItemsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<ShopItem>> => {
    const response = await api.get('/shop-items', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ShopItem> => {
    const response = await api.get(`/shop-items/${id}`);
    return response.data;
  },

  create: async (data: CreateShopItemDto, image?: File): Promise<ShopItem> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.currency) formData.append('currency', data.currency);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.status) formData.append('status', data.status);
    if (data.item_template_id) formData.append('item_template_id', data.item_template_id.toString());
    if (image) {
      formData.append('image', image);
    }
    const response = await api.post('/shop-items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateShopItemDto, image?: File): Promise<ShopItem> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.currency) formData.append('currency', data.currency);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.status) formData.append('status', data.status);
    if (data.item_template_id !== undefined) formData.append('item_template_id', data.item_template_id.toString());
    if (data.image_path) formData.append('image_path', data.image_path);
    if (image) {
      formData.append('image', image);
    }
    const response = await api.patch(`/shop-items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/shop-items/${id}`);
  },
};

