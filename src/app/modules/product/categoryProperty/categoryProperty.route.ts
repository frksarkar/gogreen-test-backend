import { Router } from "express";
import { CategoryPropertyController } from "./categoryProperty.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { categoryPropertyZodValidation } from "./categoryProperty.validation";

const router = Router();

router.post(
  "/",
  validateRequest(categoryPropertyZodValidation.createCategoryPropertyZodSchema),
  CategoryPropertyController.create,
);

router.get("/", CategoryPropertyController.getAll);
router.get("/attributes", CategoryPropertyController.getAttributeProperties);
router.get("/variants", CategoryPropertyController.getVariantProperties);
router.get("/:id", CategoryPropertyController.getSingle);
router.get("/attributes", CategoryPropertyController.getAttributeProperties);

router.get("/variants", CategoryPropertyController.getVariantProperties);

router.patch(
  "/:id",
  validateRequest(categoryPropertyZodValidation.updateCategoryPropertyZodSchema),
  CategoryPropertyController.update,
);

router.delete("/:id", CategoryPropertyController.softDelete);
router.patch("/restore/:id", CategoryPropertyController.restore);
router.delete("/hard/:id", CategoryPropertyController.hardDelete);

export const categoryPropertyRouter = router;