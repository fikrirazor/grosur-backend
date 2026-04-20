import { Router } from "express";
import { getAdminOrders, getAdminOrderDetail, confirmPayment, sendOrder } from "../controllers/admin.order.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { getAdminOrders, getAdminOrderDetail, confirmPayment } from "../controllers/admin.order.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Routes for both SUPER_ADMIN and STORE_ADMIN
router.use(verifyToken, authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"));

router.get("/", getAdminOrders);
router.get("/:id", getAdminOrderDetail);
router.patch("/:id/payment", confirmPayment);
router.patch("/:id/send", sendOrder);

export default router;
