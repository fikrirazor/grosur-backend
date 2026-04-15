import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";

/**
 * Build date range filter for orders
 */
const buildDateFilter = (month?: number, year?: number) => {
  if (!month || !year) return {};

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };
};

/**
 * Calculate total revenue from order items
 */
const calculateRevenue = (items: any[]) => {
  return items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
};

/**
 * Get paginated sales data with aggregation
 */
const getPaginatedSales = async (
  where: any,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
};

/**
 * Aggregate sales by product
 */
const aggregateByProduct = (orders: any[]) => {
  const productMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const key = item.product.id;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item.product.id,
          productName: item.product.name,
          categoryId: item.product.categoryId,
          categoryName: item.product.category.name,
          quantity: 0,
          revenue: 0,
          orders: 0,
        });
      }

      const data = productMap.get(key);
      data.quantity += item.quantity;
      data.revenue += Number(item.totalPrice);
      data.orders += 1;
    });
  });

  return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
};

/**
 * Aggregate sales by category
 */
const aggregateByCategory = (orders: any[]) => {
  const categoryMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const key = item.product.categoryId;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoryId: item.product.categoryId,
          categoryName: item.product.category.name,
          quantity: 0,
          revenue: 0,
          products: new Set(),
        });
      }

      const data = categoryMap.get(key);
      data.quantity += item.quantity;
      data.revenue += Number(item.totalPrice);
      data.products.add(item.product.id);
    });
  });

  return Array.from(categoryMap.values())
    .map((data) => ({
      ...data,
      products: data.products.size,
    }))
    .sort((a, b) => b.revenue - a.revenue);
};

export const getSalesReport = async (
  userId: string,
  role: string,
  storeId?: string,
  month?: number,
  year?: number,
  page: number = 1,
  limit: number = 20
) => {
  // Validate role-based access
  if (role === "STORE_ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { managedStoreId: true },
    });

    if (!user?.managedStoreId) {
      throw new AppError(403, "Store admin must have assigned store", true, "NO_STORE_ASSIGNED");
    }

    storeId = user.managedStoreId;
  } else if (role !== "SUPER_ADMIN") {
    throw new AppError(403, "Unauthorized access", true, "FORBIDDEN");
  }

  // Build query filters
  const where: any = { status: "COMPLETED" };

  if (storeId) {
    where.storeId = storeId;
  }

  // Add date filter
  const dateFilter = buildDateFilter(month, year);
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter.createdAt;
  }

  // Get paginated orders
  const { orders, total } = await getPaginatedSales(where, page, limit);

  // Calculate aggregations
  const byProduct = aggregateByProduct(orders);
  const byCategory = aggregateByCategory(orders);
  const totalRevenue = calculateRevenue(orders.flatMap((o) => o.items));

  return {
    success: true,
    summary: {
      totalOrders: orders.length,
      totalRevenue,
      period: month && year ? `${month}/${year}` : "All Time",
      storeId: storeId || "All Stores",
    },
    byCategory,
    byProduct,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
    },
  };
};
