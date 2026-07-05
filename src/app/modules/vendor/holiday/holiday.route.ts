import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { validateRequest } from "../../../middlewares/validateRequest";
import { HolidayController } from "./holiday.controller";
import { HolidayValidation } from "./holiday.validation";

const router = Router();

// Vendor Access
router.post(
  "/",
  auth(),
  validateRequest(HolidayValidation.createVendorHolidaySchema),
  HolidayController.createVendorHoliday,
);

router.get("/", auth(), HolidayController.getStoreHolidays);

router.get("/:id", auth(), HolidayController.getHolidayById);

router.patch(
  "/:id",
  auth(),
  validateRequest(HolidayValidation.updateVendorHolidaySchema),
  HolidayController.updateVendorHoliday,
);

router.delete("/:id", auth(), HolidayController.deleteVendorHoliday);

// Public Access (for customers to check store holidays)
router.get("/store/:storeId/active", HolidayController.getActiveStoreHolidays);

export const HolidayRouter = router;
