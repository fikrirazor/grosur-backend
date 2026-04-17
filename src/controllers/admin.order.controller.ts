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
