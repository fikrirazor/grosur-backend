import { Router } from "express";
import * as stockController from "../controllers/stock.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { updateStockSchema } from "../validations/stock.validation";

const router = Router();

// Update stock - requires authentication and admin role
router.patch(
  "/update",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  validateRequest(updateStockSchema),
  stockController.updateStock,
);

export default router;
