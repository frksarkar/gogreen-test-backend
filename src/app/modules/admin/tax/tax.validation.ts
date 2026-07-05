import z from "zod";

const createTaxZodSchema = z.object({
  name: z.string().min(1).max(255),
  rate: z.float64().min(10).max(50),
});
const updateTaxZodSchema = createTaxZodSchema.partial();

export const TaxZodSchema = {
  createTaxZodSchema,
  updateTaxZodSchema,
};
