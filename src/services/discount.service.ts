import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { DiscountType } from "../generated/prisma";

export interface CreateDiscountInput {
  storeId: string;
  productId?: string;
  type: DiscountType;
  value: number;
  minSpend?: number;
  maxDiscount?: number;
  buyQty?: number;
  freeQty?: number;
  startDate: Date;
  endDate: Date;
}

export interface UpdateDiscountInput {
  productId?: string;
  type?: DiscountType;
  value?: number;
  minSpend?: number;
  maxDiscount?: number;
  buyQty?: number;
  freeQty?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Validate product exists in store
 */
const validateProductInStore = async (productId: string, storeId: string) => {
  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
  });

  if (!stock) {
    throw new AppError(404, "Product not available in this store", true, "PRODUCT_NOT_IN_STORE");
  }
};

/**
 * Validate discount doesn't overlap with existing active discount for same product
 */
const checkOverlappingDiscount = async (productId: string | null | undefined, storeId: string, startDate: Date, endDate: Date, excludeId?: string) => {
  if (!productId) return; // No check needed for store-wide discounts

  const where: any = {
    storeId,
    productId,
    isActive: true,
    startDate: { lte: endDate },
    endDate: { gte: startDate },
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const existing = await prisma.discount.findFirst({ where });

  if (existing) {
    throw new AppError(409, "Overlapping discount already exists for this product", true, "DISCOUNT_OVERLAP");
  }
};

/**
 * Verify store admin owns the store
 */
const verifyStoreOwnership = async (storeId: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, managedStoreId: true },
  });

  if (!user) {
    throw new AppError(404, "User not found", true, "USER_NOT_FOUND");
  }

  if (user.role === "STORE_ADMIN" && user.managedStoreId !== storeId) {
    throw new AppError(403, "Access denied. You can only manage discounts for your own store", true, "FORBIDDEN");
  }
};

export const createDiscount = async (data: CreateDiscountInput, userId: string, userRole: string) => {
  const { storeId, productId, type, value, startDate, endDate } = data;

  // Verify store ownership for STORE_ADMIN
  if (userRole === "STORE_ADMIN") {
    await verifyStoreOwnership(storeId, userId);
  }

  // Validate product if specified
  if (productId) {
    await validateProductInStore(productId, storeId);
  }

  // Check for overlapping discounts
  await checkOverlappingDiscount(productId, storeId, startDate, endDate);

  // Create discount
  return await prisma.discount.create({
    data: {
      storeId,
      productId,
      type,
      value: value.toString(),
      minSpend: data.minSpend ? data.minSpend.toString() : null,
      maxDiscount: data.maxDiscount ? data.maxDiscount.toString() : null,
      buyQty: data.buyQty,
      freeQty: data.freeQty,
      startDate,
      endDate,
      isActive: true,
    },
    include: {
      product: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
  });
};

export const updateDiscount = async (
  discountId: string,
  data: UpdateDiscountInput,
  userId: string,
  userRole: string
) => {
  // Find existing discount
  const discount = await prisma.discount.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    throw new AppError(404, "Discount not found", true, "DISCOUNT_NOT_FOUND");
  }

  // Verify ownership
  if (userRole === "STORE_ADMIN") {
    await verifyStoreOwnership(discount.storeId, userId);
  }

  // Validate product if changing
  if (data.productId && data.productId !== discount.productId) {
    await validateProductInStore(data.productId, discount.storeId);
  }

  // Check overlaps if dates or product changed
  if ((data.startDate || data.endDate || data.productId) && data.isActive !== false) {
    const checkProductId = data.productId || discount.productId;
    const checkStartDate = data.startDate ? new Date(data.startDate) : discount.startDate;
    const checkEndDate = data.endDate ? new Date(data.endDate) : discount.endDate;

    if (checkEndDate) {
      await checkOverlappingDiscount(checkProductId, discount.storeId, checkStartDate, checkEndDate, discountId);
    }
  }

  // Update discount
  return await prisma.discount.update({
    where: { id: discountId },
    data: {
      ...data,
      value: data.value ? data.value.toString() : undefined,
      minSpend: data.minSpend !== undefined ? data.minSpend.toString() : undefined,
      maxDiscount: data.maxDiscount !== undefined ? data.maxDiscount.toString() : undefined,
    },
    include: {
      product: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
  });
};

export const deleteDiscount = async (discountId: string, userId: string, userRole: string) => {
  // Find discount
  const discount = await prisma.discount.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    throw new AppError(404, "Discount not found", true, "DISCOUNT_NOT_FOUND");
  }

  // Verify ownership
  if (userRole === "STORE_ADMIN") {
    await verifyStoreOwnership(discount.storeId, userId);
  }

  // Soft delete by deactivating
  await prisma.discount.update({
    where: { id: discountId },
    data: { isActive: false },
  });

  return { success: true, message: "Discount deactivated successfully" };
};

export const getStoreDiscounts = async (storeId: string, userId: string, userRole: string) => {
  // Verify ownership for STORE_ADMIN
  if (userRole === "STORE_ADMIN") {
    await verifyStoreOwnership(storeId, userId);
  }

  return await prisma.discount.findMany({
    where: { storeId },
    include: {
      product: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};
