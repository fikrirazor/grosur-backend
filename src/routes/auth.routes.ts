// src/routes/auth.routes.ts
import { Router } from "express";
import { 
    loginHandler,
    registerHandler,
    verifyHandler 
} from "../controllers/auth.controller";

const router = Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.post("/verify", verifyHandler);

export default router;