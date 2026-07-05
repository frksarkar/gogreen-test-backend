import { Request, Response } from "express";
import httpStatus from "http-status";
import { RoleType } from "@prisma/client";
import catchAsync from "../../../shared/catchAsync";
import config from "../../../config";
import sendResponse from "../../../shared/sendResponse";
import { ChatService } from "./chat.service";

const chat = catchAsync(async (req: Request, res: Response) => {
  const { message } = req.body;
  const userId = (req.user as any)?.id || (req.query.userId as string);
  // const role = (req.user as any)?.role || req.query.role as RoleType;
  const role = "CUSTOMER" as RoleType;
  const mode = config.ai.mode;
  const result = await ChatService.processChat(userId, role, message, mode);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AI response generated successfully",
    data: result,
  });
});

export const ChatController = {
  chat,
};
