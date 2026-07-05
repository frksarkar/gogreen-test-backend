import { z } from "zod";

const updateUsageLimitZodSchema = z.object({
  maxProductCount: z.number().min(0).optional(),
  dailyOrderLimit: z.number().min(0).optional(),
  maxCategoryLimit: z.number().min(0).optional(),
  maxBrandLimit: z.number().min(0).optional(),
  maxStaffLimit: z.number().min(0).optional(),
});

const incrementUsageCounterZodSchema = z.object({
  orderProcessed: z.number().min(0).optional(),
  activeProductCount: z.number().min(0).optional(),
});

export const UsageValidation = {
  updateUsageLimitZodSchema,
  incrementUsageCounterZodSchema,
};
