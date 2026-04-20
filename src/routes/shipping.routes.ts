import { Router } from "express";
import { getProvinces, getCities, getShippingCost } from "../controllers/shipping.controller";

const router = Router();

/**
 * @route   GET /api/shipping/provinces
 * @desc    Get all provinces from RajaOngkir
 * @access  Public
 */
router.get("/provinces", getProvinces);

/**
 * @route   GET /api/shipping/cities
 * @desc    Get cities from RajaOngkir (use ?provinceId=... for filtering)
 * @access  Public
 */
router.get("/cities", getCities);

/**
 * @route   POST /api/shipping/cost
 * @desc    Calculate shipping cost from RajaOngkir
 * @access  Public
 */
router.post("/cost", getShippingCost);
import { getShippingCosts, getProvinces, getCities } from "../controllers/shipping.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes for frontend dropdowns
router.get("/provinces", getProvinces);
router.get("/cities", getCities);

// Protected route for actual cart checkout
router.post("/cost", verifyToken, getShippingCosts);

export default router;
