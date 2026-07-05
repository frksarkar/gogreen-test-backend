import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import httpStatus from "http-status";

const MAX_LEVEL = 5;
const myReferral = async (id: string) => {
  const userExists = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }
  const result = await prisma.referredUsers.findMany({
    where: {
      referral_user: id,
    },
    include: {
      referral: {
        select: {
          name: true,
          email: true,
        },
      },
      referred: {
        select: {
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });
  if (!result.length) return null;
  return {
    referralUser: result[0].referral,
    referredUsers: result.map((r) => r.referred),
  };
};
const maxReferralLevel = async (level: number) => {
  await prisma.$transaction(async (tnx) => {
    const config = await tnx.referralConfig.findMany({});
    if (!config.length)
      return await tnx.referralConfig.create({ data: { max_level: level } });
    if (config && config[0].id)
      return await tnx.referralConfig.update({
        where: {
          id: config[0].id,
        },
        data: {
          max_level: level,
        },
      });
  });
};
const getMaxReferralLevel = async () => {
  const config = await prisma.referralConfig.findMany({});
  return config;
};
const createANewReferralReward = async (payload: any) => {
  const { level } = payload;

  // max max allowed level
  const config = await prisma.referralConfig.findMany({});
  let maxLevel;
  if (!config.length) {
    maxLevel = MAX_LEVEL;
  } else {
    maxLevel = config[0].max_level;
  }
  if (level > maxLevel)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Max allowed level is ${maxLevel}`,
    );
  const allLevels = await prisma.referralRewards.findMany({
    select: { level: true },
  });
  if (allLevels.length !== 0) {
    const currentLevels = allLevels.map(({ level }) => level);
    // check for duplicate level
    if (currentLevels.includes(level))
      throw new ApiError(
        httpStatus.FOUND,
        `Referral Reward for this level already exists`,
      );
    // check for levelGap

    // const levelGap = Math.max(...currentLevels, level) === level;
    const levelGap = currentLevels[currentLevels.length - 1] + 1 < level;
    if (levelGap)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot create a level ${level} reward before creating a level ${level - 1} reward`,
      );
  }
  if (allLevels.length === 0) {
    if (level !== 1)
      throw new ApiError(httpStatus.BAD_REQUEST, "Level 1 is required");
  }
  return prisma.referralRewards.create({
    data: payload,
  });
};
const getReferralRewardById = async (id: string) => {
  const reward = await prisma.referralRewards.findUnique({
    where: {
      id,
    },
  });
  return reward;
};
const getAllCreatedReferralRewards = async () => {
  return await prisma.referralRewards.findMany({});
};
const updateAReferralReward = async (id: string, payload: any) => {
  const reward = await prisma.referralRewards.findUnique({
    where: {
      id,
    },
  });
  if (!reward)
    throw new ApiError(httpStatus.NOT_FOUND, "Referral Reward not found");
  if (payload.level) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot change your level");
  }
  return await prisma.referralRewards.update({
    where: {
      id,
    },
    data: payload,
  });
};
const deleteReferralReward = async (id: string) => {
  const reward = await prisma.referralRewards.findUnique({
    where: {
      id,
    },
  });
  if (!reward)
    throw new ApiError(httpStatus.NOT_FOUND, "Referral Reward not found");

  const getAllReferrals = await prisma.referralRewards.findMany({
    select: { level: true },
  });
  const currentLevels = getAllReferrals.map(({ level }) => level);
  const isLastLevel = Math.max(...currentLevels) === reward.level;
  if (!isLastLevel)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must delete the last level first",
    );
  return await prisma.referralRewards.delete({
    where: {
      id,
    },
  });
};
export const referralService = {
  myReferral,
  maxReferralLevel,
  getMaxReferralLevel,
  createANewReferralReward,
  getReferralRewardById,
  getAllCreatedReferralRewards,
  updateAReferralReward,
  deleteReferralReward,
};
