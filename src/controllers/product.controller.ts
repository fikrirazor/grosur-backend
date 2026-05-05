import { Request, Response, NextFunction } from "express";
import * as productService from "../services/product.service";
import prisma from "../config/database";
import { sendResponse } from "../utils/response.util";

export const getPublicProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { storeId, search, categoryId, page, limit } = req.query;

    if (!storeId) {
      return sendResponse(
        res,
        400,
        false,
        "Store ID is required for catalog access",
      );
    }

    const products = await productService.getPublicProducts({
      storeId: storeId as string,
      search: (search as string) || undefined,
      categoryId: (categoryId as string) || undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 12,
    });

    return sendResponse(
      res,
      200,
      true,
      "Products fetched successfully",
      products,
    );
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await productService.getCategories();
    return sendResponse(
      res,
      200,
      true,
      "Categories fetched successfully",
      categories,
    );
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
    const { productId } = req.params;
    const { storeId, userLat, userLong } = req.query;

    let product;
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        productId,
      );

    if (!isUUID && storeId) {
      product = await productService.getPublicProductDetail(
        productId,
        storeId as string,
      );

      if (!product) {
        const globalCheck = await prisma.product.findUnique({
          where: { slug: productId },
          include: { stocks: { include: { store: true } } },
        });

        if (globalCheck) {
          const availableStore = globalCheck.stocks.find((s) => s.quantity > 0);
          const message = availableStore
            ? `Produk ini tidak tersedia di cabang terpilih, tapi tersedia di ${availableStore.store.name}.`
            : `Produk ini ada di katalog kami, namun sedang habis di semua cabang.`;

          return sendResponse(res, 404, false, message, {
            availableAt: availableStore?.storeId,
          });
        }
      }
    } else {
      product = await productService.getProductDetail(
        productId,
        userLat ? parseFloat(userLat as string) : undefined,
        userLong ? parseFloat(userLong as string) : undefined,
        storeId as string | undefined,
      );
    }

    if (!product) {
      return sendResponse(res, 404, false, `Product "${productId}" not found`);
    }

    return sendResponse(
      res,
      200,
      true,
      "Product detail fetched successfully",
      product,
    );
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
    return sendResponse(
      res,
      200,
      true,
      "Product fetched successfully",
      product,
    );
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
    return sendResponse(
      res,
      201,
      true,
      "Product created successfully",
      product,
    );
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
      return sendResponse(res, 400, false, "Store ID is required");
    }

    const product = await productService.updateProduct(
      productId,
      req.body,
      storeId,
    );
    return sendResponse(
      res,
      200,
      true,
      "Product updated successfully",
      product,
    );
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
      return sendResponse(res, 400, false, "Store ID is required");
    }

    const result = await productService.deleteProduct(
      productId,
      storeId as string,
    );
    return sendResponse(res, 200, true, "Product deleted successfully", result);
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
      return sendResponse(res, 400, false, "No files uploaded");
    }

    const result = await productService.uploadProductImages(
      productId,
      storeId,
      files,
    );
    return sendResponse(res, 200, true, "Images uploaded successfully", result);
  } catch (error) {
    next(error);
  }
};
