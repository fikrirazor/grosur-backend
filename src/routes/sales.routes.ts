import { Router } from "express";
import * as salesController from "../controllers/sales.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Sales report - accessible by SUPER_ADMIN and STORE_ADMIN
router.get(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  salesController.getSalesReport,
);

export default router;
