import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";

export const getStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      success: true,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};
