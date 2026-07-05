import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { ReviewController } from "./review.controller";
import { createVendorReviewZodSchema, updateVendorReviewZodSchema } from "./review.validation";
import { auth } from "../../../middlewares/auth";


const router = Router();
router.post(
  "/:id",
  auth(),
  validateRequest(createVendorReviewZodSchema),
  ReviewController.createStoreReview,
);
router.get("/:storeId", ReviewController.getStoreReviews);
router.get("/single/:id", ReviewController.getReviewById);
router.patch("/:id", 
  auth(),
  validateRequest(updateVendorReviewZodSchema),
  ReviewController.updateStoreReview);

router.delete("/:id", 
  auth(), 
  ReviewController.deleteStoreReview);

router.delete("/hard/:id", 
  auth(), 
  ReviewController.hardDeleteStoreReview);

export const ReviewRouter = router;
