import { Router } from "express";
import * as storeAdminController from "../controllers/store-admin.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createStoreAdminSchema,
  updateStoreAdminSchema,
} from "../validations/store-admin.validation";

const router = Router();

router.use(verifyToken, authorizeRoles("SUPER_ADMIN"));

/**
 * Menambah akun Store Admin baru (Hanya Super Admin)
 * POST /api/admin/store-admins
 */
router.post(
  "/",
  validateRequest(createStoreAdminSchema),
  storeAdminController.createStoreAdmin,
);

/**
 * Mendapatkan daftar semua Store Admin (Hanya Super Admin)
 * GET /api/admin/store-admins?page=1&limit=10
 */
router.get("/", storeAdminController.getStoreAdmins);

/**
 * Memperbarui data akun Store Admin (Hanya Super Admin)
 * PATCH /api/admin/store-admins/:id
 */
router.patch(
  "/:id",
  validateRequest(updateStoreAdminSchema),
  storeAdminController.updateStoreAdmin,
);

/**
 * Menghapus akun Store Admin (Hanya Super Admin)
 * DELETE /api/admin/store-admins/:id
 */
router.delete("/:id", storeAdminController.deleteStoreAdmin);

/**
 * Mendapatkan list semua toko untuk dropdown (Hanya Super Admin)
 * GET /api/admin/store-admins/list/all
 */
router.get("/list/all", storeAdminController.getStores);

export default router;
