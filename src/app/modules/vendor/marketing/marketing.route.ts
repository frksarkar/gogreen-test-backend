import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { validateRequest } from "../../../middlewares/validateRequest";
import { CouponController, PromotionController } from "./marketing.controller";
import { MarketingValidation } from "./marketing.validation";

const router = Router();

router.post(
  "/coupons",
  auth(),
  validateRequest(MarketingValidation.createCouponZodSchema),
  CouponController.createCoupon,
);
router.patch(
  "/coupons/:id",
  auth(),  
  validateRequest(MarketingValidation.updateCouponZodSchema),
  CouponController.updateCoupon,
);
router.delete("/coupons/:id", 
  auth(),
   CouponController.deleteCoupon);

router.delete("/coupons/hard/:id", 
  auth(),
   CouponController.hardDeleteCoupon);
router.get("/coupons/:id", CouponController.getStoreCoupons);
router.get("/coupons/single/:id", CouponController.getCouponById);

router.post(
  "/promotions",
  auth(),
  validateRequest(MarketingValidation.createPromotionZodSchema),
  PromotionController.createPromotion,
);
router.patch(
  "/promotions/:id",
  auth(),
  validateRequest(MarketingValidation.updatePromotionZodSchema),
  PromotionController.updatePromotion,
);
router.delete(
  "/promotions/:id",
  auth(),
  PromotionController.deletePromotion,
);

router.delete(
  "/promotions/hard/:id",
  auth(),  
  PromotionController.hardDeletePromotion,
);
router.get("/promotions/:id", PromotionController.getStorePromotions);
router.get("/promotions/single/:id", PromotionController.getPromotionById);

export const MarketingRouter = router;
