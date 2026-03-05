import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/env";
import prisma from "../config/database";
import { sendResponse } from "../utils/response.util";

interface JwtPayload {
  userId: string;
  email: string;
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) return sendResponse(res, 401, false, "No token provided.");
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await fetchAuthUser(decoded.userId);
    if (!user) return sendResponse(res, 401, false, "User not found.");
    (req as any).user = user;
    next();
  } catch (error) {
    handleAuthError(res, error);
  }
};

const extractToken = (req: Request) =>
  req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.substring(7)
    : null;

const fetchAuthUser = async (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isVerified: true },
  });

const handleAuthError = (res: Response, error: any) => {
  const expired = error instanceof jwt.TokenExpiredError;
  const message = expired ? "Token expired." : "Invalid token.";
  sendResponse(res, 401, false, `${message} Authorization denied.`);
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!roles.includes(userRole)) {
      return sendResponse(res, 403, false, "Forbidden: Access denied.");
    }
    next();
  };
};
