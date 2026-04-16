import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";

/**
 * Build date range filter for reports
 */
const buildDateRange = (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

/**
 * Get monthly summary of stock changes per product
 * (Total addition, Total reduction, End balance)
 */
export const getStockSummaryReport = async (
  userId: string,
  role: string,
  storeId?: string,
  month: number = new Date().getMonth() + 1,
  year: number = new Date().getFullYear()
) => {
  // Validate role and storeId
  if (role === "STORE_ADMIN") {
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { managedStoreId: true },
    });
    if (!admin?.managedStoreId) throw new AppError(403, "Store admin has no assigned store");
    storeId = admin.managedStoreId;
  } else if (role !== "SUPER_ADMIN") {
    throw new AppError(403, "Unauthorized access");
  }

  const { startDate, endDate } = buildDateRange(month, year);

  // 1. Get all products associated with the store
  const stocks = await prisma.stock.findMany({
    where: storeId ? { storeId } : {},
    include: {
      product: { select: { id: true, name: true } },
      store: { select: { name: true } },
    },
  });

  const reportData = await Promise.all(
    stocks.map(async (stock) => {
      // 2. Aggregate changes in the month
      const journals = await prisma.stockJournal.findMany({
        where: {
          stockId: stock.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      let totalIn = 0;
      let totalOut = 0;
      journals.forEach((j) => {
        if (j.change > 0) totalIn += j.change;
        else totalOut += Math.abs(j.change);
      });

      // 3. Find end stock snapshot (latest entry in month)
      const lastEntry = journals.length > 0 
        ? journals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : await prisma.stockJournal.findFirst({
            where: {
              stockId: stock.id,
              createdAt: { lt: startDate }
            },
            orderBy: { createdAt: "desc" }
          });

      const endStock = lastEntry ? lastEntry.newQty : stock.quantity;

      return {
        productId: stock.productId,
        productName: stock.product.name,
        storeName: stock.store.name,
        totalIn,
        totalOut,
        endStock,
        unit: "pcs", // Placeholder or from product schema
      };
    })
  );

  return {
    success: true,
    data: reportData,
    period: { month, year },
  };
};

/**
 * Get detailed history of stock changes for a specific product
 */
export const getStockDetailReport = async (
  productId: string,
  storeId: string,
  month: number,
  year: number
) => {
  const { startDate, endDate } = buildDateRange(month, year);

  const journals = await prisma.stockJournal.findMany({
    where: {
      stock: {
        productId,
        storeId,
      },
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      stock: {
        include: {
          product: { select: { name: true } },
        },
      },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Manually fetch user names since relation might be missing or complex
  const userIds = [...new Set(journals.map(j => j.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  });

  return journals.map(j => ({
    ...j,
    userName: users.find(u => u.id === j.userId)?.name || "System",
  }));
};
