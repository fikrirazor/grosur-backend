import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { formatPaginationMeta } from "../utils/pagination.util";
import { buildDateFilter, getPeriodLabel } from "../utils/date.util";
import {
  aggregateByProduct,
  aggregateByCategory,
  getMonthlyTrends,
  fetchPaginatedOrders,
} from "./helpers/sales.helper";
import { SalesReportResponse, SalesTransactionItem } from "../types/sales.types";

/**
 * Mendapatkan laporan penjualan lengkap dengan summary, tren, dan agregasi.
 */
export const getSalesReport = async (
  userId: string,
  role: string,
  storeId?: string,
  month?: number,
  year?: number,
  page: number = 1,
  limit: number = 20,
): Promise<SalesReportResponse> => {
  // Validate role-based access
  if (role === "STORE_ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { managedStoreId: true },
    });

    if (!user?.managedStoreId) {
      throw new AppError(
        403,
        "Store admin must have assigned store",
        true,
        "NO_STORE_ASSIGNED",
      );
    }

    storeId = user.managedStoreId;
  } else if (role !== "SUPER_ADMIN") {
    throw new AppError(403, "Unauthorized access", true, "FORBIDDEN");
  }

  // Build query filters
  const where: any = { status: "CONFIRMED" };
  if (storeId) where.storeId = storeId;

  // Add date filter from utility
  const dateFilter = buildDateFilter(month, year);
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter.createdAt;
  }

  // Get paginated orders using helper
  const { orders, total } = await fetchPaginatedOrders(where, page, limit);

  // Calculate aggregations using helpers
  const byProduct = aggregateByProduct(orders);
  const byCategory = aggregateByCategory(orders);

  // Calculate total summary stats
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
  const totalDiscount = orders.reduce((sum: number, o: any) => sum + Number(o.discountAmount), 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Get trends using helper
  const trends = await getMonthlyTrends(storeId, year);

  // Map to transactions for frontend
  const transactions: SalesTransactionItem[] = orders.map((o: any) => ({
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
        totalOrders: total, // Use total from DB count, not just current page length
        totalRevenue,
        totalDiscount,
        averageOrderValue,
        period: getPeriodLabel(month, year),
        storeId: storeId || "All Stores",
      },
      byCategory,
      byProduct,
      trends,
      pagination: formatPaginationMeta(total, page, limit),
    },
  };
};

/**
 * Mendapatkan data laporan penjualan dalam format CSV (Plain Text).
 */
export const getSalesReportCSV = async (
  userId: string,
  role: string,
  storeId?: string,
  month?: number,
  year?: number,
) => {
  // Get all results for the period (no pagination)
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
    "Payment Method",
  ].join(",");

  const rows = transactions.map((t: any) =>
    [
      t.orderNumber,
      new Date(t.createdAt).toISOString(),
      `"${t.customerName}"`,
      t.customerEmail,
      t.totalAmount,
      t.discountAmount,
      t.finalAmount,
      t.status,
      t.paymentMethod,
    ].join(","),
  );

  return [header, ...rows].join("\n");
};
