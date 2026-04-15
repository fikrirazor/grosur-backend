import { Request, Response, NextFunction } from "express";
import * as productService from "../services/product.service";
import prisma from "../config/database";

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

export const getPublicProductDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params; // This could be an ID or a Slug
    const { storeId, userLat, userLong } = req.query;

    let product;

    // 1. If it looks like a UUID, we can try the ID-based service
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

    if (!isUUID && storeId) {
      // 2. If it's a slug and we have a storeId, use the specialized public detail service
      product = await productService.getPublicProductDetail(productId, storeId as string);
      
      // 3. Resilience: If not found in THIS store, check if it exists in ANY store
      if (!product) {
         const globalCheck = await prisma.product.findUnique({ where: { slug: productId }, include: { stocks: { include: { store: true } } } });
         if (globalCheck) {
            // Find a store that HAS this product
            const availableStore = globalCheck.stocks.find(s => s.quantity > 0);
            const message = availableStore 
              ? `Produk ini tidak tersedia di cabang terpilih, tapi tersedia di ${availableStore.store.name}.`
              : `Produk ini ada di katalog kami, namun sedang habis di semua cabang.`;
            
            res.status(404).json({
              success: false,
              message,
              availableAt: availableStore?.storeId
            });
            return;
         }
      }
    } else {
      // 4. Otherwise use the standard detailed lookup (handles nearest store logic)
      product = await productService.getProductDetail(
        productId,
        userLat ? parseFloat(userLat as string) : undefined,
        userLong ? parseFloat(userLong as string) : undefined,
        storeId as string | undefined
      );
    }

    if (!product) {
      res.status(404).json({
        success: false,
        message: `Product "${productId}" not found in the selected store (${storeId || 'no store provided'}). Please ensure the product is active and available at this location.`,
        debug: { productId, storeId }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const product = await productService.getProductById(productId);
    res.status(200).json({
      success: true,
      data: product,
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
