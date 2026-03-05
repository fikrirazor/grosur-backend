import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/user.service";
import { sendResponse } from "../utils/response.util";

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserById(userId);
    sendResponse(res, 200, true, "User profile retrieved", { user });
  } catch (error) {
    next(error);
  }
};
