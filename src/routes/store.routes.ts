import { Router } from "express";
import * as storeController from "../controllers/store.controller";

const router = Router();

// Publicly available store routes
router.get("/", storeController.getStores);

export default router;
