import { Request, Response, NextFunction } from "express";
import * as adminUserService from "../services/admin.user.service";
import { sendResponse } from "../utils/response.util";

/**
 * @desc Get all registered users (Super Admin only)
 * @route GET /api/admin/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { users, pagination } = await adminUserService.getAllUsers(req.query);
    sendResponse(
      res,
      200,
      true,
      "Users list retrieved successfully",
      users,
      pagination,
    );
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await adminUserService.createUser(req.body);
    sendResponse(res, 201, true, "User created successfully", user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await adminUserService.updateUser(req.params.id, req.body);
    sendResponse(res, 200, true, "User updated successfully", user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await adminUserService.deleteUser(req.params.id);
    sendResponse(res, 200, true, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};
