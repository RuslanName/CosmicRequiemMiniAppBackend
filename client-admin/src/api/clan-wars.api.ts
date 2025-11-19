import api from './api';
import type { PaginationParams, PaginatedResponse, ClanWar, UpdateClanWarDto } from '../types';

export type { ClanWar, UpdateClanWarDto };

export const clanWarsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<ClanWar>> => {
    const response = await api.get('/wars', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ClanWar> => {
    const response = await api.get(`/wars/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateClanWarDto): Promise<ClanWar> => {
    const response = await api.patch(`/wars/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/wars/${id}`);
  },
};

