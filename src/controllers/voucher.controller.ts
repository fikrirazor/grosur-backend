import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import * as voucherService from "../services/voucher.service";

export const validateVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code, cartTotal, productId } = req.body;
    const userId = (req as any).user.id;

    if (!code || !cartTotal) {
      res.status(400).json({
        success: false,
        message: "Voucher code and cart total are required",
      });
      return;
    }

    const result = await voucherService.validateVoucher({
      voucherCode: code,
      userId,
      cartTotal: Number(cartTotal),
      productId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const useVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code, orderId } = req.body;
    const userId = (req as any).user.id;

    if (!code || !orderId) {
      res.status(400).json({
        success: false,
        message: "Voucher code and order ID are required",
      });
      return;
    }

    const result = await voucherService.useVoucher(code, userId, orderId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserVouchers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;

    const vouchers = await prisma.voucher.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    next(error);
  }
};

export const claimVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const payload = req.body;

    const voucher = await voucherService.claimVoucher(userId, payload);

    res.status(201).json({
      success: true,
      message: "Voucher berhasil diklaim",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};
