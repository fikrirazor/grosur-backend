import { Request, Response, NextFunction } from "express";
import * as stockJournalService from "../services/stock-journal.service";

export const getStockJournals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      stockId,
      productId,
      storeId,
      type,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const journals = await stockJournalService.getStockJournals({
      stockId: stockId as string,
      productId: productId as string,
      storeId: storeId as string,
      type: type as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    });

    res.status(200).json({
      success: true,
      ...journals,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockJournalStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { stockId } = req.params;

    if (!stockId) {
      res.status(400).json({
        success: false,
        message: "Stock ID is required",
      });
      return;
    }

    const stats = await stockJournalService.getStockJournalStats(stockId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
