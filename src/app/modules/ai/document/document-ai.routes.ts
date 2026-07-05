import express from "express";
import { upload, handleMulterError } from "./multer.config";
import { aiRateLimiter } from "../ai.middleware";
import { validateRequest } from "../../../middlewares/validateRequest";
import { documentExtractionSchema } from "./document.validation";
import { DocumentAIController } from "./document-ai.controller";

const router = express.Router();


// Basic extraction (OCR only)
router.post(
  "/extract",
  aiRateLimiter,
  upload.single("document"),
  handleMulterError,
  validateRequest(documentExtractionSchema),
  DocumentAIController.extract,
);

// Extraction and mapping to platform fields
router.post(
  "/extract-and-map",
  aiRateLimiter,
  upload.single("document"),
  handleMulterError,
  validateRequest(documentExtractionSchema),
  DocumentAIController.extractAndMap,
);

export const DocumentAIRoute = router;
