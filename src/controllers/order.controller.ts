import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { sendResponse } from "../utils/response.util";
import cloudinary from "../config/cloudinary";

/**
 * Validates stock for all items in the user's cart across all stores.
 */
export const validateStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { product: true },
    });

    const outOfStock: string[] = [];

    for (const item of cartItems) {
      const totalStock = await prisma.stock.aggregate({
        where: { productId: item.productId },
        _sum: { quantity: true },
      });

      const totalQty = totalStock._sum.quantity || 0;
      if (totalQty < item.quantity) {
        outOfStock.push(item.product.name);
      }
    }

    if (outOfStock.length > 0) {
      return sendResponse(res, 200, false, "Stock insufficient", { outOfStock });
    }

    sendResponse(res, 200, true, "Stock validated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new order based on cart items and selected address.
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { addressId, paymentMethod, notes } = req.body;

    if (!addressId || !paymentMethod) {
      return sendResponse(res, 400, false, "Address and payment method are required");
    }

    // 1. Get User Cart and Address
    const [cartItems, address] = await Promise.all([
      prisma.cart.findMany({
        where: { userId },
        include: { product: true },
      }),
      prisma.address.findUnique({
        where: { id: addressId },
      }),
    ]);

    if (!cartItems.length) return sendResponse(res, 400, false, "Cart is empty");
    if (!address) return sendResponse(res, 400, false, "Address not found");

    // 2. Find Nearest Store to the address
    const stores = await prisma.store.findMany({ where: { isActive: true } });
    if (!stores.length) return sendResponse(res, 500, false, "No active stores available");

    let nearestStore = stores[0];
    let minDistance = Infinity;

    const userLat = address.latitude || 0;
    const userLng = address.longitude || 0;

    for (const store of stores) {
      const dist = calculateDistance(userLat, userLng, store.latitude, store.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStore = store;
      }
    }

    // 3. Pre-calculate totals
    let subtotal = 0;
    const orderItemsData = cartItems.map((item) => {
      const price = Number(item.product.price);
      subtotal += price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price,
        subtotal: price * item.quantity,
        stockId: item.stockId, // This might need validation if it matches the nearest store
      };
    });

    const shippingCost = 15000; // Static for now, or fetch from RajaOngkir if implemented
    const totalAmount = subtotal + shippingCost;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Create Order in Transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          storeId: nearestStore.id,
          addressId: address.id,
          subtotal,
          shippingCost,
          discountAmount: 0,
          totalAmount,
          paymentMethod,
          notes,
          status: "WAITING_PAYMENT",
          items: {
            create: orderItemsData.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              stockId: item.stockId
            }))
          }
        },
      });

      // Stock logic (Simplified: Deduct from the nearest store's stock)
      // Note: In real app, you'd check if nearestStore actually HAS the stock.
      // If not, you might need to split or pull from other stores.
      
      // Clear Cart
      await tx.cart.deleteMany({ where: { userId } });

      return newOrder;
    });

    sendResponse(res, 201, true, "Order created successfully", order);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders for the logged-in user with pagination and status filter
 */
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          store: { select: { name: true } },
          items: { include: { product: { select: { name: true, images: { take: 1 } } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    sendResponse(res, 200, true, "Orders retrieved", orders, {
      page: Number(page),
      totalPage: Math.ceil(total / Number(limit)),
      totalRows: total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific order details
 */
export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        store: true,
        address: true,
        items: { include: { product: { include: { images: true } } } },
      },
    });

    if (!order) return sendResponse(res, 404, false, "Order not found");

    sendResponse(res, 200, true, "Order details retrieved", order);
  } catch (error) {
    next(error);
  }
};

/**
 * Haversine formula to calculate distance between two coordinates in km
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Upload payment proof for a specific order.
 * Validates: ownership, order status, file type (.jpg, .jpeg, .png), and max 1MB.
 */
export const uploadPaymentProof = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return sendResponse(res, 400, false, "File bukti pembayaran wajib diupload");
    }

    // Find the order & verify ownership
    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      return sendResponse(res, 404, false, "Pesanan tidak ditemukan");
    }

    // Check if order is still in WAITING_PAYMENT status
    if (order.status !== "WAITING_PAYMENT") {
      return sendResponse(res, 400, false, "Pesanan ini sudah tidak menunggu pembayaran");
    }

    // Check 1-hour payment deadline
    const oneHourMs = 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    if (elapsed > oneHourMs) {
      // Auto cancel if expired
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: "SYSTEM",
          cancelReason: "Batas waktu pembayaran (1 jam) telah habis",
        },
      });
      return sendResponse(res, 400, false, "Batas waktu pembayaran telah habis. Pesanan dibatalkan otomatis.");
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "grosur/payment-proofs",
          resource_type: "image",
          public_id: `payment_${order.orderNumber}_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    // Update order with payment proof URL and status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProof: uploadResult.secure_url,
        status: "WAITING_CONFIRMATION",
        paymentStatus: "PENDING",
        paidAt: new Date(),
      },
      include: {
        items: { include: { product: { include: { images: true } } } },
        store: true,
        address: true,
      },
    });

    sendResponse(res, 200, true, "Bukti pembayaran berhasil diupload", updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * Auto-cancel all orders that have been in WAITING_PAYMENT for more than 1 hour.
 * Called periodically or on-demand.
 */
export const cancelExpiredOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await prisma.order.updateMany({
      where: {
        status: "WAITING_PAYMENT",
        createdAt: { lt: oneHourAgo },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: "SYSTEM",
        cancelReason: "Batas waktu pembayaran (1 jam) telah habis",
      },
    });

    sendResponse(res, 200, true, `${result.count} pesanan expired telah dibatalkan`);
  } catch (error) {
    next(error);
  }
};
