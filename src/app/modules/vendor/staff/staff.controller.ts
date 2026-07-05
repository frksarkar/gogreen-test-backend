import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StaffService } from "./staff.service";

const addVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { storeId, email, role } = req.body;
  const result = await StaffService.addVendorStaff(userId as string, storeId as string, email as string, role as any);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Staff added successfully",
    data: result,
  });
});

const getVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const storeId = req.query.storeId as string;
  const result = await StaffService.getVendorStaff(userId as string, storeId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff list fetched successfully",
    data: result,
  });
});

const getStaffById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await StaffService.getStaffById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff member details fetched successfully",
    data: result,
  });
});

const updateVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await StaffService.updateVendorStaff(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff member updated successfully",
    data: result,
  });
});

const removeVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await StaffService.removeVendorStaff(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff member removed successfully",
    data: result,
  });
});

const hardRemoveVendorStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await StaffService.removeVendorStaff(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff member permanently removed",
    data: result,
  });
});

export const StaffController = {
  addVendorStaff,
  getVendorStaff,
  getStaffById,
  updateVendorStaff,
  removeVendorStaff,
  hardRemoveVendorStaff,
};
