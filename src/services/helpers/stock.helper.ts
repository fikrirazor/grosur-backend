import prisma from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";
import { StockJournalType } from "../../generated/prisma";

/**
 * Validate source stock has enough quantity
 */
export const validateSourceStock = async (
  productId: string,
  storeId: string,
  quantity: number,
) => {
  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
    include: { product: true, store: true },
  });

  if (!stock) {
    throw new AppError(404, "Source stock not found", true, "STOCK_NOT_FOUND");
  }

  if (stock.quantity < quantity) {
    throw new AppError(
      400,
      `Insufficient stock. Available: ${stock.quantity}, Requested: ${quantity}`,
      true,
      "INSUFFICIENT_STOCK",
    );
  }

  return stock;
};

/**
 * Get or create destination stock in a transaction
 */
export const getOrCreateDestinationStock = async (
  tx: any,
  productId: string,
  storeId: string,
) => {
  let stock = await tx.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
    include: { product: true, store: true },
  });

  if (!stock) {
    stock = await tx.stock.create({
      data: { productId, storeId, quantity: 0 },
      include: { product: true, store: true },
    });
  }

  return stock;
};

/**
 * Update stock quantity in a transaction
 */
export const updateStockQuantity = async (
  tx: any,
  stockId: string,
  newQty: number,
) => {
  return await tx.stock.update({
    where: { id: stockId },
    data: { quantity: newQty },
    include: { product: true, store: true },
  });
};

/**
 * Create journal entry in a transaction
 */
export const createJournalInTransaction = async (
  tx: any,
  data: {
    stockId: string;
    oldQty: number;
    newQty: number;
    change: number;
    type: StockJournalType;
    reason: string;
    userId: string;
  }
) => {
  await tx.stockJournal.create({
    data: {
      stockId: data.stockId,
      oldQty: data.oldQty,
      newQty: data.newQty,
      change: data.change,
      type: data.type,
      reason: data.reason,
      userId: data.userId,
    },
  });
};
