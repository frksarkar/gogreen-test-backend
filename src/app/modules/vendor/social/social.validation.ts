import { z } from "zod";

export const updateVendorSocialZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  twitter: z.string().url().optional(),
  youtube: z.string().url().optional(),
  website: z.string().url().optional(),
});