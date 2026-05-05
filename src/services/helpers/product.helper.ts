import prisma from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";
import {
  DiscountInfo,
  ProductListItem,
  ProductDetailItem,
} from "../../types/product.types";

/**
 * Mencari produk berdasarkan ID atau Slug, melempar error jika tidak ditemukan.
 * Bisa difilter berdasarkan storeId tertentu.
 */
export const findProductOrThrow = async (
  identifier: string,
  storeId?: string,
) => {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

  const product = await prisma.product.findFirst({
    where: {
      ...(isUUID ? { id: identifier } : { slug: identifier }),
      ...(storeId ? { stocks: { some: { storeId } } } : {}),
    },
    include: {
      category: true,
      images: { orderBy: { createdAt: "asc" } },
      stocks: storeId ? { where: { storeId } } : true,
    },
  });

  if (!product || (storeId && product.stocks.length === 0)) {
    const message = storeId
      ? "Product not found in this store"
      : "Product not found";
    throw new AppError(404, message, true, "PRODUCT_NOT_FOUND");
  }

  return product;
};

/**
 * Memformat objek diskon Prisma menjadi format standar API.
 */
export const formatDiscount = (discount: any): DiscountInfo | null => {
  if (!discount) return null;
  return {
    type: discount.type,
    value: Number(discount.value),
    minSpend: discount.minSpend ? Number(discount.minSpend) : null,
    maxDiscount: discount.maxDiscount ? Number(discount.maxDiscount) : null,
    buyQty: discount.buyQty,
    freeQty: discount.freeQty,
  };
};

/**
 * Mapping data Stock & Product menjadi item untuk daftar produk (Katalog).
 */
export const mapToProductListItem = (stock: any): ProductListItem => {
  return {
    id: stock.product.id,
    name: stock.product.name,
    slug: stock.product.slug,
    price: Number(stock.product.price),
    description: stock.product.description,
    category: stock.product.category.name,
    categoryId: stock.product.categoryId,
    image: stock.product.images[0]?.url || null,
    discount: formatDiscount(stock.product.discounts[0]),
    inventory: {
      quantity: stock.quantity,
      storeId: stock.storeId,
    },
  };
};

/**
 * Mapping data Stock & Product menjadi detail produk lengkap (Detail Page).
 */
export const mapToProductDetailItem = (stock: any): ProductDetailItem => {
  return {
    id: stock.product.id,
    name: stock.product.name,
    slug: stock.product.slug,
    description: stock.product.description,
    price: Number(stock.product.price),
    category: stock.product.category.name,
    categoryId: stock.product.categoryId,
    images: stock.product.images.map((img: any) => ({
      id: img.id,
      url: img.url,
    })),
    discount: formatDiscount(stock.product.discounts[0]),
    inventory: {
      quantity: stock.quantity,
      storeId: stock.storeId,
    },
  };
};

/**
 * Mencari toko terdekat berdasarkan koordinat latitude dan longitude user.
 */
export const findNearestStore = async (userLat: number, userLong: number) => {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, name: true, latitude: true, longitude: true },
  });

  if (stores.length === 0) return null;

  let nearest = stores[0];
  let minDist = calculateDistance(
    userLat,
    userLong,
    stores[0].latitude,
    stores[0].longitude,
  );

  for (const store of stores.slice(1)) {
    const dist = calculateDistance(
      userLat,
      userLong,
      store.latitude,
      store.longitude,
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = store;
    }
  }

  return nearest;
};

/**
 * Kalkulasi jarak antara dua koordinat menggunakan Haversine formula (satuan km).
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Memastikan storeId tujuan, baik dari input langsung atau mencari toko terdekat.
 */
export const resolveTargetStoreId = async (
  storeId?: string,
  userLat?: number,
  userLong?: number,
): Promise<string> => {
  if (storeId) return storeId;

  if (userLat && userLong) {
    const nearestStore = await findNearestStore(userLat, userLong);
    if (!nearestStore) {
      throw new AppError(404, "No active stores found", true, "NO_STORES");
    }
    return nearestStore.id;
  }

  throw new AppError(
    400,
    "Either storeId or user location is required",
    true,
    "MISSING_PARAMS",
  );
};

/**
 * Mendapatkan objek 'include' Prisma yang standar untuk list dan detail produk publik.
 */
export const getPublicProductInclude = (now: Date) => {
  return {
    product: {
      include: {
        category: true,
        images: true, // List can take 1 later, detail takes all
        discounts: {
          where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          orderBy: {
            createdAt: "desc" as const,
          },
          take: 1,
        },
      },
    },
  };
};

/**
 * Membangun filter 'where' Prisma untuk pencarian produk di sisi publik.
 */
export const buildProductWhereClause = (filters: {
  storeId: string;
  search?: string;
  categoryId?: string;
}) => {
  const { storeId, search, categoryId } = filters;

  const where: any = {
    storeId,
    product: {
      isActive: true,
    },
  };

  if (search) {
    where.product.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (categoryId) {
    where.product.categoryId = categoryId;
  }

  return where;
};
