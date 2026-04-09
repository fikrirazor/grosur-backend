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

export default router;
