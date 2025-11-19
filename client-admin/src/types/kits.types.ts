export interface Kit {
  id: number;
  name: string;
  currency: string;
  price: number;
  status: string;
  products?: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateKitDto {
  name: string;
  currency: string;
  price: number;
  status?: string;
  product_ids: number[];
}

export interface UpdateKitDto {
  name?: string;
  currency?: string;
  price?: number;
  status?: string;
  product_ids?: number[];
}

