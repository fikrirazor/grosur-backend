import { Request, Response, NextFunction } from "express";
import * as salesService from "../services/sales.service";
import * as reportService from "../services/report.service";

export const getSalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { storeId, month, year, page, limit } = req.query;

    const report = await salesService.getSalesReport(
      userId,
      role,
      storeId as string | undefined,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );

    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

export const exportSalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { storeId, month, year } = req.query;

    const csvContent = await salesService.getSalesReportCSV(
      userId,
      role,
      storeId as string | undefined,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${year}-${month || "all"}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const getStockSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { storeId, month, year } = req.query;

    const report = await reportService.getStockSummaryReport(
      userId,
      role,
      storeId as string | undefined,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );

    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

export const getStockDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, storeId, month, year } = req.query;

    if (!productId || !storeId || !month || !year) {
      res.status(400).json({ success: false, message: "Missing required parameters" });
      return;
    }

    const detail = await reportService.getStockDetailReport(
      productId as string,
      storeId as string,
      parseInt(month as string),
      parseInt(year as string)
    );

    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    next(error);
  }
};
