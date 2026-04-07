import { Router } from "express";
import * as productController from "../controllers/product.controller";

const router = Router();

// Publicly available product routes
router.get("/", productController.getPublicProducts);
router.get("/categories", productController.getCategories);
router.get("/:slug", productController.getPublicProductDetail);

export default router;
