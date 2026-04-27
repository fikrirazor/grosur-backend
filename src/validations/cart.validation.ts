import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  storeId: z.string().uuid("Invalid store ID format"),
  quantity: z.number().int().positive("Quantity must be a positive integer").default(1),
});
