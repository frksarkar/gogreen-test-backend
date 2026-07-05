import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { variantValueZodValidation } from "./variantValue.validation";
import { VariantValueController } from "./variantValue.controller";

const router = Router();

router.post(
  "/",
  validateRequest(variantValueZodValidation.createVariantValueZodSchema),
  VariantValueController.create,
);

router.get("/", VariantValueController.getAll);
router.get("/:id", VariantValueController.getSingle);

router.patch(
  "/:id",
  validateRequest(variantValueZodValidation.updateVariantValueZodSchema),
  VariantValueController.update,
);

router.delete("/:id", VariantValueController.softDelete);
router.patch("/restore/:id", VariantValueController.restore);
router.delete("/hard/:id", VariantValueController.hardDelete);

export const variantValueRouter = router;