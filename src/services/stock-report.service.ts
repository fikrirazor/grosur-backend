import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { formatPaginationMeta } from "../utils/pagination.util";
import { buildDateFilter, getPeriodLabel } from "../utils/date.util";
import { GetStockReportQuery } from "../types/stock.types";
import {
  getFinalStock,
  aggregateByProduct,
  aggregateByStore,
  buildSummary,
} from "./helpers/stock-report.helper";

export const getStockReport = async (filters: GetStockReportQuery) => {
  let { userId, role, storeId, productId, month, year, page = 1, limit = 20 } = filters;

  // Validate role-based access
  if (role === "STORE_ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { managedStoreId: true },
    });

    if (!user?.managedStoreId) {
      throw new AppError(403, "Store admin must have assigned store", true, "NO_STORE_ASSIGNED");
    }

    storeId = user.managedStoreId;
  } else if (role !== "SUPER_ADMIN") {
    throw new AppError(403, "Insufficient permissions", true, "FORBIDDEN");
  }

  // Build filters
  const where: any = {};
  if (storeId) where.storeId = storeId;
  if (productId) where.productId = productId;

  const dateFilter = buildDateFilter(month, year);
  if (dateFilter.createdAt) {
    where.createdAt = dateFilter.createdAt;
  }

  // Fetch paginated stock journals
  const skip = (page - 1) * limit;
  const [journals, total] = await Promise.all([
    prisma.stockJournal.findMany({
      where,
      include: {
        stock: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                category: { select: { name: true } },
                images: { take: 1, select: { url: true } },
              },
            },
            store: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.stockJournal.count({ where }),
  ]);

  // Aggregate data
  const byProduct = aggregateByProduct(journals);
  const byStore = aggregateByStore(journals);

  // Post-process aggregations (Async DB calls)
  for (const product of byProduct) {
    if (storeId) {
      product.finalStock = await getFinalStock(product.productId, storeId);
    } else {
      const stock = await prisma.stock.findFirst({
        where: { productId: product.productId },
        select: { quantity: true },
      });
      product.finalStock = stock?.quantity || 0;
    }
    product.netChange = product.stockIn - product.stockOut;
  }

  for (const store of byStore) {
    const stocks = await prisma.stock.findMany({
      where: { storeId: store.storeId },
      select: { quantity: true },
    });
    store.finalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
  }

  const summary = buildSummary(byProduct, byStore, getPeriodLabel(month, year));

  return {
    success: true,
    summary,
    byProduct,
    byStore,
    pagination: formatPaginationMeta(total, page, limit),
  };
};
