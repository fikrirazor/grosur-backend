export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  storeId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isActive?: boolean;
}

export interface ProductQuery {
  storeId: string;
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
}