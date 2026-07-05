import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { validateRequest } from "../../../middlewares/validateRequest";
import { CommissionController } from "./commission.controller";
import { CommissionValidation } from "./commission.validation";

const router = Router();

// Vendor Access
router.get("/", auth(), CommissionController.getVendorCommission);

router.post(
  "/",
  auth(),
  validateRequest(CommissionValidation.createOrUpdateCommissionZodSchema),
  CommissionController.createOrUpdateVendorCommission,
);

router.delete("/", auth(), CommissionController.deleteVendorCommission);

// Admin Access
router.get("/all", auth(), CommissionController.getAllVendorCommissions);

router.get("/:vendorId", auth(), CommissionController.getVendorCommissionById);

router.patch(
  "/:vendorId",
  auth(),
  validateRequest(CommissionValidation.updateCommissionByAdminZodSchema),
  CommissionController.updateVendorCommissionByAdmin,
);

router.delete(
  "/:vendorId",
  auth(),
  CommissionController.deleteVendorCommissionByAdmin,
);

export const CommissionRouter = router;
