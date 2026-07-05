import z from "zod";

const createReferralRewardZod = z.object({
  level: z.number().min(1),
  reward_type: z.string().min(1),
  reward_value: z.number().min(1),
  is_active: z.boolean().optional(),
});
const updateReferralRewardZod = createReferralRewardZod.partial();
export const ReferralRewardZodValidation = {
  createReferralRewardZod,
  updateReferralRewardZod,
};
