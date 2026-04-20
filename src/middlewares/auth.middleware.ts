import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/env";
import prisma from "../config/database";
import { sendResponse } from "../utils/response.util";
import { Role } from "../generated/prisma";

interface JwtPayload {
  id: string;
  role: Role;
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token)
      return sendResponse(
        res,
        401,
        false,
        "No token provided.",
        undefined,
        undefined,
        "UNAUTHORIZED",
      );

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await fetchAuthUser(decoded.id);

    if (!user)
      return sendResponse(
        res,
        401,
        false,
        "User not found.",
        undefined,
        undefined,
        "UNAUTHORIZED",
      );

    (req as any).user = user;
    next();
  } catch (error) {
    handleAuthError(res, error);
  }
};

const extractToken = (req: Request) =>
  req.cookies?.token ||
  req.cookies?.access_token ||
  (req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.substring(7)
    : null);

const fetchAuthUser = async (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      managedStore: true,
      phone: true,
      photo: true,
      referralCode: true,
    },
  });

const handleAuthError = (res: Response, error: any) => {
  const expired = error instanceof jwt.TokenExpiredError;
  const message = expired ? "Token expired." : "Invalid token.";
  const code = expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN";
  sendResponse(
    res,
    401,
    false,
    `${message} Authorization denied.`,
    undefined,
    undefined,
    code,
  );
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !allowedRoles.includes(userRole as Role)) {
      return sendResponse(res, 403, false, "Forbidden: Access denied.");
    }
    next();
  };
};

export const authorizeRoles = (...roles: string[]) => requireRole(roles as Role[]);
