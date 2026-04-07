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
