import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation";

const router = Router();

// Public route - anyone can view categories
router.get("/", categoryController.getCategories);

// Protected routes - only SUPER_ADMIN can manage categories (Store Admin is Read-Only)
router.post(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(createCategorySchema),
  categoryController.createCategory,
);

router.put(
  "/:categoryId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  "/:categoryId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.deleteCategory,
);

export default router;
