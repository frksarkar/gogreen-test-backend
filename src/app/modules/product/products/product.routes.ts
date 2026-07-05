import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";

const router = Router();

router.post(
  "/",
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct,
);
router.get("/", ProductController.getAllProducts);
router.get("/vendor/:vendorId", ProductController.getVendorAllProducts);
router.get(
  "/vendorProduct/:vendorId",
  ProductController.getVendorMostSoldProducts,
);

router.get("/byId/:id", ProductController.getSingleProduct);
router.get("/:slug", ProductController.getSingleProductBySlug);
router.patch(
  "/:id",
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct,
);
router.delete("/:id", ProductController.deleteProduct);
router.patch("/restore/:id", ProductController.restoreProduct);
router.delete("/hard/:id", ProductController.hardDeleteProduct);

// User routes
router.post(
  "/review",
  validateRequest(ProductValidation.createReviewZodSchema),
  ProductController.createReview,
);
router.patch(
  "/review/:reviewId",
  validateRequest(ProductValidation.updateReviewZodSchema),
  ProductController.updateReview,
);
router.delete("/review/:reviewId", ProductController.deleteReview);

// Admin/Vendor reply
router.patch(
  "/review/reply/:reviewId",
  validateRequest(ProductValidation.replyReviewZodSchema),
  ProductController.replyToReview,
);
// admin product enable/ disable
router.patch("/restrict/:id", ProductController.productRestrict);

router.get("/reviews/vendor/:vendorId", ProductController.getVendorWiseReviews);
router.post("/checkout-product-info", ProductController.getCheckoutProducts);

export const productRouter = router;
