import { Router } from "express";
import { getProfile } from "../controllers/user.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", verifyToken, getProfile);

export default router;
