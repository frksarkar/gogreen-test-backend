import z from "zod";

export const createVendorPolicyZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  type: z.string({ message: "Policy type is required" }),
  content: z.string({ message: "Policy content is required" }),
});

export const updateVendorPolicyZodSchema = createVendorPolicyZodSchema.partial().omit({ storeId: true });