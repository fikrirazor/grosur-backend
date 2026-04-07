import { Router } from "express";
import { signUp, signIn, getMe, logout } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validation.middleware";
import { signUpSchema, signInSchema } from "../validations/auth.validation";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post("/signup", validateRequest(signUpSchema), signUp);

/**
 * @route   POST /api/auth/signin
 * @desc    Sign in a user
 * @access  Public
 */
router.post("/signin", validateRequest(signInSchema), signIn);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", verifyToken, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookies
 * @access  Public
 */
router.post("/logout", logout);

export default router;
