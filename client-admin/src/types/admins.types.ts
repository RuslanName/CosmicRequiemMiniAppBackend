export interface Admin {
  id: number;
  user_id: number;
  username: string;
  password_hash: string;
  is_system_admin: boolean;
  user?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminDto {
  user_id: number;
  username: string;
  password: string;
}

export interface UpdateAdminDto {
  user_id?: number;
  username?: string;
  password?: string;
}

