import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { StockJournalType } from "../generated/prisma";
import { createStockJournal } from "./stock-journal.service";
import { UpdateStockInput, TransferStockInput } from "../types/stock.types";

/**
 * Validate source stock has enough quantity
 */
const validateSourceStock = async (
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
 * Get or create destination stock
 */
const getOrCreateDestinationStock = async (
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
 * Update stock quantity in transaction
 */
const updateStockQuantity = async (
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
 * Create journal entry in transaction
 */
const createJournalInTransaction = async (
  tx: any,
  stockId: string,
  oldQty: number,
  newQty: number,
  change: number,
  type: StockJournalType,
  reason: string,
  userId: string,
) => {
  await tx.stockJournal.create({
    data: {
      stockId,
      oldQty,
      newQty,
      change,
      type,
      reason,
      userId,
    },
  });
};

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
  const updatedStock = await prisma.$transaction(async (tx: any) => {
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

    // Create stock journal entry using dedicated journal service
    await createStockJournal({
      stockId: stock.id,
      oldQty,
      newQty,
      change,
      type: journalType,
      reason,
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

export const transferStock = async (data: TransferStockInput) => {
  const { productId, fromStoreId, toStoreId, quantity, reason, userId } = data;

  // Validate same store
  if (fromStoreId === toStoreId) {
    throw new AppError(
      400,
      "Cannot transfer to the same store",
      true,
      "SAME_STORE",
    );
  }

  // Validate source stock
  const sourceStock = await validateSourceStock(
    productId,
    fromStoreId,
    quantity,
  );

  // Execute atomic transfer
  return await prisma.$transaction(async (tx: any) => {
    // 1. Reduce source stock
    const sourceOldQty = sourceStock.quantity;
    const sourceNewQty = sourceOldQty - quantity;
    const updatedSource = await updateStockQuantity(
      tx,
      sourceStock.id,
      sourceNewQty,
    );

    // 2. Create OUT journal for source
    await createJournalInTransaction(
      tx,
      sourceStock.id,
      sourceOldQty,
      sourceNewQty,
      -quantity,
      "TRANSFER",
      reason || `Transfer to store ${toStoreId}`,
      userId,
    );

    // 3. Get or create destination stock
    const destStock = await getOrCreateDestinationStock(
      tx,
      productId,
      toStoreId,
    );

    // 4. Increase destination stock
    const destOldQty = destStock.quantity;
    const destNewQty = destOldQty + quantity;
    const updatedDest = await updateStockQuantity(tx, destStock.id, destNewQty);

    // 5. Create IN journal for destination
    await createJournalInTransaction(
      tx,
      destStock.id,
      destOldQty,
      destNewQty,
      quantity,
      "TRANSFER",
      reason || `Transfer from store ${fromStoreId}`,
      userId,
    );

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
