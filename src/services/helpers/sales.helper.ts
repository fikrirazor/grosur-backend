import prisma from "../../config/database";
import {
  ProductSalesReportItem,
  CategorySalesReportItem,
  SalesTrendItem,
} from "../../types/sales.types";

/**
 * Mengelompokkan penjualan berdasarkan produk.
 */
export const aggregateByProduct = (orders: any[]): ProductSalesReportItem[] => {
  const productMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const key = item.product.id;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images?.[0]?.url || null,
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
 * Mengelompokkan penjualan berdasarkan kategori.
 */
export const aggregateByCategory = (orders: any[]): CategorySalesReportItem[] => {
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

/**
 * Mendapatkan data tren penjualan bulanan (Omzet & Jumlah Order).
 */
export const getMonthlyTrends = async (
  storeId?: string,
  targetYear?: number,
): Promise<SalesTrendItem[]> => {
  const endDate = targetYear
    ? new Date(targetYear, 11, 31, 23, 59, 59)
    : new Date();
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
    for (let i = 0; i < 12; i++) {
      const d = new Date(targetYear, i, 1);
      const label = d.toLocaleString("id-ID", {
        month: "short",
        year: "2-digit",
      });
      monthsMap.set(label, { month: label, revenue: 0, orders: 0 });
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(endDate.getMonth() - (11 - i));
      const label = d.toLocaleString("id-ID", {
        month: "short",
        year: "2-digit",
      });
      monthsMap.set(label, { month: label, revenue: 0, orders: 0 });
    }
  }

  orders.forEach((order: any) => {
    const label = order.createdAt.toLocaleString("id-ID", {
      month: "short",
      year: "2-digit",
    });
    if (monthsMap.has(label)) {
      const data = monthsMap.get(label);
      data.revenue += Number(order.totalAmount);
      data.orders += 1;
    }
  });

  return Array.from(monthsMap.values());
};

/**
 * Mengambil data order dengan pagination dan detail produk/user.
 */
export const fetchPaginatedOrders = async (where: any, page: number, limit: number) => {
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
                images: {
                  take: 1,
                  select: { url: true },
                },
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
