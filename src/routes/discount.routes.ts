import { Router } from "express";
import * as discountController from "../controllers/discount.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { createDiscountSchema, updateDiscountSchema } from "../validations/discount.validation";

const router = Router();

// All routes require authentication and admin role
router.use(verifyToken);
router.use(authorizeRoles("SUPER_ADMIN", "STORE_ADMIN"));

// Get all discounts for a store
router.get("/", discountController.getStoreDiscounts);

// Create new discount
router.post(
  "/",
  validateRequest(createDiscountSchema),
  discountController.createDiscount,
);

// Update discount
router.put(
  "/:discountId",
  validateRequest(updateDiscountSchema),
  discountController.updateDiscount,
);

// Delete (deactivate) discount
router.delete("/:discountId", discountController.deleteDiscount);

export default router;
