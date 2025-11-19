export interface Clan {
  id: number;
  name: string;
  max_members: number;
  image_path: string;
  status: string;
  created_at: string;
  updated_at: string;
  leader_id?: number;
  leader?: any;
  members?: any[];
}

export interface CreateClanDto {
  name: string;
  max_members?: number;
  leader_id: number;
  member_ids?: number[];
  war_ids?: number[];
  status?: string;
}

export interface UpdateClanDto {
  name?: string;
  max_members?: number;
  leader_id?: number;
  member_ids?: number[];
  war_ids?: number[];
  image_path?: string;
  status?: string;
}

