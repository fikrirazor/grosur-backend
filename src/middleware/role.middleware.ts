import { Request, Response, NextFunction } from "express";

interface MockUser {
  id: string;
  email: string;
  role: "USER" | "STORE_ADMIN" | "SUPER_ADMIN";
}

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as MockUser | undefined;
    const userRole = user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Required role: ${roles.join(", ")}`,
      });
    }
    next();
  };
};
