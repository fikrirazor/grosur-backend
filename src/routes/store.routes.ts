// src/routes/store.routes.ts
import { Router } from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { getAssignedStore } from "../controllers/store.controller";
const router = Router();

// Sequence: 1. Is there a token? -> 2. Is the role correct? -> 3. Execute logic
router.post(
    "/create",
    verifyToken,
    requireRole([Role.SUPER_ADMIN]),
    (req, res) => {
        res.send("Store created!");
    }
);

router.patch(
    "/stock",
    verifyToken,
    requireRole([Role.SUPER_ADMIN, Role.STORE_ADMIN]),
    (req, res) => {
        res.send("Stock updated!");
    }
);

router.get("/my-store", verifyToken, getAssignedStore);

export default router;