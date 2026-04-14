import { Router } from "express";
import * as checkoutController from "../controllers/checkout.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Preview checkout with discount & voucher calculation
router.post("/preview", checkoutController.previewCheckout);

export default router;
