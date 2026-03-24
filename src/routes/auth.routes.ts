// src/routes/auth.routes.ts
import { Router } from "express";
import {
    loginHandler,
    registerHandler,
    verifyHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    googleLogin,
} from "../controllers/auth.controller";

const router = Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.post("/verify", verifyHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);
router.post("/google", googleLogin);

export default router;