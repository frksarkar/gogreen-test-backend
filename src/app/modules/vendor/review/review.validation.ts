import { z } from "zod";

export const createVendorReviewZodSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const updateVendorReviewZodSchema = createVendorReviewZodSchema.partial();