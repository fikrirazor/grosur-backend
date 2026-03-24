// src/routes/store.routes.ts
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { getAssignedStore, getFallbackStore } from "../controllers/store.controller";

const router = Router();

// Public: returns the first active store (for denied / new users)
router.get("/fallback", getFallbackStore);

// Private: returns the store nearest to the user's default address
router.get("/my-store", verifyToken, getAssignedStore);

export default router;