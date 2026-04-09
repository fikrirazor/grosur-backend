import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { sendResponse } from "../utils/response.util";

/**
 * Get all addresses for the logged-in user
 */
export const getAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    sendResponse(res, 200, true, "Addresses retrieved", addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new address
 */
export const createAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { name, phone, province, city, district, detail, postalCode, isDefault, latitude, longitude } = req.body;

    // If this is the first address, make it default
    const addressCount = await prisma.address.count({ where: { userId } });
    const finalIsDefault = addressCount === 0 ? true : isDefault;

    // If setting as default, unset other defaults
    if (finalIsDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        name,
        phone,
        province,
        city,
        district,
        detail,
        postalCode,
        isDefault: !!finalIsDefault,
        latitude: latitude ? parseFloat(latitude.toString()) : null,
        longitude: longitude ? parseFloat(longitude.toString()) : null,
      },
    });

    sendResponse(res, 201, true, "Address created successfully", address);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing address
 */
export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, phone, province, city, district, detail, postalCode, isDefault, latitude, longitude } = req.body;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      return sendResponse(res, 404, false, "Address not found");
    }

    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        name,
        phone,
        province,
        city,
        district,
        detail,
        postalCode,
        isDefault: !!isDefault,
        latitude: latitude ? parseFloat(latitude.toString()) : null,
        longitude: longitude ? parseFloat(longitude.toString()) : null,
      },
    });

    sendResponse(res, 200, true, "Address updated successfully", address);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an address
 */
export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      return sendResponse(res, 404, false, "Address not found");
    }

    await prisma.address.delete({ where: { id } });

    // If the deleted address was default, make another one default if possible
    if (address.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId },
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    sendResponse(res, 200, true, "Address deleted successfully");
  } catch (error) {
    next(error);
  }
};
