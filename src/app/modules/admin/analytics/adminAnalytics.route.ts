import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { AdminAnalyticsController } from "./adminAnalytics.controller";

const router = Router();
router.get("/overview", auth(), AdminAnalyticsController.getAdminOverview);

router.get("/vendors", auth(), AdminAnalyticsController.getAdminVendorStats);

router.get("/orders", auth(), AdminAnalyticsController.getAdminOrderStats);

router.get("/finance", auth(), AdminAnalyticsController.getAdminFinanceStats);

router.get("/top-vendors", auth(), AdminAnalyticsController.getAdminTopVendors);

router.get("/stores", auth(), AdminAnalyticsController.getAdminStoreStats);

router.get(
  "/registrations",
  auth(),
  AdminAnalyticsController.getAdminRegistrationTrend,
);

router.get("/revenue", auth(), AdminAnalyticsController.getAdminRevenueStats);

router.get("/products", auth(), AdminAnalyticsController.getAdminProductStats);

router.get(
  "/customers",
  auth(),
  AdminAnalyticsController.getAdminCustomerStats,
);

router.get(
  "/marketing",
  auth(),
  AdminAnalyticsController.getAdminMarketingStats,
);

router.get("/usage", auth(), AdminAnalyticsController.getAdminUsageStats);

router.get(
  "/performance",
  auth(),
  AdminAnalyticsController.getAdminPerformanceStats,
);

router.get(
  "/commission",
  auth(),
  AdminAnalyticsController.getAdminCommissionStats,
);

router.get(
  "/activity-logs",
  auth(),
  AdminAnalyticsController.getAdminActivityLogs,
);

export const AdminAnalyticsRouter = router;
