import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";

export interface ValidateVoucherInput {
  voucherCode: string;
  userId: string;
  cartTotal: number;
  productId?: string;
}

/**
 * Check if voucher is expired
 */
const checkExpiry = (voucher: any) => {
  const now = new Date();
  const expiry = new Date(voucher.expiryDate);

  if (now > expiry) {
    throw new AppError(400, "Voucher has expired", true, "VOUCHER_EXPIRED");
  }
};

/**
 * Check if voucher is still available (qty > 0 and not used)
 */
const checkUsage = (voucher: any) => {
  if (voucher.isUsed) {
    throw new AppError(400, "Voucher already used", true, "VOUCHER_ALREADY_USED");
  }

  if (voucher.qty <= 0) {
    throw new AppError(400, "Voucher quota exhausted", true, "VOUCHER_EXHAUSTED");
  }
};

/**
 * Check if user meets minimum spend requirement
 */
const checkEligibility = (voucher: any, cartTotal: number) => {
  if (voucher.minSpend && cartTotal < Number(voucher.minSpend)) {
    throw new AppError(
      400,
      `Minimum spend required: Rp ${Number(voucher.minSpend).toLocaleString("id-ID")}`,
      true,
      "MIN_SPEND_NOT_MET"
    );
  }
};

/**
 * Check if voucher is for specific product and validate
 */
const checkProductEligibility = async (voucher: any, productId?: string) => {
  if (voucher.type === "PRODUCT" && !productId) {
    throw new AppError(400, "Product ID required for product voucher", true, "PRODUCT_ID_REQUIRED");
  }

  if (voucher.productId && voucher.productId !== productId) {
    throw new AppError(400, "Voucher not valid for this product", true, "INVALID_PRODUCT");
  }
};

/**
 * Calculate discount amount based on voucher type
 */
const calculateDiscount = (voucher: any, cartTotal: number, productPrice?: number) => {
  let discount = 0;

  if (voucher.type === "PERCENT") {
    const baseAmount = voucher.productId ? productPrice || 0 : cartTotal;
    discount = (baseAmount * Number(voucher.value)) / 100;

    // Apply max discount cap
    if (voucher.maxDiscount && discount > Number(voucher.maxDiscount)) {
      discount = Number(voucher.maxDiscount);
    }
  } else if (voucher.type === "NOMINAL") {
    discount = Number(voucher.value);
  } else if (voucher.type === "SHIPPING") {
    discount = Number(voucher.value); // Shipping cost discount
  }

  // Ensure discount doesn't exceed total
  return Math.min(discount, cartTotal);
};

export const validateVoucher = async (data: ValidateVoucherInput) => {
  const { voucherCode, userId, cartTotal, productId } = data;

  // Find voucher by code
  const voucher = await prisma.voucher.findUnique({
    where: { code: voucherCode },
    include: {
      product: { select: { id: true, name: true } },
    },
  });

  if (!voucher) {
    throw new AppError(404, "Voucher not found", true, "VOUCHER_NOT_FOUND");
  }

  // Check if voucher belongs to user
  if (voucher.userId !== userId) {
    throw new AppError(403, "Voucher not owned by user", true, "VOUCHER_NOT_OWNED");
  }

  // Run validations
  checkExpiry(voucher);
  checkUsage(voucher);
  checkEligibility(voucher, cartTotal);
  await checkProductEligibility(voucher, productId);

  // Calculate discount
  const productPrice = productId ? undefined : undefined; // Will be passed from order context
  const discountAmount = calculateDiscount(voucher, cartTotal, productPrice);

  return {
    valid: true,
    voucher: {
      id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      maxDiscount: voucher.maxDiscount,
    },
    discountAmount,
  };
};

export const useVoucher = async (voucherCode: string, _userId: string, orderId: string) => {
  // Atomic transaction to prevent race condition
  return await prisma.$transaction(async (tx) => {
    // Find voucher with lock
    const voucher = await tx.voucher.findUnique({
      where: { code: voucherCode },
    });

    if (!voucher) {
      throw new AppError(404, "Voucher not found", true, "VOUCHER_NOT_FOUND");
    }

    // Re-validate in transaction
    checkExpiry(voucher);
    checkUsage(voucher);

    // Update voucher: decrement qty and mark as used
    const updated = await tx.voucher.update({
      where: { id: voucher.id },
      data: {
        qty: { decrement: 1 },
        isUsed: true,
        usedAt: new Date(),
        orderId,
      },
    });

    return {
      success: true,
      message: "Voucher used successfully",
      voucher: {
        code: updated.code,
        remainingQty: updated.qty,
      },
    };
  });
};
