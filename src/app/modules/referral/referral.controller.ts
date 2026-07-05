import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { referralService } from "./referral.service";
import sendResponse from "../../shared/sendResponse";
import { JwtPayload } from "jsonwebtoken";

const myReferral = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await referralService.myReferral(id as string);
    sendResponse(res, {
      message: "Referral fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const maxReferralLevel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await referralService.maxReferralLevel(req.body.level);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Referral Level set successfully!",
      data: result,
    });
  },
);
const getMaxReferralLevel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await referralService.getMaxReferralLevel();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Referral Level fetched successfully!",
      data: result,
    });
  },
);
const createNewReferralReward = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await referralService.createANewReferralReward(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Referral Reward created successfully!",
      data: result,
    });
  },
);
const getReferralRewardById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await referralService.getReferralRewardById(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Referral Reward fetched successfully!",
      data: result,
    });
  },
);
const getAllCreatedReferralRewards = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await referralService.getAllCreatedReferralRewards();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Referral Rewards fetched successfully!",
      data: result,
    });
  },
);
const updateAReferralReward = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await referralService.updateAReferralReward(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Referral Reward updated successfully!",
      data: result,
    });
  },
);
const deleteReferralReward = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await referralService.deleteReferralReward(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Referral Reward deleted successfully!",
      data: result,
    });
  },
);
export const referralController = {
  myReferral,
  maxReferralLevel,
  getMaxReferralLevel,
  createNewReferralReward,
  getReferralRewardById,
  getAllCreatedReferralRewards,
  updateAReferralReward,
  deleteReferralReward,
};
