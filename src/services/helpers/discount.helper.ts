import prisma from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

/**
 * Validasi apakah produk tersedia di toko yang dipilih.
 */
export const validateProductInStore = async (productId: string, storeId: string) => {
  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
  });

  if (!stock) {
    throw new AppError(
      404,
      "Product not available in this store",
      true,
      "PRODUCT_NOT_IN_STORE",
    );
  }
};

/**
 * Validasi agar tidak ada jadwal diskon yang bentrok untuk produk yang sama.
 */
export const checkOverlappingDiscount = async (
  productId: string | null | undefined,
  storeId: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string,
) => {
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
    throw new AppError(
      409,
      "Overlapping discount already exists for this product",
      true,
      "DISCOUNT_OVERLAP",
    );
  }
};

/**
 * Verifikasi apakah Store Admin memiliki hak akses ke toko tersebut.
 */
export const verifyStoreOwnership = async (storeId: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, managedStoreId: true },
  });

  if (!user) {
    throw new AppError(404, "User not found", true, "USER_NOT_FOUND");
  }

  if (user.role === "STORE_ADMIN" && user.managedStoreId !== storeId) {
    throw new AppError(
      403,
      "Access denied. You can only manage discounts for your own store",
      true,
      "FORBIDDEN",
    );
  }
};
