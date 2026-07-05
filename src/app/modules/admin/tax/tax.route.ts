import { Router } from "express";
import { TaxController } from "./tax.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { TaxZodSchema } from "./tax.validation";

const route = Router();
route.get("/", TaxController.getAllTax);
route.post(
  "/",
  validateRequest(TaxZodSchema.createTaxZodSchema),
  TaxController.createTax,
);
route.get("/:id", TaxController.getTax);
route.patch(
  "/:id",
  validateRequest(TaxZodSchema.updateTaxZodSchema),
  TaxController.updateTax,
);
route.delete("/:id", TaxController.deleteTax);
export const TaxRouter = route;
