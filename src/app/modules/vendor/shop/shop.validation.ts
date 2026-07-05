import { z } from "zod";
import { updateVendorSocialZodSchema } from "../social/social.validation";

export const createStoreZodSchema = z.object({
  shopName: z.string(),
  shopDescription: z.string(),
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
  vat: z.string().optional(),
  taxId: z.string().optional(),
  shopLogo: z.string().optional(),
  shopBanner: z.string().optional(),
  slug: z.string(),
  social: updateVendorSocialZodSchema.optional(),
});

export const updateStoreZodSchema = z.object({
  shopName: z.string().optional(),
  shopDescription: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  vat: z.string().optional(),
  taxId: z.string().optional(),
  shopLogo: z.string().optional(),
  shopBanner: z.string().optional(),
  slug: z.string().optional(),
  social: updateVendorSocialZodSchema.optional(),
});

export const updateStoreStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"]),
});
