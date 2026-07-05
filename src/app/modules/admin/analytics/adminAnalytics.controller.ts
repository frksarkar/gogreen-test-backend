import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AdminAnalyticsService } from "./adminAnalytics.service";

const getAdminOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminAnalyticsService.getAdminOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin overview fetched",
    data: result,
  });
});

const getAdminVendorStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminAnalyticsService.getAdminVendorStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendor stats fetched",
    data: result,
  });
});

const getAdminOrderStats = catchAsync(async (req: Request, res: Response) => {
  const period =
    (req.query.period as "daily" | "weekly" | "monthly" | "yearly") ||
    "monthly";
  const result = await AdminAnalyticsService.getAdminOrderStats(period);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order stats fetched",
    data: result,
  });
});

const getAdminFinanceStats = catchAsync(async (req: Request, res: Response) => {
  const period =
    (req.query.period as "daily" | "weekly" | "monthly" | "yearly") ||
    "monthly";
  const result = await AdminAnalyticsService.getAdminFinanceStats(period);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Finance stats fetched",
    data: result,
  });
});

const getAdminTopVendors = catchAsync(async (req: Request, res: Response) => {
  const sortBy =
    (req.query.sortBy as "revenue" | "orders" | "rating") || "revenue";
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const result = await AdminAnalyticsService.getAdminTopVendors(sortBy, limit);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Top selling vendors fetched",
    data: result,
  });
});

const getAdminStoreStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminAnalyticsService.getAdminStoreStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store stats fetched",
    data: result,
  });
});

const getAdminRegistrationTrend = catchAsync(
  async (req: Request, res: Response) => {
    const period =
      (req.query.period as "daily" | "weekly" | "monthly" | "yearly") ||
      "monthly";
    const result =
      await AdminAnalyticsService.getAdminRegistrationTrend(period);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `${period || "monthly"} Registration trend fetched`,
      data: result,
    });
  },
);

export const AdminAnalyticsController = {
  getAdminOverview,
  getAdminVendorStats,
  getAdminOrderStats,
  getAdminFinanceStats,
  getAdminTopVendors,
  getAdminStoreStats,
  getAdminRegistrationTrend,

  getAdminRevenueStats: catchAsync(async (req: Request, res: Response) => {
    const period =
      (req.query.period as "daily" | "weekly" | "monthly" | "yearly") ||
      "monthly";
    const result = await AdminAnalyticsService.getAdminRevenueStats(period);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin revenue stats fetched",
      data: result,
    });
  }),

  getAdminProductStats: catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminAnalyticsService.getAdminProductStats();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin product stats fetched",
      data: result,
    });
  }),

  getAdminCustomerStats: catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminAnalyticsService.getAdminCustomerStats();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin customer stats fetched",
      data: result,
    });
  }),

  getAdminMarketingStats: catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminAnalyticsService.getAdminMarketingStats();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin marketing stats fetched",
      data: result,
    });
  }),

  getAdminUsageStats: catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminAnalyticsService.getAdminUsageStats();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin usage stats fetched",
      data: result,
    });
  }),

  getAdminPerformanceStats: catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminAnalyticsService.getAdminPerformanceStats();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin performance stats fetched",
      data: result,
    });
  }),

  getAdminCommissionStats: catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminAnalyticsService.getAdminCommissionStats();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin commission stats fetched",
      data: result,
    });
  }),

  getAdminActivityLogs: catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminAnalyticsService.getAdminActivityLogs();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin activity logs fetched",
      data: result,
    });
  }),
};
