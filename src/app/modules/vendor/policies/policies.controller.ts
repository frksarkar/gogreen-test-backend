import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PoliciesService } from "./policies.service";

const createVendorPolicy = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await PoliciesService.createVendorPolicy(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Policy created successfully",
    data: result,
  });
});

const updateVendorPolicy = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await PoliciesService.updateVendorPolicy(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Policy updated successfully",
    data: result,
  });
});

const deleteVendorPolicy = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await PoliciesService.deleteVendorPolicy(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Policy deleted successfully",
    data: result,
  });
});

const hardDeleteVendorPolicy = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await PoliciesService.deleteVendorPolicy(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Policy permanently deleted",
    data: result,
  });
});

const getStorePolicies = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const storeId = req.params.id as string;
  const result = await PoliciesService.getStorePolicies(userId as string, storeId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store policies fetched successfully",
    data: result,
  });
});

const getPolicyById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await PoliciesService.getPolicyById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Policy details fetched successfully",
    data: result,
  });
});

export const PoliciesController = {
  createVendorPolicy,
  updateVendorPolicy,
  deleteVendorPolicy,
  hardDeleteVendorPolicy,
  getStorePolicies,
  getPolicyById,
};