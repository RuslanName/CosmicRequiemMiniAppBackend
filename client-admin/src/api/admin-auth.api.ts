import api from './api';

export interface AdminLoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export const adminAuthApi = {
  login: async (data: AdminLoginDto): Promise<LoginResponse> => {
    const response = await api.post('/auth/admin/login', data);
    return response.data;
  },

  logout: async (): Promise<LoginResponse> => {
    const response = await api.post('/auth/admin/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/admins/me');
    return response.data;
  },
};

