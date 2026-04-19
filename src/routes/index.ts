import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import storeAdminRoutes from "./store-admin.routes";
import adminRoutes from "./admin.routes";
import productRoutes from "./product.routes";
import categoryRoutes from "./category.routes";
import stockRoutes from "./stock.routes";
import storeRoutes from "./store.routes";
import cartRoutes from "./cart.routes";
import shippingRoutes from "./shipping.routes";
import addressRoutes from "./address.routes";
import orderRoutes from "./order.routes";
import discountRoutes from "./discount.routes";
import voucherRoutes from "./voucher.routes";
import checkoutRoutes from "./checkout.routes";
import salesRoutes from "./sales.routes";
import reportRoutes from "./report.routes";

const router = Router();

// Health check route
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/store-admins", storeAdminRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/stocks", stockRoutes);
router.use("/stores", storeRoutes);
router.use("/cart", cartRoutes);
router.use("/shipping", shippingRoutes);
router.use("/addresses", addressRoutes);
router.use("/orders", orderRoutes);
router.use("/discounts", discountRoutes);
router.use("/vouchers", voucherRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/sales", salesRoutes);
router.use("/reports", reportRoutes);

export default router;
