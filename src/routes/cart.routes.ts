import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { addToCartSchema } from "../validations/cart.validation";
import {
  addToCart,
  getCartCount,
  getCartData,
  updateCartItem,
  deleteCartItem,
} from "../controllers/cart.controller";

const router = Router();

router.post("/add", verifyToken, validateRequest(addToCartSchema), addToCart);
router.get("/count", verifyToken, getCartCount);
router.get("/", verifyToken, getCartData);
router.patch("/:cartId", verifyToken, updateCartItem);
router.delete("/:cartId", verifyToken, deleteCartItem);

export default router;
