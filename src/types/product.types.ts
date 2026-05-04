// ─── Query & Input ────────────────────────────────────────────────────────────

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

// ─── Return Shapes ────────────────────────────────────────────────────────────

export interface DiscountInfo {
  type: string;
  value: number;
  minSpend: number | null;
  maxDiscount: number | null;
  buyQty: number | null;
  freeQty: number | null;
}

export interface InventoryInfo {
  quantity: number;
  storeId: string;
}

// Shape item di list produk publik
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  category: string;
  categoryId: string;
  image: string | null;
  discount: DiscountInfo | null;
  inventory: InventoryInfo;
}

// Shape detail produk publik (includes all images)
export interface ProductDetailItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: string;
  categoryId: string;
  images: { id: string; url: string }[];
  discount: DiscountInfo | null;
  inventory: InventoryInfo;
}

// Pagination meta
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
  hasMore: boolean;
}
