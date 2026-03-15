import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { checkRole } from "../middleware/role.middleware";

const router = Router();

router.use(verifyToken, checkRole(["SUPER_ADMIN", "STORE_ADMIN"]));

router.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Welcome to Admin Dashboard",
    user: (req as any).user,
  });
});

export default router;
