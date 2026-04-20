import { Request, Response, NextFunction } from "express";
import { checkRole } from "../utils/role.util";
import { sendResponse } from "../utils/response.util";

// Task 2.1.12: Middleware untuk proteksi route web /admin/** (Redirect non-admin ke /)
export const adminRedirectMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;
  const isAllowed = checkRole(user?.role, ["SUPER_ADMIN", "STORE_ADMIN"]);

  if (!isAllowed) {
    return res.redirect("/");
  }
  next();
};

// Task 2.1.13: API Middleware untuk /api/admin/* (Return 403 kalau role salah)
export const adminApiMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;
  const isAllowed = checkRole(user?.role, ["SUPER_ADMIN", "STORE_ADMIN"]);

  if (!isAllowed) {
    // Return 403 JSON response
    return sendResponse(
      res,
      403,
      false,
      "Forbidden: Required Admin Role",
      undefined,
      undefined,
      "FORBIDDEN",
    );
  }
  next();
};
