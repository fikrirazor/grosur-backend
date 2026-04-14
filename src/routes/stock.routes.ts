import { Router } from "express";
import * as stockController from "../controllers/stock.controller";
import * as stockJournalController from "../controllers/stock-journal.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { updateStockSchema, transferStockSchema } from "../validations/stock.validation";

const router = Router();

// Update stock - requires authentication and admin role
router.patch(
  "/update",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  validateRequest(updateStockSchema),
  stockController.updateStock,
);

// Transfer stock between stores - SUPER_ADMIN only
router.post(
  "/transfer",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(transferStockSchema),
  stockController.transferStock,
);

// Get stock journals - read only
router.get(
  "/journals",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  stockJournalController.getStockJournals,
);

// Get journal statistics for a stock
router.get(
  "/journals/:stockId/stats",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  stockJournalController.getStockJournalStats,
);

export default router;
