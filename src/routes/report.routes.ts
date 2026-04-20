import { Router } from "express";
import * as salesController from "../controllers/sales.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Sales report - accessible by SUPER_ADMIN and STORE_ADMIN
router.get(
  "/sales",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getSalesReport
);

// CSV export - accessible by SUPER_ADMIN and STORE_ADMIN
router.get(
  "/sales/export",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.exportSalesReport
);

// Stock summary report - accessible by SUPER_ADMIN and STORE_ADMIN
router.get(
  "/stock/summary",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getStockSummary
);

// Stock detail report - accessible by SUPER_ADMIN and STORE_ADMIN
router.get(
  "/stock/detail",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getStockDetail
);

export default router;
