import prisma from "../config/database";
import { StockJournalType } from "../generated/prisma";

export interface CreateJournalInput {
  stockId: string;
  oldQty: number;
  newQty: number;
  change: number;
  type: StockJournalType;
  reason?: string;
  userId: string;
  orderId?: string;
}

/**
 * Create a stock journal entry for audit trail
 * Single responsibility: only handles journal creation
 */
export const createStockJournal = async (data: CreateJournalInput) => {
  return await prisma.stockJournal.create({
    data: {
      stockId: data.stockId,
      oldQty: data.oldQty,
      newQty: data.newQty,
      change: data.change,
      type: data.type,
      reason: data.reason || "Manual adjustment",
      userId: data.userId,
      orderId: data.orderId,
    },
  });
};

/**
 * Build where clause for journal filters
 */
const buildJournalWhereClause = (filters: GetJournalsInput): any => {
  const { stockId, productId, storeId, type, startDate, endDate } = filters;
  const where: any = {};

  if (stockId) where.stockId = stockId;
  if (type) where.type = type;

  if (productId || storeId) {
    where.stock = {};
    if (productId) where.stock.productId = productId;
    if (storeId) where.stock.storeId = storeId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  return where;
};

/**
 * Fetch journals with product & store details
 */
const fetchJournalsWithDetails = async (where: any, skip: number, limit: number) => {
  return await prisma.stockJournal.findMany({
    where,
    include: {
      stock: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
          store: { select: { id: true, name: true } },
        },
      },
      order: { select: { id: true, orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
};

/**
 * Format journal response with pagination metadata
 */
const formatJournalResponse = (journals: any[], total: number, page: number, limit: number) => {
  return {
    journals,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get stock journals with pagination and filters
 */
export interface GetJournalsInput {
  stockId?: string;
  productId?: string;
  storeId?: string;
  type?: StockJournalType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const getStockJournals = async (filters: GetJournalsInput) => {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where = buildJournalWhereClause(filters);

  const [journals, total] = await Promise.all([
    fetchJournalsWithDetails(where, skip, limit),
    prisma.stockJournal.count({ where }),
  ]);

  return formatJournalResponse(journals, total, page, limit);
};

/**
 * Get journal statistics for a specific stock
 */
export const getStockJournalStats = async (stockId: string) => {
  const stats = await prisma.stockJournal.groupBy({
    by: ["type"],
    where: {
      stockId,
    },
    _sum: {
      change: true,
    },
    _count: {
      id: true,
    },
  });

  return stats;
};
