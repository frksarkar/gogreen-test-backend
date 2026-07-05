import { Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middlewares/validateRequest";
import { ClientHomeController } from "./client.controller";
import { ClientValidation } from "./client.validation";

const router = Router();
// home page routes start here
router.get("/dashboard-banner", ClientHomeController.getDashboardBanner);
router.get("/categories", ClientHomeController.getCategories);
router.get("/popular", ClientHomeController.getPopularProducts);
router.get("/featured", ClientHomeController.getAllFeatured);
router.get("/top-selling", ClientHomeController.getTopSellingProducts);
router.get("/top-vendors", ClientHomeController.getTopVendors);
router.get("/best-deal", ClientHomeController.getAllBestDeals);

//home page routes end here
router.post(
  "/featured",
  validateRequest(ClientValidation.requestFeaturedZodSchema),
  ClientHomeController.requestFeatured,
);
router.get("/featured/requests", ClientHomeController.getAllRequestedFeatured);
router.patch(
  "/featured/approve/:id",
  validateRequest(ClientValidation.approveFeaturedZodSchema),
  ClientHomeController.approveFeatured,
);
router.post(
  "/banner",
  multerUpload.single("file"),
  validateRequest(ClientValidation.bannerTypeZodSchema),
  ClientHomeController.createBanner,
);
router.get("/banner", ClientHomeController.getAllBanner);
router.patch(
  "/banner/:id",
  multerUpload.single("file"),
  validateRequest(ClientValidation.updateBannerTypeZodSchema),
  ClientHomeController.updateBanner,
);
router.delete("/banner/:id", ClientHomeController.deleteBanner);

router.post(
  "/banner-position",
  validateRequest(ClientValidation.bannerPositionZodSchema),
  ClientHomeController.createBannerPosition,
);

router.get("/banner-position", ClientHomeController.getAllBannerPosition);

router.patch(
  "/banner-position/:id",
  validateRequest(ClientValidation.updateBannerPositionZodSchema),
  ClientHomeController.updateBannerPosition,
);

router.delete(
  "/banner-position/:id",
  ClientHomeController.deleteBannerPosition,
);

router.post(
  "/best-deal",
  multerUpload.single("file"),
  validateRequest(ClientValidation.bestDealZodSchema),
  ClientHomeController.createBestDeal,
);


router.patch(
  "/best-deal/:id",
  multerUpload.single("file"),
  validateRequest(ClientValidation.updateBestDealZodSchema),
  ClientHomeController.updateBestDeal,
);

router.delete("/best-deal/:id", ClientHomeController.deleteBestDeal);

// Nahid

router.get("/products", ClientHomeController.getProductsByType);

export const clientHome = router;
