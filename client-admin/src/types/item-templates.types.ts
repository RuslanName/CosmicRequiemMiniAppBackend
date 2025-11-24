export interface ItemTemplate {
  id: number;
  name: string;
  type: string;
  value: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateItemTemplateDto {
  name: string;
  type: string;
  value?: string;
}

export interface UpdateItemTemplateDto {
  name?: string;
  type?: string;
  value?: string;
  image_path?: string;
}
