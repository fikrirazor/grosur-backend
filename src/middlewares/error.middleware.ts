import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public errorCode?: string;

  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    errorCode?: string,
  ) {
    super(message);
    this.errorCode = errorCode;
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
    const response: any = { success: false, message: err.message };
    if (err.errorCode) {
      response.errorCode = err.errorCode;
    }
    res.status(err.statusCode).json(response);
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
    P2002: { status: 409, msg: "Data sudah ada (duplikat)." },
    P2003: { status: 400, msg: "Gagal menghapus data karena masih terhubung dengan data lain (misal: stok, pesanan)." },
    P2023: { status: 400, msg: "Format ID atau data tidak valid." },
    P2025: { status: 404, msg: "Data tidak ditemukan." },
  };
  const { status = 500, msg = "Database error" } = codes[err.code] || {};
  res.status(status).json({ success: false, message: msg });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
};
