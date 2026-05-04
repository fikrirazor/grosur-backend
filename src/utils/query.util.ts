import { Request } from "express";

/**
 * Common pagination and filter parsing from request query.
 */
export const parseQueryParams = (query: Request["query"]) => {
  return {
    page: parseInt(query.page as string) || 1,
    limit: parseInt(query.limit as string) || 20,
    month: query.month ? parseInt(query.month as string) : undefined,
    year: query.year ? parseInt(query.year as string) : undefined,
    startDate: query.startDate ? new Date(query.startDate as string) : undefined,
    endDate: query.endDate ? new Date(query.endDate as string) : undefined,
    storeId: query.storeId as string | undefined,
    productId: query.productId as string | undefined,
    stockId: query.stockId as string | undefined,
    type: query.type as any,
    search: query.search as string | undefined,
    categoryId: query.categoryId as string | undefined,
  };
};
