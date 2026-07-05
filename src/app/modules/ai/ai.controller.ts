import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AIService } from "./ai.service";

const testConnection = catchAsync(async (req: Request, res: Response) => {
  const result = await AIService.testAIConnection();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AI connection test completed",
    data: result,
  });
});

export const AIController = {
  testConnection,
};
