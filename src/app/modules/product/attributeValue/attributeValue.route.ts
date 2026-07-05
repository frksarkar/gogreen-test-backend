import { Router } from "express";
import { AttributeValueController } from "./attributeValue.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { attributeValueZodValidation } from "./attributeValue.validation";

const router = Router();

router.post(
  "/",
  validateRequest(attributeValueZodValidation.createAttributeValueZodSchema),
  AttributeValueController.createValue,
);
router.get("/", AttributeValueController.getAllValues);
router.get("/:id", AttributeValueController.getSingleValue);
router.patch(
  "/:id",
  validateRequest(attributeValueZodValidation.updateAttributeValueZodSchema),
  AttributeValueController.updateValue,
);
router.delete("/:id", AttributeValueController.softDeleteValue);
router.patch("/restore/:id", AttributeValueController.restoreValue);
router.delete("/hard/:id", AttributeValueController.hardDeleteAttributeValue);

export const attributeValueRouter = router;
