import { Request, Response, NextFunction } from "express";
import * as checkoutService from "../services/checkout.service";

export const previewCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const { storeId, items, voucherCode } = req.body;

    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Store ID and items array are required",
      });
      return;
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        res.status(400).json({
          success: false,
          message: "Each item must have productId, quantity, and price",
        });
        return;
      }
    }

    const result = await checkoutService.previewCheckout({
      userId,
      storeId,
      items,
      voucherCode,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
