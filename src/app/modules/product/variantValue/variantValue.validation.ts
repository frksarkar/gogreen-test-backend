import { z } from "zod";

const createVariantValueZodSchema = z.object({
  attributeId: z.uuid({
    message: "Invalid attribute ID format",
  }),

  variantId: z.uuid({
    message: "Invalid Variant ID format",
  }),
});

const updateVariantValueZodSchema = z
  .object({
    attributeId: z.uuid({ message: "Invalid attribute ID format" }).optional(),
    variantId: z.uuid({ message: "Invalid Variant ID format" }).optional(),
  })
  .strict();

export const variantValueZodValidation = {
  createVariantValueZodSchema,
  updateVariantValueZodSchema,
};