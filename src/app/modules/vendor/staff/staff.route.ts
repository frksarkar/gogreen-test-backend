import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { validateRequest } from "../../../middlewares/validateRequest";
import { StaffController } from "./staff.controller";
import { StaffValidation } from "./staff.validation";

const router = Router();

router.post(
  "/",
  auth(),
  validateRequest(StaffValidation.addVendorStaffZodSchema),
  StaffController.addVendorStaff,
);

router.get("/", 
  auth(),
   StaffController.getVendorStaff);

router.get("/:id", 
  auth(),
   StaffController.getStaffById);

router.patch("/:id", 
  auth(),
  validateRequest(StaffValidation.updateVendorStaffZodSchema),
   StaffController.updateVendorStaff);

router.delete("/:id", 
  auth(),
   StaffController.removeVendorStaff);
router.delete("/hard/:id", 
  auth(),
   StaffController.hardRemoveVendorStaff);

export const StaffRouter = router;
