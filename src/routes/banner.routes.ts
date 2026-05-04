import { Router } from "express";
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllBannersAdmin,
  getActiveDiscounts,
} from "../controllers/banner.controller";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// Public route
router.get("/", getBanners);

// Protected routes (Super Admin only)
router.use(verifyToken, authorizeRoles("SUPER_ADMIN"));

router.get("/admin", getAllBannersAdmin);
router.get("/discounts", getActiveDiscounts);
router.post("/", upload.single("image"), createBanner);
router.patch("/:id", upload.single("image"), updateBanner);
router.delete("/:id", deleteBanner);

export default router;
