import { Request, Response, NextFunction } from "express";
import * as salesService from "../services/sales.service";
import * as reportService from "../services/report.service";
import prisma from "../config/database";

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
    const { productId, storeId, startDate, endDate, page, limit } = req.query;
    const { userId, role } = req.user as any;

    if (!productId) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    // Role-based store selection
    let targetStoreId = storeId as string;
    if (role === "STORE_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { managedStoreId: true }
      });
      if (!user?.managedStoreId) {
        res.status(403).json({ success: false, message: "Admin has no managed store" });
        return;
      }
      targetStoreId = user.managedStoreId;
    }

    if (!targetStoreId) {
      res.status(400).json({ success: false, message: "Store ID is required" });
      return;
    }

    const end = endDate ? new Date(endDate as string) : undefined;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    const detail = await reportService.getStockDetailReport(
      productId as string,
      targetStoreId,
      startDate ? new Date(startDate as string) : undefined,
      end,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.status(200).json(detail);
  } catch (error) {
    next(error);
  }
};
