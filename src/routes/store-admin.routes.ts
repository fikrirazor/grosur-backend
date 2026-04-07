import { Router } from "express";
import * as storeAdminController from "../controllers/store-admin.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import {
  createStoreAdminSchema,
  updateStoreAdminSchema,
} from "../validations/store-admin.validation";

const router = Router();

router.use(verifyToken, authorizeRoles("SUPER_ADMIN"));

// Create Store
router.post(
  "/",
  validateRequest(createStoreAdminSchema),
  storeAdminController.createStoreAdmin,
);

// Get Store
router.get("/", storeAdminController.getStoreAdmins);

// Update Store
router.patch(
  "/:id",
  validateRequest(updateStoreAdminSchema),
  storeAdminController.updateStoreAdmin,
);

// Delete Store
router.delete("/:id", storeAdminController.deleteStoreAdmin);

export default router;
