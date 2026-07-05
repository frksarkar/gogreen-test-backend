import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { updateVendorSocialZodSchema } from "./social.validation";
import { SocialController } from "./social.controller";
import { auth } from "../../../middlewares/auth";


const router = Router();
router.patch(
  "/",
  auth(),
  validateRequest(updateVendorSocialZodSchema),
  SocialController.updateVendorSocial,
);

router.get("/:id", SocialController.getStoreSocial);
router.get("/single/:id", SocialController.getSocialById);

router.delete("/:id", 
  auth(),
  SocialController.deleteVendorSocial);

router.delete("/hard/:id", 
  auth(),
  SocialController.hardDeleteVendorSocial);


export const SocialRouter = router;
