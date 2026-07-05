import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { ComplianceController } from "./compliance.controller";
import { ComplianceValidation } from "./compliance.validation";
import { uploadVendorFiles } from "../../../config/vendorUpload";
import { auth } from "../../../middlewares/auth";

const router = Router();

// Admin Access
router.get("/all", auth(), ComplianceController.getAllDocuments);

router.post(
  "/",
  auth(),
  uploadVendorFiles,
  validateRequest(ComplianceValidation.uploadDocumentZodSchema),
  ComplianceController.uploadDocument,
);

router.get("/", auth(), ComplianceController.getVendorDocuments);

router.get("/:id", auth(), ComplianceController.getDocumentById);

router.patch(
  "/:id",
  auth(),
  uploadVendorFiles,
  validateRequest(ComplianceValidation.updateDocumentZodSchema),
  ComplianceController.updateVendorDocument,
);

router.delete("/:id", auth(), ComplianceController.deleteVendorDocument);

router.delete(
  "/hard/:id",
  auth(),
  ComplianceController.hardDeleteVendorDocument,
);

router.patch(
  "/:id/status",
  auth(),
  validateRequest(ComplianceValidation.updateDocumentStatusZodSchema),
  ComplianceController.updateDocumentStatus,
);

export const ComplianceRouter = router;
