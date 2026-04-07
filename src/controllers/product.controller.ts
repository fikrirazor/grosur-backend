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

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
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

export const getPublicProductDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "storeId is required",
      });
    }

    const product = await productService.getPublicProductDetail(slug, storeId as string);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not available in this store",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
