import { BannerPosition, StaticPage } from "@prisma/client";
import z from "zod";

const createStaticContentZodSchema = z.object({
  title: z.string(),
  description: z.string(),
  page: z.enum(StaticPage),
  sectionId: z.string(),
});

const createStaticContentSectionZodSchema = z.object({
  page: z.enum(StaticPage),
  section: z.string(),
});
const editStaticContentZodSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
);
const createNewBannerZodSchema = z.object({
  title: z.string(),
  isActive: z.boolean().optional(),
  position: z.enum(BannerPosition),
  order: z.number().positive().min(0),
  image_url: z.string(),
});
const createNewBlogZodSchema = z.object({
  title: z.string(),
  isActive: z.boolean().optional(),
  blog: z.json(),
  image_url: z.string(),
});
const updateBlogZodSchema = createNewBannerZodSchema.partial();
const editStaticContentSectionZodSchema =
  createStaticContentSectionZodSchema.partial();
export const staticContentZodSchema = {
  createStaticContentZodSchema,
  createStaticContentSectionZodSchema,
  editStaticContentZodSchema,
  editStaticContentSectionZodSchema,
  createNewBannerZodSchema,
  updateBlogZodSchema,
};
