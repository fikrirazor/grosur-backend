import { Request, Response, NextFunction } from "express";
import * as stockReportService from "../services/stock-report.service";
import { parseQueryParams } from "../utils/query.util";

export const getStockReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.role) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const filters = parseQueryParams(req.query);

    const result = await stockReportService.getStockReport({
      userId: req.user.id,
      role: req.user.role,
      ...filters
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
