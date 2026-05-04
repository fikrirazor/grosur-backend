import { z } from "zod";

export const updateStockSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  storeId: z.string().uuid("Invalid store ID"),
  change: z.number().int("Change must be an integer"),
  reason: z.string().min(1, "Reason is required").optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  fromStoreId: z.string().uuid("Invalid source store ID"),
  toStoreId: z.string().uuid("Invalid destination store ID"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required").optional(),
});
