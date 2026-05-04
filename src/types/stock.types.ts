// =============================================================================
// STOCK SERVICE TYPES (Manajemen Stok: Update & Transfer)
// =============================================================================

// Input untuk update stock manual (tambah/kurang quantity)
export interface UpdateStockInput {
  productId: string;
  storeId: string;
  change: number; // Positif untuk tambah, negatif untuk kurang
  reason?: string;
  userId: string;
}

// Input untuk transfer stock antar toko (pemindahan barang)
export interface TransferStockInput {
  productId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  reason?: string;
  userId: string;
}

// =============================================================================
// STOCK REPORT TYPES (Laporan Stok & Analisis)
// =============================================================================

// Data pergerakan stok per produk (digunakan di tabel report produk)
export interface ProductMovement {
  productId: string;
  productName: string;
  productImage: string | null;
  categoryId: string;
  categoryName: string;
  stockIn: number;  // Total barang masuk
  stockOut: number; // Total barang keluar
  movements: number; // Jumlah total transaksi (IN/OUT)
  finalStock?: number; // Stok akhir saat ini
  netChange?: number;  // Selisih In - Out
}

// Data pergerakan stok per toko (digunakan di tabel report toko)
export interface StoreMovement {
  storeId: string;
  storeName: string;
  totalIn: number;
  totalOut: number;
  productCount: number; // Jumlah produk unik yang bergerak
  finalStock?: number;
}

// Ringkasan statistik di bagian atas halaman laporan
export interface StockReportSummary {
  period: string;       // Label waktu (misal: "05/2024")
  totalProducts: number;
  totalStores: number;
  totalIn: number;
  totalOut: number;
  netChange: number;
}

// =============================================================================
// QUERY & FILTER TYPES
// =============================================================================

// Parameter filter untuk request laporan stok (dari Controller ke Service)
export interface GetStockReportQuery {
  userId: string;
  role: string;
  storeId?: string;
  productId?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}
