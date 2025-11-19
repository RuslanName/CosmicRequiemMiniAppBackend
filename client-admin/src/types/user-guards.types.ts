import type { User } from './users.types';

export interface UserGuard {
  id: number;
  name: string;
  strength: number;
  is_first: boolean;
  user_id: number;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateUserGuardDto {
  name: string;
  strength?: number;
  is_first?: boolean;
  user_id: number;
}

export interface UpdateUserGuardDto {
  name?: string;
  strength?: number;
  is_first?: boolean;
  user_id?: number;
}

