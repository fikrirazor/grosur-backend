import { Request, Response, NextFunction } from "express";
import * as salesService from "../services/sales.service";

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
      limit ? parseInt(limit as string) : 20
    );

    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
