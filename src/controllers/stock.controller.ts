import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";
import * as stockService from "../services/stock.service";

export const updateStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, storeId, change, reason } = req.body;
    const user = (req as any).user;
    const userId = user.id;
    const userRole = user.role;

    // Role-based store scoping
    let targetStoreId = storeId;

    if (userRole === "STORE_ADMIN") {
      // STORE_ADMIN: otomatis pakai store miliknya
      const storeAdmin = await prisma.user.findUnique({
        where: { id: userId },
        select: { managedStoreId: true },
      });

      if (!storeAdmin?.managedStoreId) {
        throw new AppError(
          403,
          "STORE_ADMIN must have an assigned store",
          true,
          "NO_STORE_ASSIGNED",
        );
      }

      // Override storeId dengan store milik admin
      targetStoreId = storeAdmin.managedStoreId;
    } else if (userRole !== "SUPER_ADMIN") {
      throw new AppError(
        403,
        "Insufficient permissions",
        true,
        "FORBIDDEN",
      );
    }

    // SUPER_ADMIN: bisa pilih storeId dari request

    const result = await stockService.updateStock({
      productId,
      storeId: targetStoreId,
      change,
      reason,
      userId,
    });

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const transferStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, fromStoreId, toStoreId, quantity, reason } = req.body;
    const userId = (req as any).user.id;

    const result = await stockService.transferStock({
      productId,
      fromStoreId,
      toStoreId,
      quantity,
      reason,
      userId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
