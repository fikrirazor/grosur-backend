import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import {
  ProductQuery,
  CreateProductInput,
  UpdateProductInput,
  ProductListItem,
  ProductDetailItem,
  PaginationMeta,
} from "../types/product.types";
import { generateSlug } from "../utils/slug.util";
import { formatPaginationMeta } from "../utils/pagination.util";
import {
  findProductOrThrow,
  mapToProductListItem,
  mapToProductDetailItem,
  resolveTargetStoreId,
  getPublicProductInclude,
  buildProductWhereClause,
} from "./helpers/product.helper";

export const getPublicProducts = async (
  query: ProductQuery,
): Promise<{ items: ProductListItem[]; meta: PaginationMeta }> => {
  const { storeId, search, categoryId, page, limit } = query;
  const now = new Date();

  const where = buildProductWhereClause({ storeId, search, categoryId });

  const [items, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      include: getPublicProductInclude(now),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { product: { name: "asc" } },
    }),
    prisma.stock.count({ where }),
  ]);

  return {
    items: items.map(mapToProductListItem),
    meta: formatPaginationMeta(total, page, limit),
  };
};

export const getPublicProductDetail = async (
  slug: string,
  storeId: string,
): Promise<ProductDetailItem | null> => {
  const now = new Date();
  const stock = await prisma.stock.findFirst({
    where: {
      storeId,
      product: { slug, isActive: true },
    },
    include: getPublicProductInclude(now),
  });

  return stock ? mapToProductDetailItem(stock) : null;
};

export const getCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
};

export const getProductById = async (productIdOrSlug: string) => {
  return await findProductOrThrow(productIdOrSlug);
};

export const createProduct = async (data: CreateProductInput) => {
  const { name, description, price, categoryId, storeId } = data;

  const [store, category] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.category.findUnique({ where: { id: categoryId } }),
  ]);

  if (!store)
    throw new AppError(404, "Store not found", true, "STORE_NOT_FOUND");
  if (!category)
    throw new AppError(404, "Category not found", true, "CATEGORY_NOT_FOUND");

  const existingProduct = await prisma.product.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      stocks: { some: { storeId } },
    },
  });

  if (existingProduct) {
    throw new AppError(
      409,
      `Product "${name}" already exists in this store`,
      true,
      "PRODUCT_DUPLICATE",
    );
  }

  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: { name, slug: generateSlug(name), description, price, categoryId },
    });

    await tx.stock.create({
      data: { productId: product.id, storeId, quantity: 0 },
    });

    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        images: true,
        stocks: { where: { storeId } },
      },
    });
  });
};

export const updateProduct = async (
  productIdOrSlug: string,
  data: UpdateProductInput,
  storeId: string,
) => {
  const productRecord = await findProductOrThrow(productIdOrSlug, storeId);

  if (data.name && data.name !== productRecord.name) {
    const duplicate = await prisma.product.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        stocks: { some: { storeId } },
        id: { not: productRecord.id },
      },
    });

    if (duplicate) {
      throw new AppError(
        409,
        `Product "${data.name}" already exists in this store`,
        true,
        "PRODUCT_DUPLICATE",
      );
    }
  }

  return await prisma.product.update({
    where: { id: productRecord.id },
    data: {
      ...data,
      slug: data.name ? generateSlug(data.name) : undefined,
    },
    include: {
      category: true,
      images: true,
      stocks: { where: { storeId } },
    },
  });
};

export const deleteProduct = async (
  productIdOrSlug: string,
  storeId: string,
) => {
  const product = await findProductOrThrow(productIdOrSlug, storeId);
  await prisma.product.update({
    where: { id: product.id },
    data: { isActive: false },
  });
  return { success: true, message: "Product deleted successfully" };
};

export const uploadProductImages = async (
  productIdOrSlug: string,
  storeId: string,
  files: Express.Multer.File[],
) => {
  const product = await findProductOrThrow(productIdOrSlug, storeId);
  const uploadedUrls = files.map((file: any) => file.path);

  const images = await prisma.$transaction(
    uploadedUrls.map((url) =>
      prisma.productImage.create({
        data: { url, productId: product.id },
      }),
    ),
  );

  return { message: `${images.length} image(s) uploaded successfully`, images };
};

export const getProductDetail = async (
  productId: string,
  userLat?: number,
  userLong?: number,
  storeId?: string,
) => {
  const targetStoreId = await resolveTargetStoreId(storeId, userLat, userLong);
  const product = await findProductOrThrow(productId, targetStoreId);
  const stock = product.stocks[0];

  return {
    ...product,
    stocks: undefined,
    stock: stock?.quantity || 0,
    storeId: targetStoreId,
  };
};
