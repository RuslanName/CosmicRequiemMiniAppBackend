export interface Setting {
  id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingDto {
  key?: string;
  value?: string;
}

