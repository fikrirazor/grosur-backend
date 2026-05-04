import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation";

const router = Router();

// Public route - anyone can view categories
router.get("/", categoryController.getCategories);

// Protected routes - hanya SUPER_ADMIN boleh menambah kategori (Store Admin is Read-Only)
router.post(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(createCategorySchema),
  categoryController.createCategory,
);

// Protected routes - hanya SUPER_ADMIN boleh mengedit kategori
router.put(
  "/:categoryId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory,
);

// Protected routes - hanya SUPER_ADMIN boleh menghapus kategori
router.delete(
  "/:categoryId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.deleteCategory,
);

export default router;
