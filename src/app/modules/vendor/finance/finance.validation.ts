import { z } from "zod";

const createPayoutMethodZodSchema = z.object({
  methodType: z.string(),
  accountDetails: z.record(z.string(), z.any()),
  isDefault: z.boolean().optional(),
});

const requestPayoutZodSchema = z.object({
  amount: z.number().min(10),
  method: z.string(),
});

const updatePayoutStatusZodSchema = z.object({
  status: z.enum(["COMPLETED", "FAILED"] as [string, ...string[]]),
  failedReason: z.string().optional(),
});

const updatePayoutZodSchema = requestPayoutZodSchema.partial();

export const FinanceValidation = {
  createPayoutMethodZodSchema,
  requestPayoutZodSchema,
  updatePayoutStatusZodSchema,
  updatePayoutZodSchema,
};
