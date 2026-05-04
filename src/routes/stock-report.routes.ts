import { Router } from "express";
import * as stockReportController from "../controllers/stock-report.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Stock report - accessible by SUPER_ADMIN and STORE_ADMIN
router.get(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  stockReportController.getStockReport,
);

export default router;
