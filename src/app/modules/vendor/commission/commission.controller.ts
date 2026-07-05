import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CommissionService } from "./commission.service";

const getVendorCommission = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id;
  const result = await CommissionService.getVendorCommission(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Commission details fetched successfully",
    data: result,
  });
});

const createOrUpdateVendorCommission = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;
    const result = await CommissionService.createOrUpdateVendorCommission(
      userId,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Commission updated successfully",
      data: result,
    });
  },
);

const deleteVendorCommission = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;
    const result = await CommissionService.deleteVendorCommission(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Commission deleted successfully",
      data: result,
    });
  },
);

// Admin controllers
const getAllVendorCommissions = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CommissionService.getAllVendorCommissions();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All vendor commissions fetched successfully",
      data: result,
    });
  },
);

const getVendorCommissionById = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const result = await CommissionService.getVendorCommissionById(
      vendorId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vendor commission fetched successfully",
      data: result,
    });
  },
);

const updateVendorCommissionByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const result = await CommissionService.updateVendorCommissionByAdmin(
      vendorId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vendor commission updated successfully",
      data: result,
    });
  },
);

const deleteVendorCommissionByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const result = await CommissionService.deleteVendorCommissionByAdmin(
      vendorId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vendor commission deleted successfully",
      data: result,
    });
  },
);

export const CommissionController = {
  getVendorCommission,
  createOrUpdateVendorCommission,
  deleteVendorCommission,
  getAllVendorCommissions,
  getVendorCommissionById,
  updateVendorCommissionByAdmin,
  deleteVendorCommissionByAdmin,
};
