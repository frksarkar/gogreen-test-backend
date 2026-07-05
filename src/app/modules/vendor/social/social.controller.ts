import catchAsync from "../../../shared/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import { SocialService } from "./social.service";

const updateVendorSocial = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await SocialService.updateVendorSocial(userId as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Social links updated successfully",
    data: result,
  });
});

const getStoreSocial = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SocialService.getStoreSocial(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store social links fetched successfully",
    data: result,
  });
});

const getSocialById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await SocialService.getSocialById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Social link details fetched successfully",
    data: result,
  });
});

const deleteVendorSocial = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id: storeId } = req.params;
  const result = await SocialService.deleteVendorSocial(userId as string, storeId as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Social links removed successfully",
    data: result,
  });
});

const hardDeleteVendorSocial = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id: storeId } = req.params;
  const result = await SocialService.deleteVendorSocial(userId as string, storeId as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Social links permanently removed",
    data: result,
  });
});

export const SocialController = {
  updateVendorSocial,
  getStoreSocial,
  getSocialById,
  deleteVendorSocial,
  hardDeleteVendorSocial,
};