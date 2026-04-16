import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { adminApiMiddleware } from "../middleware/role.middleware";
import { getAllUsers } from "../controllers/admin.user.controller";

const router = Router();

router.use(verifyToken, adminApiMiddleware);

router.get("/users", authorizeRoles("SUPER_ADMIN"), getAllUsers);

router.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Welcome to Admin Dashboard",
    user: (req as any).user,
  });
});

export default router;
