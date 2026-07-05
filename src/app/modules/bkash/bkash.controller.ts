import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { BkashService } from "./bkash.service";
import sendResponse from "../../shared/sendResponse";
import ApiError from "../../errors/ApiError";
import config from "../../config";

const initiatePayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await BkashService.createPayment(req.body);
    sendResponse(res, {
      statusCode: 200,
      message: "Payment Success",
      data: result,
      success: true,
    });
  },
);
const bkashCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await BkashService.bkashCallBack(
      req.query as Record<string, string>,
    );
    if (result) {
      res.redirect(`${config.ssl.success_frontend_url}`);
    }
    sendResponse(res, {
      statusCode: 200,
      message: "Payment Success",
      data: result,
      success: true,
    });
  },
);
const queryPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { paymentID } = req.body;
    if (!paymentID) {
      res.redirect("/bkash/payment-failed");
    }
    const result = await BkashService.queryPayment(paymentID);
    sendResponse(res, {
      statusCode: 200,
      message: "Payment Success",
      data: result,
      success: true,
    });
  },
);
const searchPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { trxID } = req.body;
    if (!trxID) {
      throw new ApiError(400, "transaction id required");
    }
    const result = await BkashService.searchPayment(trxID);
    sendResponse(res, {
      statusCode: 200,
      message: "Payment Success",
      data: result,
      success: true,
    });
  },
);
const refundPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { paymentID, trxID, refundAmount, sku, reason } = req.body;
    if (!paymentID || !trxID || !refundAmount || !sku || !reason) {
      throw new ApiError(400, "Invalid request");
    }
    const result = await BkashService.refundPayment(
      paymentID,
      trxID,
      refundAmount,
      sku,
      reason,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Payment Success",
      data: result,
      success: true,
    });
  },
);
const refundStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { paymentID, trxID } = req.body;
    if (!paymentID || !trxID) {
      throw new ApiError(400, "Invalid request");
    }
    const result = await BkashService.refundStatus(paymentID, trxID);
    sendResponse(res, {
      statusCode: 200,
      message: "Payment Success",
      data: result,
      success: true,
    });
  },
);
export const BkashController = {
  initiatePayment,
  bkashCallback,
  queryPayment,
  searchPayment,
  refundPayment,
  refundStatus,
};
