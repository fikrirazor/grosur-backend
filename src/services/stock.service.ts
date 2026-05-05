import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { StockJournalType } from "../generated/prisma";
import { createStockJournal } from "./stock-journal.service";
import { UpdateStockInput, TransferStockInput } from "../types/stock.types";
import {
  validateSourceStock,
  getOrCreateDestinationStock,
  updateStockQuantity,
  createJournalInTransaction,
} from "./helpers/stock.helper";

/**
 * Memperbarui kuantitas stok produk secara manual (Tambah/Kurang).
 */
export const updateStock = async (data: UpdateStockInput) => {
  const { productId, storeId, change, reason, userId } = data;

  // Find existing stock
  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
    include: { product: true, store: true },
  });

  if (!stock) {
    throw new AppError(404, "Stock not found", true, "STOCK_NOT_FOUND");
  }

  const oldQty = stock.quantity;
  const newQty = oldQty + change;

  if (newQty < 0) {
    throw new AppError(
      400,
      `Insufficient stock. Current: ${oldQty}, Change: ${change}`,
      true,
      "INSUFFICIENT_STOCK",
    );
  }

  const journalType: StockJournalType = change < 0 ? "OUT" : "IN";

  const updatedStock = await prisma.$transaction(async (tx) => {
    const updated = await tx.stock.update({
      where: { productId_storeId: { productId, storeId } },
      data: { quantity: newQty },
      include: { product: true, store: true },
    });

    await createStockJournal({
      stockId: stock.id,
      oldQty,
      newQty,
      change,
      type: journalType,
      reason: reason || "Manual adjustment",
      userId,
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

/**
 * Melakukan transfer stok antar toko.
 */
export const transferStock = async (data: TransferStockInput) => {
  const { productId, fromStoreId, toStoreId, quantity, reason, userId } = data;

  if (fromStoreId === toStoreId) {
    throw new AppError(400, "Cannot transfer to the same store", true, "SAME_STORE");
  }

  const sourceStock = await validateSourceStock(productId, fromStoreId, quantity);

  return await prisma.$transaction(async (tx) => {
    // 1. Reduce source stock
    const sourceOldQty = sourceStock.quantity;
    const sourceNewQty = sourceOldQty - quantity;
    const updatedSource = await updateStockQuantity(tx, sourceStock.id, sourceNewQty);

    // 2. Create TRANSFER OUT journal
    await createJournalInTransaction(tx, {
      stockId: sourceStock.id,
      oldQty: sourceOldQty,
      newQty: sourceNewQty,
      change: -quantity,
      type: "TRANSFER",
      reason: reason || `Transfer to ${toStoreId}`,
      userId,
    });

    // 3. Get or create destination stock
    const destStock = await getOrCreateDestinationStock(tx, productId, toStoreId);

    // 4. Increase destination stock
    const destOldQty = destStock.quantity;
    const destNewQty = destOldQty + quantity;
    const updatedDest = await updateStockQuantity(tx, destStock.id, destNewQty);

    // 5. Create TRANSFER IN journal
    await createJournalInTransaction(tx, {
      stockId: destStock.id,
      oldQty: destOldQty,
      newQty: destNewQty,
      change: quantity,
      type: "TRANSFER",
      reason: reason || `Transfer from ${fromStoreId}`,
      userId,
    });

    return {
      success: true,
      message: `Transferred ${quantity} units successfully`,
      source: {
        store: updatedSource.store.name,
        previousQty: sourceOldQty,
        newQty: sourceNewQty,
      },
      destination: {
        store: updatedDest.store.name,
        previousQty: destOldQty,
        newQty: destNewQty,
      },
    };
  });
};
