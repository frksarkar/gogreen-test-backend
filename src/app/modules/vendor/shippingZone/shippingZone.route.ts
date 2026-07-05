import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { createShippingZoneZodSchema, updateShippingZoneZodSchema } from "./shippingZone.validation";
import { auth } from "../../../middlewares/auth";
import { ShippingZoneController } from "./shippingZone.controller";


const router = Router();

router.get("/single/:id", ShippingZoneController.getShippingZoneById);
router.get("/:storeId", ShippingZoneController.getStoreShippingZones);
router.post(
  "/",
  auth(),
  validateRequest(createShippingZoneZodSchema),
  ShippingZoneController.addShippingZone,
);
router.patch(
  "/:id",
  auth(),
  validateRequest(updateShippingZoneZodSchema),
  ShippingZoneController.updateShippingZone,
);
router.delete(
  "/:id",
  auth(),
  ShippingZoneController.deleteShippingZone,
);
router.delete(
  "/hard/:id",
  auth(),
  ShippingZoneController.hardDeleteShippingZone,
);


export const ShippingZoneRouter = router;
