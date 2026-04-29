import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import cloudinary from "../config/cloudinary.config";

export interface ProductQuery {
  storeId: string;
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  storeId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isActive?: boolean;
}

export const getPublicProducts = async (query: ProductQuery) => {
  const { storeId, search, categoryId, page, limit } = query;
  const skip = (page - 1) * limit;
  const now = new Date();

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

  const [items, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
            images: {
              take: 1,
            },
            discounts: {
              where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        product: {
          name: "asc",
        },
      },
    }),
    prisma.stock.count({ where }),
  ]);

  return {
    items: items.map((stock) => {
      const discount = stock.product.discounts[0];
      return {
        id: stock.product.id,
        name: stock.product.name,
        slug: stock.product.slug,
        price: stock.product.price,
        description: stock.product.description,
        category: stock.product.category.name,
        categoryId: stock.product.categoryId,
        image: stock.product.images[0]?.url || null,
        discount: discount ? {
          type: discount.type,
          value: discount.value,
          minSpend: discount.minSpend,
          maxDiscount: discount.maxDiscount,
          buyQty: discount.buyQty,
          freeQty: discount.freeQty,
        } : null,
        inventory: {
          quantity: stock.quantity,
          storeId: stock.storeId,
        },
      };
    }),
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

export const getPublicProductDetail = async (slug: string, storeId: string) => {
  const now = new Date();
  const stock = await prisma.stock.findFirst({
    where: {
      storeId,
      product: {
        slug,
        isActive: true,
      },
    },
    include: {
      product: {
        include: {
          category: true,
          images: true,
          discounts: {
            where: {
              isActive: true,
              startDate: { lte: now },
              endDate: { gte: now },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!stock) {
    return null;
  }

  const discount = stock.product.discounts[0];

  return {
    id: stock.product.id,
    name: stock.product.name,
    slug: stock.product.slug,
    description: stock.product.description,
    price: stock.product.price,
    category: stock.product.category.name,
    categoryId: stock.product.categoryId,
    images: stock.product.images.map((img) => ({
      id: img.id,
      url: img.url,
    })),
    discount: discount ? {
      type: discount.type,
      value: discount.value,
      minSpend: discount.minSpend,
      maxDiscount: discount.maxDiscount,
      buyQty: discount.buyQty,
      freeQty: discount.freeQty,
    } : null,
    inventory: {
      quantity: stock.quantity,
      storeId: stock.storeId,
    },
  };
};

export const getCategories = async () => {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

export const getProductById = async (productIdOrSlug: string) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);
  
  const product = await prisma.product.findFirst({
    where: isUUID ? { id: productIdOrSlug } : { slug: productIdOrSlug },
    include: {
      category: true,
      images: true,
      stocks: true,
    },
  });

  if (!product) {
    throw new AppError(404, "Product not found", true, "PRODUCT_NOT_FOUND");
  }

  return product;
};

export const createProduct = async (data: CreateProductInput) => {
  const { name, description, price, categoryId, storeId } = data;

  // Validasi apakah storenya ada?
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    throw new AppError(404, "Store not found", true, "STORE_NOT_FOUND");
  }
  
  // Validasi apakah kategori ada?
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError(404, "Category not found", true, "CATEGORY_NOT_FOUND");
  }

  // Bisnis logic cek duplikasi nama produk di toko yang sama
  const existingProduct = await prisma.product.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      stocks: {
        some: {
          storeId,
        },
      },
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

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Create product with stock entry
  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        name,
        slug,
        description,
        price,
        categoryId,
      },
    });

    await tx.stock.create({
      data: {
        productId: newProduct.id,
        storeId,
        quantity: 0,
      },
    });

    return tx.product.findUnique({
      where: { id: newProduct.id },
      include: {
        category: true,
        images: true,
        stocks: {
          where: { storeId },
        },
      },
    });
  });

  return product;
};

export const updateProduct = async (
  productIdOrSlug: string,
  data: UpdateProductInput,
  storeId: string,
) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

  const productRecord = await prisma.product.findFirst({
    where: isUUID ? { id: productIdOrSlug } : { slug: productIdOrSlug },
    include: {
      stocks: {
        where: { storeId }
      }
    }
  });

  if (!productRecord || productRecord.stocks.length === 0) {
    throw new AppError(
      404,
      "Product not found in this store",
      true,
      "PRODUCT_NOT_FOUND",
    );
  }

  // If updating name, check for duplicates
  if (data.name && data.name !== productRecord.name) {
    const duplicateProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: "insensitive",
        },
        stocks: {
          some: {
            storeId,
          },
        },
        id: {
          not: productRecord.id,
        },
      },
    });

    if (duplicateProduct) {
      throw new AppError(
        409,
        `Product "${data.name}" already exists in this store`,
        true,
        "PRODUCT_DUPLICATE",
      );
    }
  }

  // Generate new slug if name is updated
  let newSlug;
  if (data.name && data.name !== productRecord.name) {
    newSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Update product
  const updatedProduct = await prisma.product.update({
    where: { id: productRecord.id },
    data: {
      name: data.name,
      slug: newSlug,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      isActive: data.isActive,
    },
    include: {
      category: true,
      images: true,
      stocks: {
        where: { storeId },
      },
    },
  });

  return updatedProduct;
};

export const deleteProduct = async (productIdOrSlug: string, storeId: string) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

  const productRecord = await prisma.product.findFirst({
    where: isUUID ? { id: productIdOrSlug } : { slug: productIdOrSlug },
    include: {
      stocks: {
        where: { storeId }
      }
    }
  });

  if (!productRecord || productRecord.stocks.length === 0) {
    throw new AppError(
      404,
      "Product not found in this store",
      true,
      "PRODUCT_NOT_FOUND",
    );
  }

  // Soft delete to avoid breaking Order history
  await prisma.product.update({
    where: { id: productRecord.id },
    data: { isActive: false },
  });

  return { success: true, message: "Product deleted successfully" };
};

export const uploadProductImages = async (
  productIdOrSlug: string,
  storeId: string,
  files: Express.Multer.File[],
) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

  const productRecord = await prisma.product.findFirst({
    where: isUUID ? { id: productIdOrSlug } : { slug: productIdOrSlug },
    include: {
      images: true,
      stocks: {
        where: { storeId }
      }
    }
  });

  if (!productRecord || productRecord.stocks.length === 0) {
    throw new AppError(
      404,
      "Product not found in this store",
      true,
      "PRODUCT_NOT_FOUND",
    );
  }

  // Upload each file buffer to Cloudinary
  const uploadToCloudinary = (buffer: Buffer): Promise<string> =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "grosur/products", resource_type: "image" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });

  const uploadedUrls = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer)),
  );

  const images = await prisma.$transaction(
    uploadedUrls.map((url) =>
      prisma.productImage.create({
        data: { url, productId: productRecord.id },
      }),
    ),
  );

  return {
    message: `${images.length} image(s) uploaded successfully`,
    images,
  };
};

/**
 * Find nearest store by user location
 */
const findNearestStore = async (userLat: number, userLong: number) => {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, name: true, latitude: true, longitude: true },
  });

  if (stores.length === 0) return null;

  let nearest = stores[0];
  let minDist = calculateDistance(userLat, userLong, stores[0].latitude, stores[0].longitude);

  for (const store of stores.slice(1)) {
    const dist = calculateDistance(userLat, userLong, store.latitude, store.longitude);
    if (dist < minDist) {
      minDist = dist;
      nearest = store;
    }
  }

  return nearest;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
 * Get product with images and stock info
 */
const getProductWithDetails = async (productId: string, storeId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { createdAt: "asc" } },
      category: { select: { id: true, name: true } },
    },
  });

  if (!product) return null;

  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
    select: { quantity: true },
  });

  return {
    ...product,
    stock: stock?.quantity || 0,
  };
};

export const getProductDetail = async (
  productId: string,
  userLat?: number,
  userLong?: number,
  storeId?: string
) => {
  let targetStoreId = storeId;

  if (!targetStoreId && userLat && userLong) {
    const nearestStore = await findNearestStore(userLat, userLong);
    if (!nearestStore) {
      throw new AppError(404, "No active stores found", true, "NO_STORES");
    }
    targetStoreId = nearestStore.id;
  }

  if (!targetStoreId) {
    throw new AppError(400, "Either storeId or user location is required", true, "MISSING_PARAMS");
  }

  const product = await getProductWithDetails(productId, targetStoreId);

  if (!product) {
    throw new AppError(404, "Product not found", true, "PRODUCT_NOT_FOUND");
  }

  return product;
};
