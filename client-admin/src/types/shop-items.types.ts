export interface ShopItem {
  id: number;
  name: string;
  currency: string;
  price: number;
  image_path: string;
  status: string;
  item_template_id: number;
  item_template?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateShopItemDto {
  name: string;
  currency: string;
  price: number;
  status?: string;
  item_template_id: number;
}

export interface UpdateShopItemDto {
  name?: string;
  currency?: string;
  price?: number;
  status?: string;
  item_template_id?: number;
  image_path?: string;
}

