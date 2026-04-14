import { Router } from "express";
import * as voucherController from "../controllers/voucher.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get user's vouchers
router.get("/", voucherController.getUserVouchers);

// Validate voucher before checkout
router.post("/validate", voucherController.validateVoucher);

// Use voucher (during order creation)
router.post("/use", voucherController.useVoucher);

export default router;
