import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";
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
    items: items.map((stock) => ({
      id: stock.product.id,
      name: stock.product.name,
      slug: stock.product.slug,
      price: stock.product.price,
      description: stock.product.description,
      category: stock.product.category.name,
      categoryId: stock.product.categoryId,
      image: stock.product.images[0]?.url || null,
      inventory: {
        quantity: stock.quantity,
        storeId: stock.storeId,
      },
    })),
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
        },
      },
    },
  });

  if (!stock) {
    return null;
  }

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

export const getProductById = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
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
  productId: string,
  data: UpdateProductInput,
  storeId: string,
) => {
  // Verify product exists and belongs to store
  const existingStock = await prisma.stock.findUnique({
    where: {
      productId_storeId: {
        productId,
        storeId,
      },
    },
    include: {
      product: true,
    },
  });

  if (!existingStock) {
    throw new AppError(
      404,
      "Product not found in this store",
      true,
      "PRODUCT_NOT_FOUND",
    );
  }

  // If updating name, check for duplicates
  if (data.name && data.name !== existingStock.product.name) {
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
          not: productId,
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

  // Update product
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
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

export const deleteProduct = async (productId: string, storeId: string) => {
  // Verify product exists and belongs to store
  const existingStock = await prisma.stock.findUnique({
    where: {
      productId_storeId: {
        productId,
        storeId,
      },
    },
  });

  if (!existingStock) {
    throw new AppError(
      404,
      "Product not found in this store",
      true,
      "PRODUCT_NOT_FOUND",
    );
  }

  // Delete product (cascade will handle related records)
  await prisma.product.delete({
    where: { id: productId },
  });

  return { success: true, message: "Product deleted successfully" };
};

export const uploadProductImages = async (
  productId: string,
  storeId: string,
  files: Express.Multer.File[],
) => {
  // Verify product exists and belongs to store
  const existingStock = await prisma.stock.findUnique({
    where: {
      productId_storeId: {
        productId,
        storeId,
      },
    },
    include: {
      product: {
        include: {
          images: true,
        },
      },
    },
  });

  if (!existingStock) {
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
        data: { url, productId },
      }),
    ),
  );

  return {
    message: `${images.length} image(s) uploaded successfully`,
    images,
  };
};
