import { Router } from "express";
import * as salesController from "../controllers/sales.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";

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

export default router;
