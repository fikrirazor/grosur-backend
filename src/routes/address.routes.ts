import { Router } from "express";
import { 
  getAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress 
} from "../controllers/address.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All address routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/addresses
 * @desc    Get all addresses for current user
 * @access  Private
 */
router.get("/", getAddresses);

/**
 * @route   POST /api/addresses
 * @desc    Add a new address
 * @access  Private
 */
router.post("/", createAddress);

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put("/:id", updateAddress);

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete("/:id", deleteAddress);
import {
    addAddress,
    getMyAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from "../controllers/address.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// All address routes require the user to be logged in
router.use(verifyToken);

router.post("/", addAddress);
router.get("/", getMyAddresses);
router.patch("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

export default router;
