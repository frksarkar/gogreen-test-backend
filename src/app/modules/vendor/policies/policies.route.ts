import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { PoliciesController } from "./policies.controller";
import { createVendorPolicyZodSchema, updateVendorPolicyZodSchema } from "./policies.validation";
import { auth } from "../../../middlewares/auth";

const router = Router();

router.post(
  "/",
  auth(),
  validateRequest(createVendorPolicyZodSchema),
  PoliciesController.createVendorPolicy,
);
router.patch(
  "/:id",
  auth(),
  validateRequest(updateVendorPolicyZodSchema),
  PoliciesController.updateVendorPolicy,
);
router.delete(
  "/:id",
  auth(),
  PoliciesController.deleteVendorPolicy,
);
router.delete(
  "/hard/:id",
  auth(),
  PoliciesController.hardDeleteVendorPolicy,
);
router.get("/:id", PoliciesController.getStorePolicies);
router.get("/single/:id", PoliciesController.getPolicyById);

export const PoliciesRouter = router;
