import { Router } from "express";
import { addAddress, getMyAddresses } from "../controllers/address.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, addAddress);
router.get("/", verifyToken, getMyAddresses);

export default router;