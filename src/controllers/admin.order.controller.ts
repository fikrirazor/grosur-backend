import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { sendResponse } from "../utils/response.util";

/**
 * Get all orders for admin with filtering by store and pagination.
 */
export const getAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { status, storeId, page = 1, limit = 10, search, date } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // 1. Role-based restrictions
    if (user.role === "STORE_ADMIN") {
      // Store admin can only see orders from their managed store
      if (!user.managedStoreId) {
        return sendResponse(res, 403, false, "You are not assigned to any store");
      }
      where.storeId = user.managedStoreId;
    } else if (user.role === "SUPER_ADMIN") {
      // Super admin can filter by storeId
      if (storeId) {
        where.storeId = String(storeId);
      }
    } else {
      return sendResponse(res, 403, false, "Forbidden: Unauthorized role");
    }

    // 2. Filters
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search), mode: "insensitive" } },
        { user: { name: { contains: String(search), mode: "insensitive" } } },
        { user: { email: { contains: String(search), mode: "insensitive" } } },
      ];
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

    // 3. Fetch orders
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          store: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
          address: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    sendResponse(res, 200, true, "Orders retrieved successfully", orders, {
      page: Number(page),
      totalPage: Math.ceil(total / Number(limit)),
      totalRows: total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single order detail for admin.
 */
export const getAdminOrderDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userMiddleware = (req as any).user;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        store: { select: { name: true } },
        items: { include: { product: { select: { name: true, images: true } } } },
        address: true,
      },
    });

    if (!order) {
      return sendResponse(res, 404, false, "Order not found");
    }

    // Role-based access control
    if (userMiddleware.role === "STORE_ADMIN" && order.storeId !== userMiddleware.managedStoreId) {
      return sendResponse(res, 403, false, "Forbidden: This order belongs to another store");
    }

    sendResponse(res, 200, true, "Order detail retrieved successfully", order);
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm or reject payment for an order.
 */
export const confirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userMiddleware = (req as any).user;
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return sendResponse(res, 404, false, "Order not found");
    }

    if (order.status !== "WAITING_CONFIRMATION") {
      return sendResponse(res, 400, false, "Order is not waiting for confirmation");
    }

    // Role-based access control
    if (userMiddleware.role === "STORE_ADMIN" && order.storeId !== userMiddleware.managedStoreId) {
      return sendResponse(res, 403, false, "Forbidden: This order belongs to another store");
    }

    let newStatus: any;
    let paymentStatus: any;
    let updateData: any = {};

    if (action === "accept") {
      newStatus = "PROCESSED";
      paymentStatus = "PAID";
      updateData = {
        status: newStatus,
        paymentStatus: paymentStatus,
        paidAt: new Date(),
      };
    } else if (action === "reject") {
      newStatus = "WAITING_PAYMENT";
      paymentStatus = "REJECTED";
      updateData = {
        status: newStatus,
        paymentStatus: paymentStatus,
        paymentProof: null, // Clear proof so user can re-upload
      };
    } else {
      return sendResponse(res, 400, false, "Invalid action. Use 'accept' or 'reject'");
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    sendResponse(res, 200, true, `Payment ${action === "accept" ? "accepted" : "rejected"} successfully`, updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * Change order status to SENT (Dikirim).
 */
export const sendOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userMiddleware = (req as any).user;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return sendResponse(res, 404, false, "Order not found");
    }

    if (order.status !== "PROCESSED") {
      return sendResponse(res, 400, false, "Order must be in PROCESSED status before shipping");
    }

    // Role-based access control
    if (userMiddleware.role === "STORE_ADMIN" && order.storeId !== userMiddleware.managedStoreId) {
      return sendResponse(res, 403, false, "Forbidden: This order belongs to another store");
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    sendResponse(res, 200, true, "Order status updated to SENT successfully", updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order by admin.
 * Can cancel any order before SENT (Dikirim).
 * Returns stock to the inventory and records it in the StockJournal.
 */
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = (req as any).user;
    const { id } = req.params;
    const { cancelReason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return sendResponse(res, 404, false, "Order not found");
    }

    // Role-based access control
    if (admin.role === "STORE_ADMIN" && order.storeId !== admin.managedStoreId) {
      return sendResponse(res, 403, false, "Forbidden: This order belongs to another store");
    }

    // Can only cancel before SENT
    const allowedStatuses: string[] = ["WAITING_PAYMENT", "WAITING_CONFIRMATION", "PROCESSED"];
    if (!allowedStatuses.includes(order.status)) {
      return sendResponse(res, 400, false, `Order with status ${order.status} cannot be cancelled`);
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: "ADMIN",
          cancelReason: cancelReason || "Cancelled by admin",
        },
      });

      // 2. Return Stock and Create Journal for each item
      for (const item of order.items) {
        // Fetch current stock
        const stock = await tx.stock.findUnique({
          where: { id: item.stockId },
        });

        if (stock) {
          const oldQty = stock.quantity;
          const newQty = oldQty + item.quantity;

          // Update Stock
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: newQty },
          });

          // Create Stock Journal
          await tx.stockJournal.create({
            data: {
              stockId: stock.id,
              oldQty: oldQty,
              newQty: newQty,
              change: item.quantity,
              type: "RETURN",
              reason: `Order ${order.orderNumber} cancelled by admin`,
              orderId: order.id,
              userId: admin.id,
            },
          });
        }
      }

      return updated;
    });

    sendResponse(res, 200, true, "Order cancelled successfully and stock returned", updatedOrder);
  } catch (error) {
    next(error);
  }
};
