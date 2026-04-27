import { z } from "zod";

// Validation for percentage discount
const validatePercentageDiscount = (value: number) => {
  if (value <= 0 || value > 100) {
    throw new Error("Percentage must be between 0 and 100");
  }
};

// Validation for nominal discount
const validateNominalDiscount = (value: number) => {
  if (value <= 0) {
    throw new Error("Nominal value must be positive");
  }
};

// Validation for B1G1 discount
const validateB1G1Discount = (buyQty?: number, freeQty?: number) => {
  if (!buyQty || !freeQty || buyQty <= 0 || freeQty <= 0) {
    throw new Error("B1G1 requires valid buyQty and freeQty");
  }
};

// Validation for date range
const validateDateRange = (startDate: Date, endDate: Date) => {
  if (endDate <= startDate) {
    throw new Error("End date must be after start date");
  }
};

export const createDiscountSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  productId: z.string().uuid("Invalid product ID").optional(),
  type: z.enum(["PERCENT", "NOMINAL", "B1G1"]),
  value: z.number().positive("Value must be positive"),
  minSpend: z.number().positive("Min spend must be positive").optional(),
  maxDiscount: z.number().positive("Max discount must be positive").optional(),
  buyQty: z.number().int().positive().optional(),
  freeQty: z.number().int().positive().optional(),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
}).refine((data) => {
  // Validate based on discount type
  if (data.type === "PERCENT") {
    validatePercentageDiscount(data.value);
  } else if (data.type === "NOMINAL") {
    validateNominalDiscount(data.value);
  } else if (data.type === "B1G1") {
    validateB1G1Discount(data.buyQty, data.freeQty);
  }

  // Validate date range
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  validateDateRange(start, end);

  return true;
}, {
  message: "Validation failed",
});

export const updateDiscountSchema = z.object({
  productId: z.string().uuid("Invalid product ID").optional(),
  type: z.enum(["PERCENT", "NOMINAL", "B1G1"]).optional(),
  value: z.number().positive().optional(),
  minSpend: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  buyQty: z.number().int().positive().optional(),
  freeQty: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine((data) => {
  // Validate percentage if provided
  if (data.type === "PERCENT" && data.value !== undefined) {
    validatePercentageDiscount(data.value);
  }

  // Validate date range if both provided
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    validateDateRange(start, end);
  }

  return true;
}, {
  message: "Validation failed",
});
