import { Request, Response, NextFunction } from "express";
import * as stockJournalService from "../services/stock-journal.service";
import { parseQueryParams } from "../utils/query.util";

export const getStockJournals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = parseQueryParams(req.query);

    const journals = await stockJournalService.getStockJournals(filters);

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
      res.status(400).json({ success: false, message: "Stock ID is required" });
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
