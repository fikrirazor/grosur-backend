import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().uuid("Invalid category ID format"),
  storeId: z.string().uuid("Invalid store ID format"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const uploadProductImagesSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  storeId: z.string().uuid("Invalid store ID format"),
});
