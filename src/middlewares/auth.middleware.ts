import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // CRITICAL FIX: Check cookies FIRST, and if empty, fallback to the Authorization header
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized: Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded as { id: string; role: Role };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    return next();
  };
};