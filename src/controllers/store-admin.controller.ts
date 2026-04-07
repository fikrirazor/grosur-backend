import { Request, Response, NextFunction } from "express";
import * as storeAdminService from "../services/store-admin.service";
import { sendResponse } from "../utils/response.util";

export const createStoreAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin = await storeAdminService.createStoreAdmin(req.body);
    sendResponse(res, 201, true, "Store Admin created successfully", admin);
  } catch (error) {
    next(error);
  }
};

export const getStoreAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { admins, pagination } = await storeAdminService.getStoreAdmins(
      req.query,
    );
    sendResponse(res, 200, true, "Store Admins retrieved", admins, pagination);
  } catch (error) {
    next(error);
  }
};

export const updateStoreAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin = await storeAdminService.updateStoreAdmin(
      req.params.id,
      req.body,
    );
    sendResponse(res, 200, true, "Store Admin updated successfully", admin);
  } catch (error) {
    next(error);
  }
};

export const deleteStoreAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await storeAdminService.deleteStoreAdmin(req.params.id);
    sendResponse(res, 200, true, "Store Admin deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getStores = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stores = await storeAdminService.getStores();
    sendResponse(res, 200, true, "Stores retrieved successfully", stores);
  } catch (error) {
    next(error);
  }
};

