import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) return void handleZodError(err, res);
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  if (err.name === "PrismaClientKnownRequestError")
    return void handlePrismaError(err, res);

  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

const handleZodError = (err: ZodError, res: Response) => {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  });
};

const handlePrismaError = (err: any, res: Response) => {
  const codes: Record<string, { status: number; msg: string }> = {
    P2002: { status: 409, msg: "Record already exists." },
    P2025: { status: 404, msg: "Record not found." },
  };
  const { status = 500, msg = "Database error" } = codes[err.code] || {};
  res.status(status).json({ success: false, message: msg });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
};
