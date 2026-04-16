// src/routes/auth.routes.ts
import { Router } from "express";
import {
    signIn,
    signUp,
    verifyHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    googleLogin,
    logout,
    getMe
} from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { signUpSchema, signInSchema } from "../validations/auth.validation";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Standard Auth
router.post("/signin", validateRequest(signInSchema), signIn);
router.post("/signup", validateRequest(signUpSchema), signUp);
router.post("/login", signIn); // Keep /login as fallback if needed
router.post("/register", signUp); // Keep /register as fallback

// Verification & Password Reset
router.post("/verify", verifyHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

// Social & Session
router.post("/google", googleLogin);
router.post("/logout", logout);
router.get("/me", verifyToken, getMe);

export default router;
