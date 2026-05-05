// =============================================================================
// PRODUCT QUERY & INPUT TYPES (Request dari Client)
// =============================================================================

// Parameter untuk filter list produk publik (berdasarkan toko, search, kategori)
export interface ProductQuery {
  storeId: string;
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
}

// Input untuk membuat produk baru (Admin)
export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  storeId: string;
}

// Input untuk memperbarui data produk (Admin)
export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isActive?: boolean;
}

// =============================================================================
// PRODUCT RETURN SHAPES (Response ke Client)
// =============================================================================

// Informasi diskon yang sedang aktif untuk produk tersebut
export interface DiscountInfo {
  type: string;
  value: number;
  minSpend: number | null;
  maxDiscount: number | null;
  buyQty: number | null;
  freeQty: number | null;
}

// Informasi stok produk di toko tertentu
export interface InventoryInfo {
  quantity: number;
  storeId: string;
}

// Struktur data produk untuk tampilan LIST (Katalog)
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  category: string;
  categoryId: string;
  image: string | null; // Thumbnail utama
  discount: DiscountInfo | null;
  inventory: InventoryInfo;
}

// Struktur data produk untuk tampilan DETAIL (Halaman Produk)
export interface ProductDetailItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: string;
  categoryId: string;
  images: { id: string; url: string }[]; // Semua foto produk
  discount: DiscountInfo | null;
  inventory: InventoryInfo;
}

// =============================================================================
// SHARED TYPES
// =============================================================================

// Metadata standar untuk semua fitur yang menggunakan pagination
export interface PaginationMeta {
  total: number;     // Total record keseluruhan
  page: number;      // Halaman saat ini
  limit: number;     // Jumlah data per halaman
  totalPage: number; // Total jumlah halaman
  hasMore: boolean;  // Apakah masih ada halaman selanjutnya?
}
