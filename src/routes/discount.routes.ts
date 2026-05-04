import { Router } from "express";
import * as discountController from "../controllers/discount.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createDiscountSchema,
  updateDiscountSchema,
} from "../validations/discount.validation";

const router = Router();

// Semua route diskon membutuhkan login dan role Admin
// Middleware Global untuk grup ini
router.use(verifyToken);
router.use(authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"));

// Mendapatkan semua diskon di toko tertentu
// GET /api/discounts?storeId=...
router.get("/", discountController.getStoreDiscounts);

// Membuat diskon baru
// POST /api/discounts
router.post(
  "/",
  validateRequest(createDiscountSchema),
  discountController.createDiscount,
);

// Mengubah data diskon
// PUT /api/discounts/:discountId
router.put(
  "/:discountId",
  validateRequest(updateDiscountSchema),
  discountController.updateDiscount,
);

// Menghapus (Menonaktifkan) diskon
// DELETE /api/discounts/:discountId
router.delete("/:discountId", discountController.deleteDiscount);

export default router;
