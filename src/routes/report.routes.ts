import { Router } from "express";
import * as salesController from "../controllers/sales.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Laporan Penjualan (Tampilan Dashboard)
// GET /api/reports/sales?month=5&year=2024
router.get(
  "/sales",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getSalesReport,
);

// Export Laporan Penjualan ke CSV
// GET /api/reports/sales/export?month=5&year=2024
router.get(
  "/sales/export",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.exportSalesReport,
);

// Ringkasan Stok Bulanan per Produk
// GET /api/reports/stock/summary?month=5&year=2024
router.get(
  "/stock/summary",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getStockSummary,
);

// Detail Riwayat Kartu Stok per Produk
// GET /api/reports/stock/detail?productId=...&storeId=...
router.get(
  "/stock/detail",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getStockDetail,
);

export default router;
