import api from './api';
import type { PaginationParams, PaginatedResponse, Clan, CreateClanDto, UpdateClanDto } from '../types';

export type { Clan, CreateClanDto, UpdateClanDto };

export const clansApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Clan>> => {
    const response = await api.get('/clans', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Clan> => {
    const response = await api.get(`/clans/${id}`);
    return response.data;
  },

  create: async (data: CreateClanDto, image?: File): Promise<Clan> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.max_members !== undefined) formData.append('max_members', data.max_members.toString());
    if (data.leader_id) formData.append('leader_id', data.leader_id.toString());
    if (data.status) formData.append('status', data.status);
    if (data.member_ids && data.member_ids.length > 0) {
      data.member_ids.forEach(id => formData.append('member_ids[]', id.toString()));
    }
    if (data.war_ids && data.war_ids.length > 0) {
      data.war_ids.forEach(id => formData.append('war_ids[]', id.toString()));
    }
    if (image) {
      formData.append('image', image);
    }
    const response = await api.post('/clans', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateClanDto, image?: File): Promise<Clan> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.max_members !== undefined) formData.append('max_members', data.max_members.toString());
    if (data.leader_id !== undefined) formData.append('leader_id', data.leader_id.toString());
    if (data.status) formData.append('status', data.status);
    if (data.image_path) formData.append('image_path', data.image_path);
    if (data.member_ids && data.member_ids.length > 0) {
      data.member_ids.forEach(id => formData.append('member_ids[]', id.toString()));
    }
    if (data.war_ids && data.war_ids.length > 0) {
      data.war_ids.forEach(id => formData.append('war_ids[]', id.toString()));
    }
    if (image) {
      formData.append('image', image);
    }
    const response = await api.patch(`/clans/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clans/${id}`);
  },
};

