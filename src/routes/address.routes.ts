import { Router } from "express";
import {
    addAddress,
    getMyAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from "../controllers/address.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// All address routes require the user to be logged in
router.use(verifyToken);

router.post("/", addAddress);
router.get("/", getMyAddresses);
router.patch("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

export default router;
