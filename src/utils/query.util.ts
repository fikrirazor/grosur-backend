import { Request } from "express";

/**
 * Utilitas untuk parsing parameter query dari Request Express.
 * Mengonversi string dari URL menjadi tipe data yang sesuai (number, Date, dll).
 * 
 * Digunakan secara konsisten di seluruh Controller untuk:
 * - Pagination (page, limit)
 * - Filtering (storeId, productId, categoryId, search)
 * - Reporting (month, year, date ranges)
 */
export const parseQueryParams = (query: Request["query"]) => {
  return {
    // Pagination (Default: Halaman 1, Limit 20)
    page: parseInt(query.page as string) || 1,
    limit: parseInt(query.limit as string) || 20,

    // Filter Periode (Untuk Laporan)
    month: query.month ? parseInt(query.month as string) : undefined,
    year: query.year ? parseInt(query.year as string) : undefined,

    // Filter Range Tanggal Spesifik
    startDate: query.startDate ? new Date(query.startDate as string) : undefined,
    endDate: query.endDate ? new Date(query.endDate as string) : undefined,

    // Filter ID & Relasi
    storeId: query.storeId as string | undefined,
    productId: query.productId as string | undefined,
    stockId: query.stockId as string | undefined,
    categoryId: query.categoryId as string | undefined,

    // Lain-lain
    type: query.type as any, // Jenis transaksi/jurnal
    search: query.search as string | undefined, // Pencarian teks
  };
};
