// =============================================================================
// SALES REPORT TYPES (Laporan Penjualan & Tren)
// =============================================================================

// Item transaksi penjualan individu
export interface SalesTransactionItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;    // Subtotal + Shipping
  discountAmount: number;
  finalAmount: number;    // Total yang dibayar
  status: string;
  paymentMethod: string;
  createdAt: Date;
  storeId: string;
}

// Data penjualan per produk (untuk tabel agregasi produk)
export interface ProductSalesReportItem {
  productId: string;
  productName: string;
  productImage: string | null;
  categoryId: string;
  categoryName: string;
  quantity: number; // Total item terjual
  revenue: number;  // Total uang masuk dari produk ini
  orders: number;   // Berapa kali produk ini muncul di order
}

// Data penjualan per kategori (untuk tabel agregasi kategori)
export interface CategorySalesReportItem {
  categoryId: string;
  categoryName: string;
  quantity: number; // Total item terjual di kategori ini
  revenue: number;  // Total uang masuk
  products: number; // Jumlah produk unik yang terjual di kategori ini
}

// Data tren bulanan (untuk grafik/chart)
export interface SalesTrendItem {
  month: string;   // Label (misal: "Mei 24")
  revenue: number; // Total omzet
  orders: number;  // Jumlah transaksi
}

// Ringkasan statistik laporan penjualan
export interface SalesReportSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  averageOrderValue: number;
  period: string;
  storeId: string;
}

// =============================================================================
// QUERY & RESPONSE TYPES
// =============================================================================

// Parameter filter untuk request laporan penjualan
export interface GetSalesReportQuery {
  userId: string;
  role: string;
  storeId?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

// Format response lengkap untuk frontend
export interface SalesReportResponse {
  success: boolean;
  data: {
    transactions: SalesTransactionItem[];
    summary: SalesReportSummary;
    byCategory: CategorySalesReportItem[];
    byProduct: ProductSalesReportItem[];
    trends: SalesTrendItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPage: number;
      hasMore: boolean;
    };
  };
}
