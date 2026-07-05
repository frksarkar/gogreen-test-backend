import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { validateRequest } from "../../../middlewares/validateRequest";
import { UsageController } from "./usage.controller";
import { UsageValidation } from "./usage.validation";

const router = Router();

// Vendor Access
router.get("/counter", auth(), UsageController.getVendorUsageCounter);

router.get("/limit", auth(), UsageController.getVendorUsageLimit);

// Admin Access
router.get("/counters/all", auth(), UsageController.getAllVendorUsageCounters);

router.get("/limits/all", auth(), UsageController.getAllVendorUsageLimits);

router.patch(
  "/limit/:vendorId",
  auth(),
  validateRequest(UsageValidation.updateUsageLimitZodSchema),
  UsageController.updateVendorUsageLimit,
);

router.patch(
  "/counter/:vendorId",
  auth(),
  validateRequest(UsageValidation.incrementUsageCounterZodSchema),
  UsageController.incrementVendorUsageCounter,
);

export const UsageRouter = router;
