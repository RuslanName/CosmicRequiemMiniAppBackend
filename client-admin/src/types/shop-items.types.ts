export interface ShopItem {
  id: number;
  name: string;
  currency: string;
  price: number;
  status: string;
  item_template_id: number;
  item_template?: ItemTemplate;
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
}

interface ItemTemplate {
  id: number;
  name: string;
  type: string;
  value: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

