import { z } from "zod";

const createCategoryPropertyZodSchema = z.object({
  attributeId: z.uuid({
    message: "Invalid attribute ID format",
  }),

  categoryId: z.uuid({
    message: "Invalid category ID format",
  }),
});

const updateCategoryPropertyZodSchema = z
  .object({
    attributeId: z.uuid({ message: "Invalid attribute ID format" }).optional(),
    categoryId: z.uuid({ message: "Invalid category ID format" }).optional(),
  })
  .strict();

export const categoryPropertyZodValidation = {
  createCategoryPropertyZodSchema,
  updateCategoryPropertyZodSchema,
};