export interface Product {
  id: number;
  name: string;
  type: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDto {
  name: string;
  type: string;
  value: string;
}

export interface UpdateProductDto {
  name?: string;
  type?: string;
  value?: string;
}

