import { Router } from "express";
import {
    getAssignedStore, getFallbackStore, getNearestStore,
    createStore, getAllStores, updateStore, deleteStore, assignStoreAdmin
} from "../controllers/store.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// --- PUBLIC & CUSTOMER ROUTES ---
router.get("/fallback", getFallbackStore);
router.get("/my-store", getAssignedStore);
router.post("/nearest", getNearestStore);

// --- SUPER ADMIN ROUTES (Epic 1.5) ---
// Secure all routes below this line
router.use(verifyToken);
router.use(requireRole(["SUPER_ADMIN"]));

router.post("/", createStore);
router.get("/", getAllStores);
router.patch("/:id", updateStore);
router.delete("/:id", deleteStore);
router.patch("/:id/assign", assignStoreAdmin);

export default router;