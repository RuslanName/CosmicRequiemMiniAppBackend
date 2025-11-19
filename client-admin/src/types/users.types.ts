export interface User {
  id: number;
  vk_id: number;
  first_name: string;
  last_name?: string;
  sex: number;
  avatar_url: string;
  birthday_date?: string;
  money: number;
  nickname_color?: string;
  nickname_icon?: string;
  avatar_frame?: string;
  shield_end_time?: string;
  last_shield_purchase_time?: string;
  last_training_time?: string;
  last_contract_time?: string;
  last_attack_time?: string;
  clan_leave_time?: string;
  status: string;
  registered_at: string;
  last_login_at: string;
  clan_id?: number;
  strength?: number;
  referral_link?: string;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  sex?: number;
  avatar_url?: string;
  birthday_date?: string;
  money?: number;
  shield_end_time?: string;
  last_shield_purchase_time?: string;
  last_contract_time?: string;
  clan_leave_time?: string;
  status?: string;
  last_login_at?: string;
}

