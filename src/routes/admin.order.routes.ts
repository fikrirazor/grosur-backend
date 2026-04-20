import { Router } from "express";
import { getAdminOrders } from "../controllers/admin.order.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Routes for both SUPER_ADMIN and STORE_ADMIN
router.get(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  getAdminOrders
);

export default router;
