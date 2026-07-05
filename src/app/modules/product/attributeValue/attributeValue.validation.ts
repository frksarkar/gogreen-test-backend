import { z } from "zod";

const createAttributeValueZodSchema = z.object({
  attributeId: z.uuid({
    message: "Invalid attribute ID format",
  }),

  value: z
    .string()
    .trim()
    .min(1, { message: "Attribute value is required" })
    .min(3, { message: "Value must be at least 3 characters" }),
});

const updateAttributeValueZodSchema = z
  .object({
    attributeId: z
      .uuid({ message: "Invalid attribute ID format" })
      .optional(),

    value: z
      .string()
      .trim()
      .min(1, { message: "Attribute value cannot be empty" })
      .min(3, { message: "Value must be at least 3 characters" })
      .optional(),
  })
  .strict();

export const attributeValueZodValidation = {
  createAttributeValueZodSchema,
  updateAttributeValueZodSchema,
};
