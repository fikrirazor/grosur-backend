import { Response } from "express";

interface PaginationInfo {
  page: number;
  totalPage: number;
  totalRows: number;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  pagination?: PaginationInfo,
  code?: string,
): void => {
  res.status(statusCode).json({
    success,
    message,
    ...(code !== undefined && { code }),
    ...(data !== undefined && { data }),
    ...(pagination !== undefined && { pagination }),
  });
};
