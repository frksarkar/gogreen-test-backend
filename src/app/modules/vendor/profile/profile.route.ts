import { validateRequest } from "../../../middlewares/validateRequest";
import { Router } from "express";
import { uploadVendorFiles } from "../../../config/vendorUpload";
const router = Router();
import { ProfileController } from "./profile.controller";
import {
  createVendorZodSchema,
  updateVendorStatusZodSchema,
  updateVendorZodSchema,
} from "./profile.validation";
import { auth } from "../../../middlewares/auth";

router.post(
  "/register",
  auth(),
  uploadVendorFiles,
  validateRequest(createVendorZodSchema),
  ProfileController.createVendor,
);

router.get(
  "/my-profile",
  auth(),
  ProfileController.getMyVendorProfile,
);
router.patch(
  "/my-profile",
  auth(),
  uploadVendorFiles,
  validateRequest(updateVendorZodSchema),
  ProfileController.updateVendorProfile,
);

router.delete(
  "/delete",
  auth(),
  ProfileController.deleteVendor,
);
router.delete(
  "/hard/:id",
  auth(),
  ProfileController.hardDeleteVendor,
);

router.patch(
  "/update-status/:id",
  auth(),
  validateRequest(updateVendorStatusZodSchema),
  ProfileController.updateVendorStatus,
);

router.get(
  "/",
  auth(),
  ProfileController.getAllVendors,
);

router.get(
  "/:id",
  auth(),
  ProfileController.getAllStoreByVendor,
);

export const ProfileRouter = router;
