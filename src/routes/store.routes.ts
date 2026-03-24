// src/routes/store.routes.ts
import { Router } from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { getAssignedStore } from "../controllers/store.controller";
const router = Router();



router.get("/my-store", verifyToken, getAssignedStore);

export default router;