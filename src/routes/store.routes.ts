import { Router } from "express";
import { getAssignedStore, getFallbackStore } from "../controllers/store.controller";
// Removed verifyToken from the my-store route to allow guest browsing
const router = Router();

router.get("/fallback", getFallbackStore);
router.get("/my-store", getAssignedStore);

export default router;