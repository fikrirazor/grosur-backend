import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import storeAdminRoutes from "./store-admin.routes";
import adminRoutes from "./admin.routes";
import productRoutes from "./product.routes";
import storeRoutes from "./store.routes";
import cartRoutes from "./cart.routes";

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
router.use("/stores", storeRoutes);
router.use("/cart", cartRoutes);

export default router;
