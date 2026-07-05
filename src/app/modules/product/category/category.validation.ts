import { z } from "zod";

export const createCategoryZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Category name is required" })
    .min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().trim().optional(),
  image: z.string().optional(),
  parentId: z.uuid({ message: "Invalid parent ID format" }).optional(),
});

export const updateCategoryZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .optional(),
  description: z.string().trim().optional(),

  image: z.string().optional(),

  parentId: z.uuid({ message: "Invalid parent ID format" }).optional(),
});

export const categoryZodValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema
}