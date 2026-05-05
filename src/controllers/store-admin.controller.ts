import { Request, Response, NextFunction } from "express";
import * as storeAdminService from "../services/store-admin.service";
import { sendResponse } from "../utils/response.util";
import { createAuditLog } from "../utils/audit.util";

export const createStoreAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin = await storeAdminService.createStoreAdmin(req.body);
    await createAuditLog(
      "CREATE_STORE_ADMIN",
      (req as any).user.id,
      admin.id,
      "User",
      req.body,
    );
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
    sendResponse(res, 200, true, "Store Admins retrieved", admins, {
      page: pagination.page,
      totalPage: pagination.totalPage,
      totalRows: pagination.total,
    });
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
    await createAuditLog(
      "UPDATE_STORE_ADMIN",
      (req as any).user.id,
      admin.id,
      "User",
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
    await createAuditLog(
      "DELETE_STORE_ADMIN",
      (req as any).user.id,
      req.params.id,
      "User",
    );
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
