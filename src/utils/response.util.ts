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
  pagination?: PaginationInfo
): void => {
  res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined && { data }),
    ...(pagination !== undefined && { pagination }),
  });
};
