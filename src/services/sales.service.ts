import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";

/**
 * Build date range filter for orders
 */
const buildDateFilter = (month?: number, year?: number) => {
  if (!year) return {};

  if (month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
  } else {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    return {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
  }
};

/**
 * Calculate total revenue from order items
 */
const calculateRevenue = (items: any[]) => {
  return items.reduce((sum, item) => sum + Number(item.subtotal), 0);
};

/**
 * Get monthly trend data for a specific year or the last 12 months
 */
const getMonthlyTrends = async (storeId?: string, targetYear?: number) => {
  const endDate = targetYear ? new Date(targetYear, 11, 31, 23, 59, 59) : new Date();
  const startDate = targetYear ? new Date(targetYear, 0, 1) : new Date();
  
  if (!targetYear) {
    startDate.setFullYear(endDate.getFullYear() - 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  const where: any = {
    status: "CONFIRMED",
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (storeId) {
    where.storeId = storeId;
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      totalAmount: true,
      createdAt: true,
    },
  });

  const monthsMap = new Map();
  
  if (targetYear) {
    // Initialize 12 months of the year
    for (let i = 0; i < 12; i++) {
      const d = new Date(targetYear, i, 1);
      const label = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });
      monthsMap.set(label, { month: label, revenue: 0, orders: 0 });
    }
  } else {
    // Initialize last 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(endDate.getMonth() - (11 - i));
      const label = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });
      monthsMap.set(label, { month: label, revenue: 0, orders: 0 });
    }
  }

  orders.forEach((order) => {
    const label = order.createdAt.toLocaleString("id-ID", { month: "short", year: "2-digit" });
    if (monthsMap.has(label)) {
      const data = monthsMap.get(label);
      data.revenue += Number(order.totalAmount);
      data.orders += 1;
    }
  });

  return Array.from(monthsMap.values());
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
      data.revenue += Number(item.subtotal);
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
      data.revenue += Number(item.subtotal);
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
  const where: any = { status: "CONFIRMED" };

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
  
  // Calculate total summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + Number(o.discountAmount), 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Get trends
  const trends = await getMonthlyTrends(storeId, year);

  // Map to transactions for frontend
  const transactions = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.user.name || "Unknown",
    customerEmail: o.user.email,
    totalAmount: Number(o.subtotal) + Number(o.shippingCost),
    discountAmount: Number(o.discountAmount),
    finalAmount: Number(o.totalAmount),
    status: o.status,
    paymentMethod: o.paymentMethod || "N/A",
    createdAt: o.createdAt,
    storeId: o.storeId,
  }));

  return {
    success: true,
    data: {
      transactions,
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        totalDiscount,
        averageOrderValue,
        period: month && year ? `${month}/${year}` : "All Time",
        storeId: storeId || "All Stores",
      },
      byCategory,
      byProduct,
      trends,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    },
  };
};

/**
 * Generate CSV content for sales report
 */
export const getSalesReportCSV = async (
  userId: string,
  role: string,
  storeId?: string,
  month?: number,
  year?: number
) => {
  // Use existing logic but without pagination (get all results for the period)
  const report = await getSalesReport(userId, role, storeId, month, year, 1, 1000000);
  
  const transactions = report.data.transactions;
  
  if (transactions.length === 0) {
    return "No transactions found for the selected period";
  }

  const header = [
    "Order Number",
    "Date",
    "Customer",
    "Email",
    "Subtotal",
    "Discount",
    "Total",
    "Status",
    "Payment Method"
  ].join(",");

  const rows = transactions.map((t: any) => [
    t.orderNumber,
    new Date(t.createdAt).toISOString(),
    `"${t.customerName}"`,
    t.customerEmail,
    t.totalAmount,
    t.discountAmount,
    t.finalAmount,
    t.status,
    t.paymentMethod
  ].join(","));

  return [header, ...rows].join("\n");
};
