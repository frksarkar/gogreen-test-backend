import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { FinanceService } from "./finance.service";

const getVendorWallet = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await FinanceService.getVendorWallet(userId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wallet details fetched successfully",
    data: result,
  });
});

const requestPayout = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await FinanceService.requestPayout(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payout request submitted successfully",
    data: result,
  });
});

const getVendorPayouts = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await FinanceService.getVendorPayouts(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout history fetched successfully",
    data: result,
  });
});

const getPayoutById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.getPayoutById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout details fetched successfully",
    data: result,
  });
});

const deleteVendorPayout = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.deleteVendorPayout(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout record removed successfully",
    data: result,
  });
});

const hardDeleteVendorPayout = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.deleteVendorPayout(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout record permanently removed",
    data: result,
  });
});

const updateVendorPayout = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.updateVendorPayout(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout request updated successfully",
    data: result,
  });
});

const getVendorTransactions = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const storeId = req.query.storeId as string;
  const result = await FinanceService.getVendorTransactions(userId as string, storeId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transaction history fetched successfully",
    data: result,
  });
});

const addVendorPayoutMethod = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await FinanceService.addVendorPayoutMethod(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payout method added successfully",
    data: result,
  });
});

const getVendorPayoutMethods = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await FinanceService.getVendorPayoutMethods(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout methods fetched successfully",
    data: result,
  });
});

const getPayoutMethodById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.getPayoutMethodById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout method details fetched successfully",
    data: result,
  });
});

const updateVendorPayoutMethod = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.updateVendorPayoutMethod(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout method updated successfully",
    data: result,
  });
});

// Admin Access
const getAllPayouts = catchAsync(async (req: Request, res: Response) => {
  const result = await FinanceService.getAllPayouts();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All payout requests fetched successfully",
    data: result,
  });
});

const updatePayoutStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await FinanceService.updatePayoutStatus(id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout status updated successfully",
    data: result,
  });
});

const deleteVendorPayoutMethod = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.deleteVendorPayoutMethod(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout method removed successfully",
    data: result,
  });
});

const hardDeleteVendorPayoutMethod = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await FinanceService.deleteVendorPayoutMethod(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payout method permanently removed",
    data: result,
  });
});

export const FinanceController = {
  getVendorWallet,
  requestPayout,
  getVendorPayouts,
  getPayoutById,
  deleteVendorPayout,
  hardDeleteVendorPayout,
  updateVendorPayout,
  getVendorTransactions,
  addVendorPayoutMethod,
  getVendorPayoutMethods,
  getPayoutMethodById,
  updateVendorPayoutMethod,
  deleteVendorPayoutMethod,
  hardDeleteVendorPayoutMethod,
  getAllPayouts,
  updatePayoutStatus,
};
