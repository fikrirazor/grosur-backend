import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { formatPaginationMeta } from "../utils/pagination.util";

/**
 * Build date range filter for stock journals
 */
const buildDateFilter = (month?: number, year?: number) => {
  if (!year) return {};

  if (month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { createdAt: { gte: startDate, lte: endDate } };
  } else {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    return { createdAt: { gte: startDate, lte: endDate } };
  }
};

/**
 * Get final stock for a product from Stock table
 */
const getFinalStock = async (productId: string, storeId: string) => {
  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
    select: { quantity: true },
  });
  return stock?.quantity || 0;
};

/**
 * Aggregate stock movements by product
 */
const aggregateByProduct = (journals: any[]) => {
  const productMap = new Map();

  journals.forEach((journal) => {
    const product = journal.stock.product;
    const key = product.id;
    if (!productMap.has(key)) {
      productMap.set(key, {
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0]?.url || null,
        categoryId: product.categoryId,
        categoryName: product.category?.name || "Unknown",
        stockIn: 0,
        stockOut: 0,
        movements: 0,
      });
    }

    const data = productMap.get(key);
    data.movements += 1;

    if (journal.type === "IN") {
      data.stockIn += journal.newQty - journal.oldQty;
    } else if (journal.type === "OUT") {
      data.stockOut += journal.oldQty - journal.newQty;
    }
  });

  return Array.from(productMap.values());
};

/**
 * Aggregate stock movements by store
 */
const aggregateByStore = (journals: any[]) => {
  const storeMap = new Map();

  journals.forEach((journal) => {
    const store = journal.stock.store;
    const key = store.id;
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        storeId: store.id,
        storeName: store.name,
        totalIn: 0,
        totalOut: 0,
        products: new Set(),
      });
    }

    const data = storeMap.get(key);
    data.products.add(journal.stock.productId);

    if (journal.type === "IN") {
      data.totalIn += journal.newQty - journal.oldQty;
    } else if (journal.type === "OUT") {
      data.totalOut += journal.oldQty - journal.newQty;
    }
  });

  return Array.from(storeMap.values()).map((data) => ({
    ...data,
    productCount: data.products.size,
  }));
};

/**
 * Build summary statistics
 */
const buildSummary = (byProduct: any[], byStore: any[], period: string) => {
  const totalIn = byProduct.reduce((sum, p) => sum + p.stockIn, 0);
  const totalOut = byProduct.reduce((sum, p) => sum + p.stockOut, 0);

  return {
    period,
    totalProducts: byProduct.length,
    totalStores: byStore.length,
    totalIn,
    totalOut,
    netChange: totalIn - totalOut,
  };
};

export const getStockReport = async (
  userId: string,
  role: string,
  storeId?: string,
  productId?: string,
  month?: number,
  year?: number,
  page: number = 1,
  limit: number = 20
) => {
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
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter.createdAt;
  }

  // Calculate period label
  const periodLabel = month && year ? `${month}/${year}` : year ? `${year}` : "All Time";

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

  // Get final stocks for each product
  for (const product of byProduct) {
    if (storeId) {
      product.finalStock = await getFinalStock(product.productId, storeId);
    } else {
      // If no store filter, get stock from first available store
      const stock = await prisma.stock.findFirst({
        where: { productId: product.productId },
        select: { quantity: true },
      });
      product.finalStock = stock?.quantity || 0;
    }
    product.netChange = product.stockIn - product.stockOut;
  }

  // Add final stock to store aggregation
  for (const store of byStore) {
    const stocks = await prisma.stock.findMany({
      where: { storeId: store.storeId },
      select: { quantity: true },
    });
    store.finalStock = stocks.reduce((sum: number, s: any) => sum + s.quantity, 0);
  }

  // Build summary
  const summary = buildSummary(byProduct, byStore, periodLabel);

  return {
    success: true,
    summary,
    byProduct,
    byStore,
    pagination: formatPaginationMeta(total, page, limit),
  };
};
