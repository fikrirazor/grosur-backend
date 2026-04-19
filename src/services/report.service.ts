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
  const now = new Date();
  const isFuture = startDate > now;
  if (isFuture) return { success: true, data: [], period: { month, year } };

  // 1. Get all stocks for the store(s)
  const stocks = await prisma.stock.findMany({
    where: storeId ? { storeId } : {},
    include: {
      product: { select: { id: true, name: true, slug: true } },
      store: { select: { id: true, name: true } },
    },
  });

  if (stocks.length === 0) return { success: true, data: [], period: { month, year } };

  const stockIds = stocks.map(s => s.id);

  // 2. Fetch ALL journals for these stocks that happened before or during the month
  // This allows us to find the most recent state at the end of the month
  const allRelevantJournals = await prisma.stockJournal.findMany({
    where: {
      stockId: { in: stockIds },
      createdAt: { lte: endDate },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group journals by stockId
  const journalsByStock = allRelevantJournals.reduce((acc, j) => {
    if (!acc[j.stockId]) acc[j.stockId] = [];
    acc[j.stockId].push(j);
    return acc;
  }, {} as Record<string, typeof allRelevantJournals>);

  const reportData = stocks.map((stock) => {
    const journals = journalsByStock[stock.id] || [];
    
    // journals are sorted by createdAt DESC
    const journalsInMonth = journals.filter(j => j.createdAt >= startDate && j.createdAt <= endDate);
    
    let totalIn = 0;
    let totalOut = 0;
    journalsInMonth.forEach((j) => {
      if (j.change > 0) totalIn += j.change;
      else totalOut += Math.abs(j.change);
    });

    // The stock at the end of the month is the newQty of the LATEST journal in or before the month.
    // Since journals are sorted by createdAt DESC, the first one in the list (all were <= endDate) is the latest.
    const lastEntry = journals[0];
    
    // If no journals ever existed for this stock before or during this month,
    // and we are looking at a past month, the stock must have been 0.
    // If we are looking at the current month and no journals exist, we fall back to current stock.
    const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;
    let endStock = 0;
    
    if (lastEntry) {
      endStock = lastEntry.newQty;
    } else if (isCurrentMonth) {
      endStock = stock.quantity;
    }
    
    const initialStock = endStock - totalIn + totalOut;

    return {
      productId: stock.productId,
      productName: stock.product.name,
      storeName: stock.store.name,
      initialStock,
      totalIn,
      totalOut,
      endStock,
      unit: "pcs", 
    };
  });

  return {
    success: true,
    data: reportData,
    period: { month, year },
  };
};

/**
 * Get detailed history of stock changes for a specific product
 */
/**
 * Get detailed history of stock changes for a specific product
 * Supports date range, pagination, and role-based filtering
 */
export const getStockDetailReport = async (
  productId: string,
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    stock: {
      productId,
    },
  };

  // Only filter by store if a specific storeId is provided and not "all"
  if (storeId && storeId !== "all") {
    where.stock.storeId = storeId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Fetch journals and total count in parallel
  const [journals, total] = await Promise.all([
    prisma.stockJournal.findMany({
      where,
      include: {
        stock: {
          include: {
            product: { select: { name: true } },
          },
        },
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "desc" }, // Most recent first
      skip,
      take: limit,
    }),
    prisma.stockJournal.count({ where }),
  ]);

  // Manually fetch user names (Actor)
  const userIds = [...new Set(journals.map(j => j.userId).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds as string[] } },
    select: { id: true, name: true }
  });

  const formattedData = journals.map(j => ({
    ...j,
    userName: users.find(u => u.id === j.userId)?.name || "System",
  }));

  return {
    success: true,
    data: formattedData,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
};
