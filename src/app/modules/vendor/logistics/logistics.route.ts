import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { LogisticsController } from "./logistics.controller";
import { LogisticsValidation } from "./logistics.validation";
import { auth } from "../../../middlewares/auth";

const router = Router();

router.get("/shipping-rates", LogisticsController.getStoreShippingRates);
router.get("/shipping-rates/:id", LogisticsController.getShippingRateById);

router.post(
  "/shipping-rates",
  auth(),
  validateRequest(LogisticsValidation.createShippingRateZodSchema),
  LogisticsController.addShippingRate,
);
router.patch(
  "/shipping-rates/:id",
  auth(),
  validateRequest(LogisticsValidation.updateShippingRateZodSchema),
  LogisticsController.updateShippingRate,
);
router.delete(
  "/shipping-rates/:id",
  auth(),
  LogisticsController.deleteShippingRate,
);
router.delete(
  "/shipping-rates/hard/:id",
  auth(),
  LogisticsController.hardDeleteShippingRate,
);

router.post(
  "/shipping-templates",
  auth(),
  validateRequest(LogisticsValidation.createShippingTemplateZodSchema),
  LogisticsController.createShippingTemplate,
);
router.patch(
  "/shipping-templates/:id",
  auth(),
  validateRequest(LogisticsValidation.updateShippingTemplateZodSchema),
  LogisticsController.updateShippingTemplate,
);
router.delete(
  "/shipping-templates/:id",
  auth(),
  LogisticsController.deleteShippingTemplate,
);
router.delete(
  "/shipping-templates/hard/:id",
  auth(),
  LogisticsController.hardDeleteShippingTemplate,
);
router.get(
  "/shipping-templates",
  auth(),
  LogisticsController.getShippingTemplates,
);
router.get(
  "/shipping-templates/single/:id",
  auth(),
  LogisticsController.getShippingTemplateById,
);

export const LogisticsRouter = router;
