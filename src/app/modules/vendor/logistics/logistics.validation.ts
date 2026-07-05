import { z } from "zod";

const createShippingRateZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  shippingMethod: z.string(),
  rate: z.number().min(0),
  minOrderAmount: z.number().optional(),
});

const createShippingTemplateZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  name: z.string(),
  type: z.enum([
    "FLAT_RATE",
    "FREE_SHIPPING",
    "WEIGHT_BASED",
    "ORDER_VALUE_BASED",
  ]),
  shippingRates: z.array(createShippingRateZodSchema).optional(),
});

const updateShippingTemplateZodSchema = createShippingTemplateZodSchema
  .partial()
  .omit({ storeId: true });

const updateShippingRateZodSchema = createShippingRateZodSchema
  .partial()
  .omit({ storeId: true });

export const LogisticsValidation = {
  createShippingRateZodSchema,
  updateShippingRateZodSchema,
  createShippingTemplateZodSchema,
  updateShippingTemplateZodSchema,
};
