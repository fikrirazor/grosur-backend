import { PaginationMeta } from "../types/product.types";

/**
 * Shared utility to format pagination metadata.
 */
export const formatPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  return {
    total,
    page,
    limit,
    totalPage: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
};
