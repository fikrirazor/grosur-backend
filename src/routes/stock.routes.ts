import { Router } from "express";
import * as stockController from "../controllers/stock.controller";
import * as stockJournalController from "../controllers/stock-journal.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  updateStockSchema,
  transferStockSchema,
} from "../validations/stock.validation";

const router = Router();

// Update stok manual (Tambah/Kurang)
// PATCH /api/stocks/update
router.patch(
  "/update",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  validateRequest(updateStockSchema),
  stockController.updateStock,
);

// Transfer stok antar toko (Hanya Super Admin)
// POST /api/stocks/transfer
router.post(
  "/transfer",
  verifyToken,
  authorizeRoles("SUPER_ADMIN"),
  validateRequest(transferStockSchema),
  stockController.transferStock,
);

// Melihat riwayat jurnal stok
// GET /api/stocks/journals?storeId=...&search=...&type=...
router.get(
  "/journals",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  stockJournalController.getStockJournals,
);

// Statistik ringkasan jurnal untuk stok tertentu
// GET /api/stocks/journals/:stockId/stats
router.get(
  "/journals/:stockId/stats",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"),
  stockJournalController.getStockJournalStats,
);

export default router;
