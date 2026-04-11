import { Request, Response, NextFunction } from "express";
import * as productService from "../services/product.service";

export const getPublicProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { storeId, search, categoryId, page, limit } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required for catalog access",
      });
    }

    const products = await productService.getPublicProducts({
      storeId: storeId as string,
      search: (search as string) || undefined,
      categoryId: (categoryId as string) || undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 12,
    });

    return res.status(200).json({
      success: true,
      ...products,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await productService.getCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
      return;
    }

    const product = await productService.updateProduct(productId, req.body, storeId);
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
      return;
    }

    const result = await productService.deleteProduct(
      productId,
      storeId as string,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const uploadProductImages = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId, storeId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "No files uploaded",
        errorCode: "NO_FILES_UPLOADED",
      });
      return;
    }

    const result = await productService.uploadProductImages(
      productId,
      storeId,
      files,
    );
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
