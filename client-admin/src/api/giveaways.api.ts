import api from './api';

export interface Giveaway {
  id: number;
  description: string;
  url: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGiveawayDto {
  description: string;
  url: string;
  image_path?: string | null;
}

export interface UpdateGiveawayDto {
  description?: string;
  url?: string;
  image_path?: string | null;
}

export const giveawaysApi = {
  getOne: async (): Promise<Giveaway | null> => {
    const response = await api.get('/giveaways');
    return response.data;
  },

  create: async (data: CreateGiveawayDto): Promise<Giveaway> => {
    const response = await api.post('/giveaways', data);
    return response.data;
  },

  update: async (id: number, data: UpdateGiveawayDto): Promise<Giveaway> => {
    const response = await api.patch(`/giveaways/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/giveaways/${id}`);
  },
};

