import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { adminApiMiddleware } from "../middleware/role.middleware";

const router = Router();

router.use(verifyToken, adminApiMiddleware);

router.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Welcome to Admin Dashboard",
    user: (req as any).user,
  });
});

export default router;
