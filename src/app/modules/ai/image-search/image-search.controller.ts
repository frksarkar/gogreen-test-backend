import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ImageSearchService } from "./image-search.service";
import ApiError from "../../../errors/ApiError";

const searchByImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product image is required");
  }

  const userId = (req.user as any)?.id;
  const imageBuffer = req.file.buffer;
  const mimeType = req.file.mimetype;
  const imageUrl = (req.file as any).path || (req.file as any).url;

  const result = await ImageSearchService.searchByImage(
    userId,
    imageBuffer,
    mimeType,
    imageUrl,
    req.query.limit ? parseInt(req.query.limit as string) : 10
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Image search completed successfully",
    meta: {
      total: result.totalCount,
      duration: result.searchDurationMs,
      mode: result.mode
    },
    data: result.results
  });
});

export const ImageSearchController = {
  searchByImage,
};
