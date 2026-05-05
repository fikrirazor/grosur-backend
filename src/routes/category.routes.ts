import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation";

const router = Router();

// Menampilkan semua kategori (Publik)
// GET /api/categories
router.get("/", categoryController.getCategories);

// Menambah kategori baru (Hanya Super Admin)
// POST /api/categories
router.post(
  "/",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(createCategorySchema),
  categoryController.createCategory,
);

// Mengubah data kategori (Hanya Super Admin)
// PUT /api/categories/:categoryId
router.put(
  "/:categoryId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory,
);

// Menghapus kategori (Hanya Super Admin)
// DELETE /api/categories/:categoryId
router.delete(
  "/:categoryId",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.deleteCategory,
);

export default router;
