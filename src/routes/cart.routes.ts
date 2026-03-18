import { Router } from "express";
import { addToCart, getMyCart } from "../controllers/cart.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// All cart actions require the user to be logged in
router.post("/add", verifyToken, addToCart);
router.get("/", verifyToken, getMyCart);

export default router;