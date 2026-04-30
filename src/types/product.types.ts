
// untuk filter product by store
export interface ProductQuery {
  storeId: string;
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
}

// untuk tambah produk baru
export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  storeId: string;
}

// untuk update produk
export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isActive?: boolean;
}