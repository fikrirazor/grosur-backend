import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// Route untuk publik
// GET /api/products?storeId=...&search=...&categoryId=...
router.get("/", productController.getPublicProducts);
// GET /api/products/categories
router.get("/categories", productController.getCategories);
// GET /api/products/:slug_atau_id?storeId=...
router.get("/:productId", productController.getPublicProductDetail);

// Route khusus Admin (Super Admin & Store Admin)
router.get(
  "/admin/:productId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  productController.getProductById,
);

// Route khusus Super Admin (Store Admin Read-Only untuk Produk)
router.post(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(createProductSchema),
  productController.createProduct,
);

router.put(
  "/:productId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(updateProductSchema),
  productController.updateProduct,
);

router.delete(
  "/:productId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  productController.deleteProduct,
);

router.post(
  "/upload-images",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  upload.array("images", 5), // Max 5 images per upload
  productController.uploadProductImages,
);

export default router;
