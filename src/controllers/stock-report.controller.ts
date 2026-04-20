import { Request, Response, NextFunction } from "express";
import * as stockReportService from "../services/stock-report.service";

export const getStockReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user?.id || !req.user?.role) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Extract query parameters
    const { storeId, productId, month, year, page, limit } = req.query;

    // Convert types
    const monthNum = month ? parseInt(month as string) : undefined;
    const yearNum = year ? parseInt(year as string) : undefined;
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;

    // Call service
    const result = await stockReportService.getStockReport(
      req.user.id,
      req.user.role,
      storeId as string | undefined,
      productId as string | undefined,
      monthNum,
      yearNum,
      pageNum,
      limitNum
    );

    // Return success response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};