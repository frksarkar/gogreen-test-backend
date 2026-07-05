import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { ShopController } from "./shop.controller";
import {
  createStoreZodSchema,
  updateStoreStatusZodSchema,
  updateStoreZodSchema,
} from "./shop.validation";
import { uploadVendorFiles } from "../../../config/vendorUpload";
import { auth } from "../../../middlewares/auth";
const router = Router();

router.get("/stores", ShopController.getAllStores);
router.post(
  "/store",
  auth(),
  uploadVendorFiles,
  validateRequest(createStoreZodSchema),
  ShopController.createStore,
);

router.get("/store/slug/:slug", ShopController.getStoreBySlug);
router.get("/store/:id", ShopController.getStoreById);

router.patch(
  "/store/:id",
  auth(),
  uploadVendorFiles,
  validateRequest(updateStoreZodSchema),
  ShopController.updateStore,
);

router.delete(
  "/store/:id",
  auth(),
  ShopController.deleteStore,
);

router.delete(
  "/store/hard/:id",
  auth(),
  ShopController.hardDeleteStore,
);

router.get(
  "/follows/all/:id",
  auth(),
  ShopController.getAllFollowsByStore,
);
router.get(
  "/follows/:id",
  auth(),
  ShopController.getFollowsByStore,
);
router.post(
  "/follow/:id",
  auth(),
  ShopController.followStore,
);
router.delete(
  "/unfollow/:id",
  auth(),
  ShopController.unfollowStore,
);

router.patch(
  "/store/:id/status",
  auth(),
  validateRequest(updateStoreStatusZodSchema),
  ShopController.updateStoreStatus,
);

export const ShopRouter = router;
