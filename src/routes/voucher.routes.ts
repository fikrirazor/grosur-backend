import { Router } from "express";
import * as voucherController from "../controllers/voucher.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get user's vouchers
router.get("/", voucherController.getUserVouchers);

// Get referral invitees and my vouchers summary
router.get("/referral-summary", voucherController.getMyReferralInvitees);

// Validate voucher before checkout
router.post("/validate", voucherController.validateVoucher);

// Use voucher (during order creation)
router.post("/use", voucherController.useVoucher);

// Claim generic voucher template
router.post("/claim", voucherController.claimVoucher);

export default router;
