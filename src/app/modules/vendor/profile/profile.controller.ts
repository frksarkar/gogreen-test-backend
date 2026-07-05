import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ProfileService } from "./profile.service";

const createVendor = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const files = req.files as any;

  if (files?.tradeLicense?.[0]) {
    req.body.tradeLicense = files.tradeLicense[0].path;
  }
  if (files?.nidCopy?.[0]) {
    req.body.nidCopy = files.nidCopy[0].path;
  }

  const result = await ProfileService.createVendor(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Vendor application submitted successfully",
    data: result,
  });
});

const getMyVendorProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await ProfileService.getMyVendorProfile(userId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendor profile fetched successfully",
    data: result,
  });
});

const getAllVendors = catchAsync(async (req: Request, res: Response) => {
  const result = await ProfileService.getAllVendors();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendors fetched successfully",
    data: result,
  });
});

const getAllStoreByVendor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProfileService.getAllStoreByVendor(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stores fetched successfully",
    data: result,
  });
});

const updateVendorProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const files = req.files as any;

  if (files?.tradeLicense?.[0]) {
    req.body.tradeLicense = files.tradeLicense[0].path;
  }
  if (files?.nidCopy?.[0]) {
    req.body.nidCopy = files.nidCopy[0].path;
  }

  const result = await ProfileService.updateVendorProfile(userId as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendor profile updated successfully",
    data: result,
  });
});

const deleteVendor = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await ProfileService.deleteVendor(userId as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendor deleted successfully",
    data: result,
  });
});

const hardDeleteVendor = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await ProfileService.deleteVendor(userId as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendor permanently deleted",
    data: result,
  });
});

const updateVendorStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProfileService.updateVendorStatus(id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendor status updated successfully",
    data: result,
  });
});

export const ProfileController = {
  createVendor,
  getAllVendors,
  getAllStoreByVendor,
  getMyVendorProfile,
  updateVendorProfile,
  deleteVendor,
  hardDeleteVendor,
  updateVendorStatus,
};
