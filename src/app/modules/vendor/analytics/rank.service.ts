import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";

const RANK_THRESHOLDS = [
  { name: "Bronze", xp: 0 },
  { name: "Silver", xp: 1000 },
  { name: "Gold", xp: 5000 },
  { name: "Platinum", xp: 20000 },
  { name: "Diamond", xp: 100000 },
];

const grantExperience = async (
  vendorId: string,
  amount: number,
  type: "SALE" | "REVIEW" | "MILESTONE",
  reason?: string,
) => {
  return await prisma.$transaction(async (tx) => {
    return await grantExperienceInternal(tx, vendorId, amount, type, reason);
  });
};

const grantExperienceInternal = async (
  tx: any,
  vendorId: string,
  amount: number,
  type: "SALE" | "REVIEW" | "MILESTONE",
  reason?: string,
) => {
  // 1. Update Vendor XP
  const vendor = await tx.vendor.update({
    where: { id: vendorId },
    data: { experience: { increment: amount } },
  });

  // 2. Record History
  await tx.vendorExperienceHistory.create({
    data: {
      vendorId,
      amount,
      type,
      reason,
    },
  });

  // 3. Check for Rank Upgrade
  await checkRankUpgrade(tx, vendor);

  return vendor;
};

const checkRankUpgrade = async (tx: any, vendor: any) => {
  const currentRank = vendor.rank;
  const currentXP = vendor.experience;

  let newRank = currentRank;
  for (const threshold of RANK_THRESHOLDS) {
    if (currentXP >= threshold.xp) {
      newRank = threshold.name;
    } else {
      break;
    }
  }

  if (newRank !== currentRank) {
    // 1. Update Rank
    await tx.vendor.update({
      where: { id: vendor.id },
      data: { rank: newRank },
    });

    // 2. Grant Reward Record
    await tx.vendorRankReward.create({
      data: {
        vendorId: vendor.id,
        rankName: newRank,
        benefit: `Promoted to ${newRank} rank!`,
      },
    });

    // 3. Log Activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: vendor.id,
        action: "RANK_UPGRADE",
        details: `Vendor promoted from ${currentRank} to ${newRank}`,
      },
    });
  }
};

export const RankService = {
  grantExperience,
  grantExperienceInternal,
  RANK_THRESHOLDS,
};
