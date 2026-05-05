import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { CreateDiscountInput, UpdateDiscountInput } from "../types/discount.types";
import {
  validateProductInStore,
  checkOverlappingDiscount,
  verifyStoreOwnership,
} from "./helpers/discount.helper";

/**
 * Membuat data diskon baru (Admin).
 */
export const createDiscount = async (
  data: CreateDiscountInput,
  userId: string,
  userRole: string,
) => {
  const { storeId, productId, type, value, startDate, endDate } = data;

  if (userRole === "STORE_ADMIN") {
    await verifyStoreOwnership(storeId, userId);
  }

  if (productId) {
    await validateProductInStore(productId, storeId);
  }

  await checkOverlappingDiscount(productId, storeId, startDate, endDate);

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

/**
 * Memperbarui data diskon (Admin).
 */
export const updateDiscount = async (
  discountId: string,
  data: UpdateDiscountInput,
  userId: string,
  userRole: string,
) => {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } });

  if (!discount) {
    throw new AppError(404, "Discount not found", true, "DISCOUNT_NOT_FOUND");
  }

  if (userRole === "STORE_ADMIN") {
    await verifyStoreOwnership(discount.storeId, userId);
  }

  if (data.productId && data.productId !== discount.productId) {
    await validateProductInStore(data.productId, discount.storeId);
  }

  if ((data.startDate || data.endDate || data.productId) && data.isActive !== false) {
    const checkProductId = data.productId || discount.productId;
    const checkStartDate = data.startDate ? new Date(data.startDate) : discount.startDate;
    const checkEndDate = data.endDate ? new Date(data.endDate) : discount.endDate;

    if (checkEndDate) {
      await checkOverlappingDiscount(
        checkProductId,
        discount.storeId,
        checkStartDate,
        checkEndDate,
        discountId,
      );
    }
  }

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

/**
 * Menghapus/Menonaktifkan diskon.
 */
export const deleteDiscount = async (discountId: string, userId: string, userRole: string) => {
  const discount = await prisma.discount.findUnique({ where: { id: discountId } });

  if (!discount) {
    throw new AppError(404, "Discount not found", true, "DISCOUNT_NOT_FOUND");
  }

  if (userRole === "STORE_ADMIN") {
    await verifyStoreOwnership(discount.storeId, userId);
  }

  await prisma.discount.update({
    where: { id: discountId },
    data: { isActive: false },
  });

  return { success: true, message: "Discount deactivated successfully" };
};

/**
 * Mendapatkan semua diskon yang ada di suatu toko.
 */
export const getStoreDiscounts = async (storeId: string, userId: string, userRole: string) => {
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
