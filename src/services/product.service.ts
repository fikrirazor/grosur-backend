import prisma from "../config/database";

export interface ProductQuery {
  storeId: string;
  search?: string;
  categoryId?: string;
  page: number;
  limit: number;
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

export const getCategories = async () => {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};
