import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UsageService } from "./usage.service";
import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";

const getVendorUsageCounter = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ApiError(404, "Vendor not found");

    const result = await UsageService.getVendorUsageCounter(vendor.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vendor usage counter retrieved successfully",
      data: result,
    });
  },
);

const getVendorUsageLimit = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id;
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const result = await UsageService.getVendorUsageLimit(vendor.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Vendor usage limit retrieved successfully",
    data: result,
  });
});

const updateVendorUsageLimit = catchAsync(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId as string;
    const payload = req.body;
    const result = await UsageService.updateVendorUsageLimit(vendorId, payload);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vendor usage limit updated successfully",
      data: result,
    });
  },
);

const incrementVendorUsageCounter = catchAsync(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId as string;
    const payload = req.body;
    const result = await UsageService.incrementVendorUsageCounter(
      vendorId,
      payload,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vendor usage counter incremented successfully",
      data: result,
    });
  },
);

const getAllVendorUsageCounters = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UsageService.getAllVendorUsageCounters();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All vendor usage counters retrieved successfully",
      data: result,
    });
  },
);

const getAllVendorUsageLimits = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UsageService.getAllVendorUsageLimits();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All vendor usage limits retrieved successfully",
      data: result,
    });
  },
);

export const UsageController = {
  getVendorUsageCounter,
  getVendorUsageLimit,
  updateVendorUsageLimit,
  incrementVendorUsageCounter,
  getAllVendorUsageCounters,
  getAllVendorUsageLimits,
};
