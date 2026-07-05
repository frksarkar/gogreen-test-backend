import { Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { getIdParam } from "../vendor/getIdParam";
import { ClientHomeService } from "./client.service";

const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await ClientHomeService.getCategories();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "categories retrieved successfully!",
    data: result,
  });
});
const getPopularProducts = async (_req: Request, res: Response) => {
  const result = await ClientHomeService.getPopularProducts(12);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Popular products retrieved successfully!",
    data: result,
  });
};
const requestFeatured = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || req.query.userId;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized User");
  }

  const result = await ClientHomeService.requestFeatured(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Featured request submitted successfully",
    data: result,
  });
});

const getAllRequestedFeatured = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClientHomeService.getAllRequestedFeatured();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Requested featured products retrieved successfully",
      data: result,
    });
  },
);
const approveFeatured = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || req.query.userId;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized User");
  }

  const { id } = req.params;

  const result = await ClientHomeService.approveFeatured(
    userId,
    id as string,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Featured product updated successfully",
    data: result,
  });
});

const getAllFeatured = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientHomeService.getAllFeatured();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Featured products retrieved successfully",
    data: result,
  });
});
const getTopSellingProducts = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ClientHomeService.getTopSellingProducts(12);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Top selling products retrieved successfully!",
      data: result,
    });
  },
);
const getTopVendors = catchAsync(async (_req: Request, res: Response) => {
  const result = await ClientHomeService.getTopVendors(10);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Top vendors retrieved successfully!",
    data: result,
  });
});
const createBanner = catchAsync(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    image: req.file?.path,
  };
  const result = await ClientHomeService.createBanner(payload);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Banner created successfully!",
    data: result,
  });
});
const getAllBanner = catchAsync(async (_req: Request, res: Response) => {
  const result = await ClientHomeService.getAllBanner();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Banners retrieved successfully!",
    data: result,
  });
});
const getDashboardBanner = catchAsync(async (req: Request, res: Response) => {
const positions = req.query.positions
    ? (req.query.positions as string).split(",")
    : undefined;

  const result = await ClientHomeService.getDashboardBanner(positions);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard banners retrieved successfully!",
    data: result,
  });
});
const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const payload = {
    ...req.body,
    image: req.file?.path,
  };
  const result = await ClientHomeService.updateBanner(id, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Banner updated successfully!",
    data: result,
  });
});
const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await ClientHomeService.deleteBanner(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Banner permanently deleted!",
    data: null,
  });
});
const createBannerPosition = catchAsync(async (req: Request, res: Response) => {
  const result = await ClientHomeService.createBannerPosition(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Banner position created successfully!",
    data: result,
  });
});

const getAllBannerPosition = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await ClientHomeService.getAllBannerPosition();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Banner positions retrieved successfully!",
      data: result,
    });
  },
);

const updateBannerPosition = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);

  const result = await ClientHomeService.updateBannerPosition(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Banner position updated successfully!",
    data: result,
  });
});

const deleteBannerPosition = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);

  await ClientHomeService.deleteBannerPosition(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Banner position deleted successfully!",
    data: null,
  });
});
const createBestDeal = catchAsync(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    image: req.file?.path,
  };

  const result = await ClientHomeService.createBestDeal(payload);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Best deal created successfully!",
    data: result,
  });
});

const getAllBestDeals = catchAsync(async (_req: Request, res: Response) => {
  const result = await ClientHomeService.getAllBestDeals();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Best deals retrieved successfully!",
    data: result,
  });
});

const updateBestDeal = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);

  const payload = {
    ...req.body,
    image: req.file?.path,
  };

  const result = await ClientHomeService.updateBestDeal(id, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Best deal updated successfully!",
    data: result,
  });
});

const deleteBestDeal = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);

  await ClientHomeService.deleteBestDeal(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Best deal deleted successfully!",
    data: null,
  });
});

type ProductType = "POPULAR" | "TRENDING" | "BEST_SELLERS" | "TOP_RATED";

const getProductsByType = async (req: Request, res: Response) => {
  const { productType, limit } = req.query;
  const result = await ClientHomeService.getProductsByType(
    (productType as ProductType) || "POPULAR",
    Number(limit) || 20,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Products retrieved successfully!",
    data: result,
  });
};

export const ClientHomeController = {
  getCategories,
  getPopularProducts,
  requestFeatured,
  getAllRequestedFeatured,
  approveFeatured,
  getAllFeatured,
  getTopSellingProducts,
  getTopVendors,
  createBanner,
  getAllBanner,
  getDashboardBanner,
  updateBanner,
  deleteBanner,
  createBannerPosition,
  getAllBannerPosition,
  updateBannerPosition,
  deleteBannerPosition,
  createBestDeal,
  getAllBestDeals,
  updateBestDeal,
  deleteBestDeal,

  // nahid
  getProductsByType,
};
