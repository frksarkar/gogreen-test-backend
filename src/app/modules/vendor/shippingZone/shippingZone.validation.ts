import z from "zod";

export const createShippingZoneZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  name: z.string(),
  type: z.string(),
  district: z.string().optional(),
  rate: z.number().min(0),
});

export const updateShippingZoneZodSchema = createShippingZoneZodSchema.partial().omit({ storeId: true });
