import { Router } from "express";
import { getShippingCosts, getProvinces, getCities } from "../controllers/shipping.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes for frontend dropdowns
router.get("/provinces", getProvinces);
router.get("/cities", getCities);

// Protected route for actual cart checkout
router.post("/cost", verifyToken, getShippingCosts);

export default router;
