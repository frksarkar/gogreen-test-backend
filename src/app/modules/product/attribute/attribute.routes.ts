import { Router } from "express";
import { AttributeController } from "./attribute.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { attributeZodValidation } from "./attribute.validation";

const router = Router();

router.post(
  "/",
  validateRequest(attributeZodValidation.createAttributeZodSchema),
  AttributeController.createAttribute,
);
router.get("/", AttributeController.getAllAttributes);
router.get("/:id", AttributeController.getSingleAttribute);
router.patch(
  "/:id",
  validateRequest(attributeZodValidation.updateAttributeZodSchema),
  AttributeController.updateAttribute,
);
router.delete("/:id", AttributeController.softDeleteAttribute);
router.patch("/restore/:id", AttributeController.restoreAttribute);
router.delete("/hard/:id", AttributeController.hardDeleteAttribute);
export const attributeRouter = router;
