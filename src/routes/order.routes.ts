import { Router } from "express";
import { 
  createOrder, 
  getOrders, 
  getOrderDetails,
  validateStock
} from "../controllers/order.controller";
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
