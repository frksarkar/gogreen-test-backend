import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { CampaignService } from "./campaign.service";
import sendResponse from "../../../shared/sendResponse";

const createCampaign = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CampaignService.createCampaign(req.body);
    sendResponse(res, {
      success: true,
      message: "Campaign created successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getCampaign = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CampaignService.getCampaign(req.params.id as string);
    sendResponse(res, {
      success: true,
      message: "Campaign fetched successfully!",
      data: result,
      statusCode: 200,
    });
  },
);
const updateCampaign = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CampaignService.updateCampaign(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      success: true,
      message: "Campaign updated successfully!",
      data: result,
      statusCode: 200,
    });
  },
);
const deleteCampaign = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CampaignService.deleteCampaign(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      message: "Campaign deleted successfully!",
      data: result,
      statusCode: 200,
    });
  },
);
const getCampaigns = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CampaignService.getCampaigns();
    sendResponse(res, {
      success: true,
      message: "Campaigns fetched successfully!",
      data: result,
      statusCode: 200,
    });
  },
);
export const CampaignController = {
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaigns,
};
