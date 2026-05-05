import { Router } from "express";
import * as salesController from "../controllers/sales.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Laporan Penjualan (Admin & Super Admin)
// GET /api/sales?storeId=...&month=5&year=2024
router.get(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getSalesReport,
);

export default router;
