import { Router } from "express";
import { referralController } from "./referral.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { ReferralRewardZodValidation } from "./referral.validation";
import { auth } from "../../middlewares/auth";

const route = Router();
route.post("/max-level", referralController.maxReferralLevel);
route.get("/max-level", referralController.getMaxReferralLevel);
route.post("/reward", referralController.createNewReferralReward);
route.get("/reward", referralController.getAllCreatedReferralRewards);
route.get("/reward/:id", referralController.getReferralRewardById);
route.patch(
  "/reward/:id",
  validateRequest(ReferralRewardZodValidation.updateReferralRewardZod),
  referralController.updateAReferralReward,
);
route.delete("/reward/:id", referralController.deleteReferralReward);
route.get("/", auth(), referralController.myReferral);
export const referralRouter = route;
