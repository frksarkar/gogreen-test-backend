import { Router } from "express";
import { CampaignController } from "./campaign.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { CampaignZodSchema } from "./campaign.validation";

const route = Router();
route.get("/", CampaignController.getCampaigns);
route.post(
  "/",
  validateRequest(CampaignZodSchema.createCampaignSchema),
  CampaignController.createCampaign,
);
route.get("/:id", CampaignController.getCampaign);
route.patch(
  "/:id",
  validateRequest(CampaignZodSchema.updateCampaignSchema),
  CampaignController.updateCampaign,
);
route.delete("/:id", CampaignController.deleteCampaign);
export const CampaignRouter = route;
