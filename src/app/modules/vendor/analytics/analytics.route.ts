import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

router.get("/overview", auth(), AnalyticsController.getVendorDashboardOverview);

router.get("/orders", auth(), AnalyticsController.getVendorOrderStats);

router.get("/revenue", auth(), AnalyticsController.getVendorRevenueStats);

router.get("/products", auth(), AnalyticsController.getVendorProductStats);

router.get("/customers", auth(), AnalyticsController.getVendorCustomerStats);

router.get("/marketing", auth(), AnalyticsController.getVendorMarketingStats);

router.get("/stores", auth(), AnalyticsController.getVendorStoreStats);

router.get("/finance", auth(), AnalyticsController.getVendorFinanceSummary);

router.get("/usage", auth(), AnalyticsController.getVendorUsage);
router.get(
  "/xp-history",
  auth(),
  AnalyticsController.getVendorExperienceHistory,
);
router.get("/performance", auth(), AnalyticsController.getVendorPerformance);
router.get("/snapshots", auth(), AnalyticsController.getVendorSnapshots);
router.get("/rewards", auth(), AnalyticsController.getVendorRankRewards);
router.get("/commission", auth(), AnalyticsController.getVendorCommission);
router.get("/activity-logs", auth(), AnalyticsController.getVendorActivityLogs);

export const AnalyticsRouter = router;
