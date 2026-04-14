import { z } from "zod";

export const updateStockSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  storeId: z.string().uuid("Invalid store ID"),
  change: z.number().int("Change must be an integer"),
  reason: z.string().min(1, "Reason is required").optional(),
});
