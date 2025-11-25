import api from './api';
import type { PaginationParams, PaginatedResponse } from '../types';

export interface Task {
  id: number;
  description: string;
  type: string;
  value: string | null;
  money_reward: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDto {
  description: string;
  type: string;
  value?: string | null;
  money_reward: number;
}

export interface UpdateTaskDto {
  description?: string;
  type?: string;
  value?: string | null;
  money_reward?: number;
}

export const tasksApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Task>> => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id: number, data: UpdateTaskDto): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

