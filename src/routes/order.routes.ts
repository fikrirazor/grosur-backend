import { Router } from "express";
import { 
  createOrder, 
  getOrders, 
  getOrderDetails,
  validateStock,
  uploadPaymentProof,
  cancelExpiredOrders
} from "../controllers/order.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// All order routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/orders/validate-stock
 * @desc    Validate stock for items in cart
 * @access  Private
 */
router.get("/validate-stock", validateStock);

/**
 * @route   POST /api/orders/:id/payment-proof
 * @desc    Upload payment proof for an order (jpg, jpeg, png only, max 1MB)
 * @access  Private
 */
router.post("/:id/payment-proof", upload.single("paymentProof"), uploadPaymentProof);

/**
 * @route   POST /api/orders/cancel-expired
 * @desc    Cancel all expired unpaid orders (older than 1 hour)
 * @access  Private
 */
router.post("/cancel-expired", cancelExpiredOrders);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post("/", createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get user order history
 * @access  Private
 */
router.get("/", getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details
 * @access  Private
 */
router.get("/:id", getOrderDetails);

export default router;
