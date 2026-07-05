import express from "express";
import { multerUpload } from "../../../config/multer.config";
import { aiRateLimiter } from "../ai.middleware";
import { ImageSearchController } from "./image-search.controller";

const router = express.Router();

router.post(
  "/",
  aiRateLimiter,
  multerUpload.single("image"),
  ImageSearchController.searchByImage
);

export const ImageSearchRoutes = router;
