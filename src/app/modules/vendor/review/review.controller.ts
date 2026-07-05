import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { ReviewService } from "./review.service";

const createStoreReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ReviewService.createStoreReview(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review posted successfully",
    data: result,
  });
});

const getStoreReviews = catchAsync(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const result = await ReviewService.getStoreReviews(storeId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store reviews fetched successfully",
    data: result,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewService.getReviewById(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review details fetched successfully",
    data: result,
  });
});

const updateStoreReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ReviewService.updateStoreReview(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteStoreReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ReviewService.deleteStoreReview(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review removed successfully",
    data: result,
  });
});

const hardDeleteStoreReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ReviewService.deleteStoreReview(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review permanently removed",
    data: result,
  });
});

export const ReviewController = {
  createStoreReview,
  getStoreReviews,
  getReviewById,
  updateStoreReview,
  deleteStoreReview,
  hardDeleteStoreReview,
};