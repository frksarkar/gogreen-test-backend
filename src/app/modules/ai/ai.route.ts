import express from "express";
import { AIController } from "./ai.controller";
import { abuseDetector, aiRateLimiter } from "./ai.middleware";
import { ChatController } from "./chat/chat.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { SearchController } from "./search/search.controller";
import { searchQuerySchema } from "./search/search.validation";
import { DocumentAIRoute } from "./document/document-ai.routes";
import { ImageSearchRoutes } from "./image-search/image-search.routes";

const router = express.Router();

router.get(
  "/test-connection",
  // auth("Admin", "Vendor", "Customer"),
  AIController.testConnection,
);

router.post(
  "/chat",
  // auth("Admin", "Vendor", "Customer"),
  abuseDetector,
  aiRateLimiter,
  ChatController.chat,
);

router.post(
  "/search",
  validateRequest(searchQuerySchema),
  aiRateLimiter,
  SearchController.search,
);

router.get("/search/logs", SearchController.getLogs);

router.use("/document", DocumentAIRoute);
router.use("/image-search", ImageSearchRoutes);

export const AIRoutes = router;
