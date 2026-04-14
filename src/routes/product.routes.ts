import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation";
import { upload } from "../middleware/upload.middleware";

const router = Router();

// Publicly available product routes
router.get("/", productController.getPublicProducts);
router.get("/categories", productController.getCategories);
router.get("/:productId", productController.getPublicProductDetail);

// Protected routes for Store Admins
router.post(
  "/",
  verifyToken,
  authorizeRoles("STORE_ADMIN", "SUPER_ADMIN"),
  validateRequest(createProductSchema),
  productController.createProduct,
);

router.put(
  "/:productId",
  verifyToken,
  authorizeRoles("STORE_ADMIN", "SUPER_ADMIN"),
  validateRequest(updateProductSchema),
  productController.updateProduct,
);

router.delete(
  "/:productId",
  verifyToken,
  authorizeRoles("STORE_ADMIN", "SUPER_ADMIN"),
  productController.deleteProduct,
);

router.post(
  "/upload-images",
  verifyToken,
  authorizeRoles("STORE_ADMIN", "SUPER_ADMIN"),
  upload.array("images", 5), // Max 5 images per upload
  productController.uploadProductImages,
);

export default router;
