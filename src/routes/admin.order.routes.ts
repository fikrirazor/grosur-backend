import { Router } from "express";
import { getAdminOrders, getAdminOrderDetail, confirmPayment, sendOrder, cancelOrder } from "../controllers/admin.order.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// Routes for both SUPER_ADMIN and STORE_ADMIN
router.use(verifyToken, authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"));

router.get("/", getAdminOrders);
router.get("/:id", getAdminOrderDetail);
router.patch("/:id/payment", confirmPayment);
router.patch("/:id/send", sendOrder);
router.patch("/:id/cancel", cancelOrder);

export default router;
