import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CheckoutPreviewInput {
  userId: string;
  storeId: string;
  items: CartItem[];
  voucherCode?: string;
  shippingCost?: number; // Optional externally provided shipping cost
}

/**
 * Calculate B1G1 discount for a product
 */
const calculateB1G1 = (discount: any, itemQty: number, itemPrice: number) => {
  const buyQty = discount.buyQty || 1;
  const freeQty = discount.freeQty || 1;
  const sets = Math.floor(itemQty / (buyQty + freeQty));

  return sets * freeQty * itemPrice;
};

/**
 * Calculate percentage discount
 */
const calculatePercent = (discount: any, amount: number) => {
  let discountAmount = (amount * Number(discount.value)) / 100;

  if (discount.maxDiscount && discountAmount > Number(discount.maxDiscount)) {
    discountAmount = Number(discount.maxDiscount);
  }

  return discountAmount;
};

/**
 * Calculate nominal discount
 */
const calculateNominal = (discount: any) => {
  return Number(discount.value);
};

/**
 * Calculate discount for single product based on active discounts
 */
const calculateProductDiscount = async (productId: string, quantity: number, price: number, storeId: string) => {
  // Find active discount for this product
  const now = new Date();
  const discount = await prisma.discount.findFirst({
    where: {
      storeId,
      productId,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  if (!discount) return 0;

  const totalAmount = quantity * price;

  if (discount.type === "PERCENT") {
    return calculatePercent(discount, totalAmount);
  } else if (discount.type === "NOMINAL") {
    return calculateNominal(discount) * quantity;
  } else if (discount.type === "B1G1") {
    return calculateB1G1(discount, quantity, price);
  }

  return 0;
};

/**
 * Validate and calculate voucher discount
 */
const calculateVoucherDiscount = async (voucherCode: string | undefined, userId: string, subtotal: number) => {
  if (!voucherCode) return 0;

  const voucher = await prisma.voucher.findUnique({
    where: { code: voucherCode },
  });

  if (!voucher) {
    throw new AppError(404, "Voucher not found", true, "VOUCHER_NOT_FOUND");
  }

  if (voucher.userId !== userId) {
    throw new AppError(403, "Voucher not owned by user", true, "VOUCHER_NOT_OWNED");
  }

  if (voucher.isUsed || voucher.qty <= 0) {
    throw new AppError(400, "Voucher already used or exhausted", true, "VOUCHER_UNAVAILABLE");
  }

  const now = new Date();
  if (now > new Date(voucher.expiryDate)) {
    throw new AppError(400, "Voucher has expired", true, "VOUCHER_EXPIRED");
  }

  if (voucher.minSpend && subtotal < Number(voucher.minSpend)) {
    throw new AppError(
      400,
      `Minimum spend required: Rp ${Number(voucher.minSpend).toLocaleString("id-ID")}`,
      true,
      "MIN_SPEND_NOT_MET"
    );
  }

  // Calculate voucher discount
  let discountAmount = 0;

  if (voucher.type === "TOTAL") {
    discountAmount = (subtotal * Number(voucher.value)) / 100;

    if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
      discountAmount = Number(voucher.maxDiscount);
    }
  } else if (voucher.type === "SHIPPING" || voucher.type === "PRODUCT") {
    discountAmount = Number(voucher.value);
  }

  return Math.min(discountAmount, subtotal);
};

/**
 * Calculate shipping cost (simplified - can be enhanced with distance-based logic)
 */
const calculateShipping = (_storeId: string) => {
  // Simplified: flat rate per store
  // In production, calculate based on distance from user location
  return 15000; // Default Rp 15,000
};

export const previewCheckout = async (data: CheckoutPreviewInput) => {
  const { userId, storeId, items, voucherCode } = data;

  let subtotal = 0;
  let productDiscountTotal = 0;
  const itemDetails = [];

  // Calculate each item
  for (const item of items) {
    const itemSubtotal = item.quantity * item.price;
    const itemDiscount = await calculateProductDiscount(item.productId, item.quantity, item.price, storeId);

    subtotal += itemSubtotal;
    productDiscountTotal += itemDiscount;

    itemDetails.push({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      subtotal: itemSubtotal,
      discount: itemDiscount,
      finalPrice: itemSubtotal - itemDiscount,
    });
  }

  // Calculate voucher discount (applied to subtotal after product discounts)
  const subtotalAfterProductDiscount = subtotal - productDiscountTotal;
  const voucherDiscount = await calculateVoucherDiscount(voucherCode, userId, subtotalAfterProductDiscount);

  // Calculate shipping
  const baseShippingCost = data.shippingCost !== undefined ? data.shippingCost : calculateShipping(storeId);

  // Apply shipping voucher if applicable
  let finalShippingCost = baseShippingCost;
  if (voucherCode) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode },
    });

    if (voucher && voucher.type === "SHIPPING") {
      finalShippingCost = Math.max(0, baseShippingCost - voucherDiscount);
    }
  }

  // Calculate final amount
  const finalAmount = subtotalAfterProductDiscount - voucherDiscount + finalShippingCost;

  return {
    success: true,
    summary: {
      subtotal,
      productDiscount: productDiscountTotal,
      subtotalAfterDiscount: subtotalAfterProductDiscount,
      voucherDiscount,
      shippingCost: finalShippingCost,
      finalAmount: Math.max(0, finalAmount),
    },
    items: itemDetails,
    voucher: voucherCode ? { code: voucherCode, applied: true } : null,
  };
};
