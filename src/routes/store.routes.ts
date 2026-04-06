import { Router } from "express";
import { getAssignedStore, getFallbackStore, getNearestStore } from "../controllers/store.controller";
// Removed verifyToken from the my-store route to allow guest browsing
const router = Router();

router.get("/fallback", getFallbackStore);
router.get("/my-store", getAssignedStore);
router.post("/nearest", getNearestStore);

export default router;