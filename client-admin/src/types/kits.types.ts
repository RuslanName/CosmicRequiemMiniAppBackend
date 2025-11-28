export interface Kit {
  id: number;
  name: string;
  currency: string;
  price: number;
  money: number;
  status: string;
  item_templates?: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateKitDto {
  name: string;
  currency: string;
  price: number;
  money?: number;
  status?: string;
  item_template_ids: number[];
}

export interface UpdateKitDto {
  name?: string;
  currency?: string;
  price?: number;
  money?: number;
  status?: string;
  item_template_ids?: number[];
}

