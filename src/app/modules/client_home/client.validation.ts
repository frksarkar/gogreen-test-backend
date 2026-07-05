import { z } from "zod";

const uuid = z.uuid();

const requestFeaturedZodSchema = z.object({
  productId: uuid,
  vendorId: uuid,
  storeId: uuid,
});

const approveFeaturedZodSchema = z.object({
  isApproved: z.boolean(),
});

const bannerTypeZodSchema = z.object({
 positionId: uuid,
  alt: z.string().optional(),
  status: z.string().optional(),
})
const updateBannerTypeZodSchema = bannerTypeZodSchema.optional();

const bannerPositionZodSchema = z.object({
  position: z.string(),
  page: z.string(),
  price: z.number(),
  type: z.string(),
});

const updateBannerPositionZodSchema = bannerPositionZodSchema.partial();

const bestDealZodSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  link: z.string().optional(),
});

const updateBestDealZodSchema = bestDealZodSchema.partial();

export const ClientValidation = {
  requestFeaturedZodSchema,
  approveFeaturedZodSchema,
  bannerTypeZodSchema,
  updateBannerTypeZodSchema,
  bannerPositionZodSchema,
  updateBannerPositionZodSchema,
  bestDealZodSchema,
  updateBestDealZodSchema,
};