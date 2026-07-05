import { Campaign } from "@prisma/client";

interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export const isCampaignEligible = (
  campaign: Campaign,
  orderAmount?: number,
): EligibilityResult => {
  const now = new Date();

  // 1. Check if soft-deleted
  if (campaign.deletedAt !== null) {
    return { eligible: false, reason: "Campaign has been deleted" };
  }

  // 2. Check if manually deactivated
  if (!campaign.isActive) {
    return { eligible: false, reason: "Campaign is not active" };
  }

  // 3. Check if campaign has started
  if (now < campaign.startDate) {
    return { eligible: false, reason: "Campaign has not started yet" };
  }

  // 4. Check if campaign has expired
  if (now > campaign.endDate) {
    return { eligible: false, reason: "Campaign has expired" };
  }

  // 5. Check usage limit
  if (
    campaign.maxUsageCount !== null &&
    campaign.currentUsageCount >= campaign.maxUsageCount
  ) {
    return { eligible: false, reason: "Campaign usage limit has been reached" };
  }

  // 6. Check minimum order amount (if provided)
  if (campaign.minOrderAmount !== null && orderAmount !== undefined) {
    if (orderAmount < Number(campaign.minOrderAmount)) {
      return {
        eligible: false,
        reason: `Order amount must be at least ${campaign.minOrderAmount}`,
      };
    }
  }

  return { eligible: true };
};
