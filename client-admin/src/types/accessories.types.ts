export interface Accessory {
  id: number;
  name: string;
  currency: string;
  price: number;
  status: string;
  product_id: number;
  product?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateAccessoryDto {
  name: string;
  currency: string;
  price: number;
  status?: string;
  product_id: number;
}

export interface UpdateAccessoryDto {
  name?: string;
  currency?: string;
  price?: number;
  status?: string;
  product_id?: number;
}

