import { PaginationMeta } from "../types/product.types";

/**
 * Helper untuk format metadata pagination (total data, halaman, dll)
 * Digunakan secara konsisten di semua service agar response API seragam.
 */
export const formatPaginationMeta = (
  total: number, // Total data keseluruhan
  page: number, // Halaman saat ini
  limit: number, // Jumlah data per halaman
): PaginationMeta => {
  const totalPage = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPage,
    hasMore: page < totalPage,
  };
};
