import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { StockJournalType } from "../generated/prisma";

export interface UpdateStockInput {
  productId: string;
  storeId: string;
  change: number;
  reason?: string;
  userId: string;
}

export const updateStock = async (data: UpdateStockInput) => {
  const { productId, storeId, change, reason, userId } = data;

  // Find existing stock
  const stock = await prisma.stock.findUnique({
    where: {
      productId_storeId: {
        productId,
        storeId,
      },
    },
    include: {
      product: true,
      store: true,
    },
  });

  if (!stock) {
    throw new AppError(
      404,
      "Stock not found for this product in the specified store",
      true,
      "STOCK_NOT_FOUND",
    );
  }

  // Calculate new quantity
  const oldQty = stock.quantity;
  const newQty = oldQty + change;

  // Prevent negative stock
  if (newQty < 0) {
    throw new AppError(
      400,
      `Insufficient stock. Current: ${oldQty}, Requested change: ${change}`,
      true,
      "INSUFFICIENT_STOCK",
    );
  }

  // Determine journal type based on change
  let journalType: StockJournalType = "IN";
  if (change < 0) {
    journalType = "OUT";
  }

  // Update stock and create journal entry in transaction
  const updatedStock = await prisma.$transaction(async (tx) => {
    // Update stock quantity
    const updated = await tx.stock.update({
      where: {
        productId_storeId: {
          productId,
          storeId,
        },
      },
      data: {
        quantity: newQty,
      },
      include: {
        product: true,
        store: true,
      },
    });

    // Create stock journal entry for audit trail
    await tx.stockJournal.create({
      data: {
        stockId: stock.id,
        oldQty,
        newQty,
        change,
        type: journalType,
        reason: reason || "Manual adjustment",
        userId,
      },
    });

    return updated;
  });

  return {
    stock: updatedStock,
    previousQuantity: oldQty,
    newQuantity: newQty,
    change,
  };
};
