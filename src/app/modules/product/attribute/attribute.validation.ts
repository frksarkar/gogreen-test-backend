import { AttributePropertyType } from "@prisma/client";
import { z } from "zod";
export const attributeTypeEnum = z.enum(["SELECT", "INPUT"]);
const createAttributeZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Attribute name is required" })
    .min(2, { message: "Name must be at least 2 characters" }),
  type: attributeTypeEnum,

  propertyType: z.enum(AttributePropertyType),
});

const updateAttributeZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Attribute name is required" })
    .min(2, { message: "Name must be at least 2 characters" })
    .optional(),
  type: attributeTypeEnum.optional(),

  propertyType: z.enum(AttributePropertyType).optional(),
});

export const attributeZodValidation = {
  createAttributeZodSchema,
  updateAttributeZodSchema,
};
