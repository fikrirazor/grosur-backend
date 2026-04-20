import { Request, Response, NextFunction } from "express";
import * as discountService from "../services/discount.service";

export const createDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const userRole = user.role;

    const discount = await discountService.createDiscount(req.body, userId, userRole);

    res.status(201).json({
      success: true,
      message: "Discount created successfully",
      data: discount,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discountId } = req.params;
    const user = (req as any).user;
    const userId = user.id;
    const userRole = user.role;

    const discount = await discountService.updateDiscount(discountId, req.body, userId, userRole);

    res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      data: discount,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { discountId } = req.params;
    const user = (req as any).user;
    const userId = user.id;
    const userRole = user.role;

    const result = await discountService.deleteDiscount(discountId, userId, userRole);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getStoreDiscounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { storeId } = req.query;
    const user = (req as any).user;
    const userId = user.id;
    const userRole = user.role;

    if (!storeId || typeof storeId !== "string") {
      res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
      return;
    }

    const discounts = await discountService.getStoreDiscounts(storeId, userId, userRole);

    res.status(200).json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    next(error);
  }
};
