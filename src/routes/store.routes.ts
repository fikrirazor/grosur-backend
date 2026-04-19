// src/routes/store.routes.ts
import { Router } from "express";
import {
    getAssignedStore, 
    getFallbackStore, 
    getNearestStore,
    createStore, 
    getAllStores, 
    updateStore, 
    deleteStore, 
    assignStoreAdmin,
    getStores
} from "../controllers/store.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";
import { Role } from "../generated/prisma";

const router = Router();

// --- PUBLIC & CUSTOMER ROUTES ---
router.get("/list", getStores); // develop branch list
router.get("/fallback", getFallbackStore);
router.get("/my-store", getAssignedStore);
router.post("/nearest", getNearestStore);
router.get("/", getAllStores); // Public view of all stores for some uses

// --- SUPER ADMIN ROUTES ---
// We use a different pattern here to allow specific public routes above
router.post("/", verifyToken, requireRole([Role.SUPER_ADMIN]), createStore);
router.patch("/:id", verifyToken, requireRole([Role.SUPER_ADMIN]), updateStore);
router.delete("/:id", verifyToken, requireRole([Role.SUPER_ADMIN]), deleteStore);
router.patch("/:id/assign", verifyToken, requireRole([Role.SUPER_ADMIN]), assignStoreAdmin);

export default router;
