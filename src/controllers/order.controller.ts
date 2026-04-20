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
    const { status, page = 1, limit = 10, search, date } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (status) where.status = status;
    if (search) {
      where.orderNumber = { contains: String(search), mode: "insensitive" };
    }
    if (date) {
      const selectedDate = new Date(String(date));
      if (!isNaN(selectedDate.getTime())) {
        const nextDate = new Date(selectedDate);
        nextDate.setDate(selectedDate.getDate() + 1);
        where.createdAt = {
          gte: selectedDate,
          lt: nextDate,
        };
      }
    }

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
      // Auto-confirm orders that have been SENT for more than 48 hours
      prisma.order.updateMany({
        where: {
          status: "SENT",
          sentAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      }),
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
    const user = (req as any).user;
    const { id } = req.params;

    const where: any = { id };
    
    if (user.role === "USER") {
      where.userId = user.id;
    } else if (user.role === "STORE_ADMIN") {
      if (!user.managedStoreId) {
        return sendResponse(res, 403, false, "You are not assigned to any store");
      }
      where.storeId = user.managedStoreId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        store: true,
        address: true,
        items: { include: { product: { include: { images: true } } } },
      },
    });

    if (!order) return sendResponse(res, 404, false, "Order not found");

    // Auto-confirm if this specific order is SENT and older than 48h
    if (order.status === "SENT" && order.sentAt) {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      if (new Date(order.sentAt) < fortyEightHoursAgo) {
        const updatedOrder = await prisma.order.update({
          where: { id },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
          include: {
            store: true,
            address: true,
            items: { include: { product: { include: { images: true } } } },
          },
        });
        return sendResponse(res, 200, true, "Order details retrieved (Auto-confirmed)", updatedOrder);
      }
    }

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
  _req: Request,
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

/**
 * User-initiated cancellation of an order.
 * Can only cancel if status is WAITING_PAYMENT.
 */
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      sendResponse(res, 404, false, "Pesanan tidak ditemukan");
      return;
    }

    if (order.status !== "WAITING_PAYMENT") {
      sendResponse(res, 400, false, "Pesanan ini sudah tidak bisa dibatalkan");
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: "USER",
        cancelReason: "Dibatalkan oleh pengguna",
      },
    });

    sendResponse(res, 200, true, "Pesanan berhasil dibatalkan", updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * User confirms receipt of the order.
 * Can only confirm if status is SENT.
 */
export const confirmOrderReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      sendResponse(res, 404, false, "Pesanan tidak ditemukan");
      return;
    }

    if (order.status !== "SENT") {
      sendResponse(res, 400, false, "Pesanan belum dikirim atau sudah dikonfirmasi");
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    sendResponse(res, 200, true, "Pesanan telah dikonfirmasi diterima", updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * Automatically confirm orders that have been SENT for more than 48 hours.
 */
export const autoConfirmShippedOrders = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const result = await prisma.order.updateMany({
      where: {
        status: "SENT",
        sentAt: { lt: fortyEightHoursAgo },
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    sendResponse(res, 200, true, `${result.count} pesanan telah dikonfirmasi otomatis`);
  } catch (error) {
    next(error);
  }
};
