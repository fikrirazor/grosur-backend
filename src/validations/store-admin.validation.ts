import { z } from "zod";

export const createStoreAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  managedStoreId: z.string().uuid("Invalid Store ID format"),
});

export const updateStoreAdminSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  managedStoreId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});
