import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import httpStatus from "http-status";
const createCampaign = async (data: any) => {
  const campaign = await prisma.campaign.create({
    data,
  });
  return campaign;
};
const getCampaign = async (id: string) => {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id,
    },
  });
  if (!campaign)
    throw new ApiError(httpStatus.BAD_REQUEST, "Campaign not found");
  return campaign;
};
const updateCampaign = async (id: string, data: any) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });
  if (!campaign)
    throw new ApiError(httpStatus.BAD_REQUEST, "Campaign not found");
  return await prisma.campaign.update({
    where: {
      id,
    },
    data: {
      ...data,
    },
  });
};
const deleteCampaign = async (id: string) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });
  if (!campaign)
    throw new ApiError(httpStatus.BAD_REQUEST, "Campaign not found");
  return await prisma.campaign.delete({
    where: {
      id,
    },
  });
};
const getCampaigns = async () => {
  return await prisma.campaign.findMany({});
};
export const CampaignService = {
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaigns,
};
