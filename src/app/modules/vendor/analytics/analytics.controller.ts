import { Request, Response } from "express";
import ApiError from "../../../errors/ApiError";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getVendorDashboardOverview = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const result = await AnalyticsService.getVendorDashboardOverview(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Dashboard overview fetched",
      data: result,
    });
  },
);

type Period = "7d" | "1m" | "3m" | "6m" | "12m" | "all_time";

const getVendorOrderStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const period =
    (req.query.period as "7d" | "1m" | "3m" | "6m" | "12m" | "all_time") ||
    "1m";
  const storeId = req.query.storeId as string | undefined;
  const result = await AnalyticsService.getVendorOrderStats(
    userId,
    period,
    storeId,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order stats fetched",
    data: result,
  });
});

const getVendorRevenueStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const period =
      (req.query.period as "7d" | "1m" | "3m" | "6m" | "12m" | "all_time") ||
      "1m";
    const result = await AnalyticsService.getVendorRevenueStats(userId, period);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Revenue stats fetched",
      data: result,
    });
  },
);

const getVendorProductStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const storeId = req.query.storeId as string | undefined;
    const result = await AnalyticsService.getVendorProductStats(
      userId,
      storeId,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Product stats fetched",
      data: result,
    });
  },
);

const getVendorCustomerStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const storeId = req.query.storeId as string | undefined;
    const result = await AnalyticsService.getVendorCustomerStats(
      userId,
      storeId,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Customer & follower stats fetched",
      data: result,
    });
  },
);

const getVendorMarketingStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const storeId = req.query.storeId as string | undefined;
    const result = await AnalyticsService.getVendorMarketingStats(
      userId,
      storeId,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Marketing stats fetched",
      data: result,
    });
  },
);

const getVendorStoreStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const result = await AnalyticsService.getVendorStoreStats(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store stats fetched",
    data: result,
  });
});

const getVendorFinanceSummary = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const result = await AnalyticsService.getVendorFinanceSummary(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Finance summary fetched",
      data: result,
    });
  },
);

const getVendorPerformance = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const storeId = req.query.storeId as string;
  if (!storeId) {
    throw new ApiError(400, "storeId query parameter is required");
  }
  const result = await AnalyticsService.getVendorPerformance(userId, storeId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Performance analytics fetched",
    data: result,
  });
});

const getVendorExperienceHistory = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const result = await AnalyticsService.getVendorExperienceHistory(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "XP history fetched",
      data: result,
    });
  },
);

const getVendorSnapshots = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const result = await AnalyticsService.getVendorSnapshots(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Snapshots fetched",
    data: result,
  });
});

const getVendorUsage = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const result = await AnalyticsService.getVendorUsage(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Usage stats fetched",
    data: result,
  });
});

const getVendorActivityLogs = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any).id;
    const storeId = req.query.storeId as string | undefined;
    const result = await AnalyticsService.getVendorActivityLogs(
      userId,
      storeId,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Activity logs fetched",
      data: result,
    });
  },
);

const getVendorRankRewards = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const result = await AnalyticsService.getVendorRankRewards(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rank rewards fetched",
    data: result,
  });
});

const getVendorCommission = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const result = await AnalyticsService.getVendorCommission(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Commission details fetched",
    data: result,
  });
});

export const AnalyticsController = {
  getVendorDashboardOverview,
  getVendorOrderStats,
  getVendorRevenueStats,
  getVendorProductStats,
  getVendorCustomerStats,
  getVendorMarketingStats,
  getVendorStoreStats,
  getVendorFinanceSummary,
  getVendorPerformance,
  getVendorExperienceHistory,
  getVendorSnapshots,
  getVendorUsage,
  getVendorActivityLogs,
  getVendorRankRewards,
  getVendorCommission,
};
