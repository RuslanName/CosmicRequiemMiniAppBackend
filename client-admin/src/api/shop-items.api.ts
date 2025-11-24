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

  create: async (data: CreateShopItemDto): Promise<ShopItem> => {
    const response = await api.post('/shop-items', data);
    return response.data;
  },

  update: async (id: number, data: UpdateShopItemDto): Promise<ShopItem> => {
    const response = await api.patch(`/shop-items/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/shop-items/${id}`);
  },
};

