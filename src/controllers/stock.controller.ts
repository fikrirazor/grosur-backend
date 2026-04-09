import { Request, Response, NextFunction } from "express";
import * as stockService from "../services/stock.service";

export const updateStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, storeId, change, reason } = req.body;
    const userId = (req as any).user.id;

    const result = await stockService.updateStock({
      productId,
      storeId,
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
