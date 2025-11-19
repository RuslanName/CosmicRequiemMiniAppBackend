export interface ClanWar {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  clan_1_id: number;
  clan_2_id: number;
  clan_1?: any;
  clan_2?: any;
}

export interface UpdateClanWarDto {
  clan_1_id?: number;
  clan_2_id?: number;
  start_time?: string;
  end_time?: string;
  status?: string;
}

