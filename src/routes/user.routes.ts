import { Router } from "express";
import { updateProfile } from "../controllers/user.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// PATCH is best practice for partial updates
router.patch(
    "/profile",
    verifyToken,
    upload.single("profilePhoto"), // Must match the frontend form field name
    updateProfile
);

export default router;