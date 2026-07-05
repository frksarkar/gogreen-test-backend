import { z } from "zod";

const createCouponZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  code: z.string().min(3).max(20),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  amount: z.number().min(0),
  minSpend: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

const createPromotionZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  name: z.string().min(3),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountRate: z.number().min(0),
  startDate: z.string(),
  endDate: z.string(),
});

const updateCouponZodSchema = createCouponZodSchema.partial().omit({ storeId: true });
const updatePromotionZodSchema = createPromotionZodSchema.partial().omit({ storeId: true });

export const MarketingValidation = {
  createCouponZodSchema,
  updateCouponZodSchema,
  createPromotionZodSchema,
  updatePromotionZodSchema,
};
