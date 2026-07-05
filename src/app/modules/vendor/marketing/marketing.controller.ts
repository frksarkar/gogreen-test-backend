import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MarketingService } from "./marketing.service";

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await MarketingService.createCoupon(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Coupon created successfully",
    data: result,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.updateCoupon(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Coupon updated successfully",
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.deleteCoupon(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Coupon deleted successfully",
    data: result,
  });
});

const hardDeleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.deleteCoupon(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Coupon permanently deleted",
    data: result,
  });
});

const getStoreCoupons = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const storeId = req.params.id as string;
  const result = await MarketingService.getStoreCoupons(userId as string, storeId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store coupons fetched successfully",
    data: result,
  });
});

const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.getCouponById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Coupon details fetched successfully",
    data: result,
  });
});

const createPromotion = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await MarketingService.createPromotion(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Promotion created successfully",
    data: result,
  });
});

const updatePromotion = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.updatePromotion(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Promotion updated successfully",
    data: result,
  });
});

const deletePromotion = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.deletePromotion(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Promotion deleted successfully",
    data: result,
  });
});

const hardDeletePromotion = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.deletePromotion(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Promotion permanently deleted",
    data: result,
  });
});

const getStorePromotions = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const storeId = req.params.id as string;
  const result = await MarketingService.getStorePromotions(userId as string, storeId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store promotions fetched successfully",
    data: result,
  });
});

const getPromotionById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await MarketingService.getPromotionById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Promotion details fetched successfully",
    data: result,
  });
});

export const CouponController = {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  hardDeleteCoupon,
  getStoreCoupons,
  getCouponById,
};

export const PromotionController = {
  createPromotion,
  updatePromotion,
  deletePromotion,
  hardDeletePromotion,
  getStorePromotions,
  getPromotionById,
};
