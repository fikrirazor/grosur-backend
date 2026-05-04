import { Router } from "express";
import {
  updateProfile,
  requestEmailChange,
  updatePassword,
} from "../controllers/user.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// PATCH is best practice for partial updates
router.patch(
  "/profile",
  verifyToken,
  upload.single("profilePhoto"),
  updateProfile,
);

// POST route for changing the email (requires authentication)
router.post("/change-email", verifyToken, requestEmailChange);

// PATCH route for changing the password (requires authentication)
router.patch("/password", verifyToken, updatePassword);

export default router;
