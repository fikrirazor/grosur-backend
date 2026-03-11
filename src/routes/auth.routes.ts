// src/routes/auth.routes.ts
import { Router } from "express";
import { loginHandler,registerHandler } from "../controllers/auth.controller";

const router = Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);

export default router;