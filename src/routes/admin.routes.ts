import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware";
import { adminApiMiddleware } from "../middlewares/role.middleware";
import * as adminUserController from "../controllers/admin.user.controller";

const router = Router();

router.use(verifyToken, adminApiMiddleware);

router.get("/users", authorizeRoles("SUPER_ADMIN"), adminUserController.getAllUsers);
router.post("/users", authorizeRoles("SUPER_ADMIN"), adminUserController.createUser);
router.patch("/users/:id", authorizeRoles("SUPER_ADMIN"), adminUserController.updateUser);
router.delete("/users/:id", authorizeRoles("SUPER_ADMIN"), adminUserController.deleteUser);

router.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Welcome to Admin Dashboard",
    user: (req as any).user,
  });
});

export default router;
