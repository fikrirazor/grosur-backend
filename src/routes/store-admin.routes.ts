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
 * @route   POST /api/admin/store-admins
 * @desc    Create a new store admin account
 * @access  Private (SUPER_ADMIN)
 */
router.post(
  "/",
  validateRequest(createStoreAdminSchema),
  storeAdminController.createStoreAdmin,
);

/**
 * @route   GET /api/admin/store-admins
 * @desc    Get all store admin accounts with pagination
 * @access  Private (SUPER_ADMIN)
 */
router.get("/", storeAdminController.getStoreAdmins);

/**
 * @route   PATCH /api/admin/store-admins/:id
 * @desc    Update a store admin account
 * @access  Private (SUPER_ADMIN)
 */
router.patch(
  "/:id",
  validateRequest(updateStoreAdminSchema),
  storeAdminController.updateStoreAdmin,
);

/**
 * @route   DELETE /api/admin/store-admins/:id
 * @desc    Delete a store admin account
 * @access  Private (SUPER_ADMIN)
 */
router.delete("/:id", storeAdminController.deleteStoreAdmin);

/**
 * @route   GET /api/admin/store-admins/list/all
 * @desc    Get all stores (for dropdown/selection)
 * @access  Private (SUPER_ADMIN)
 */
router.get("/list/all", storeAdminController.getStores);

export default router;
