import { z } from "zod";

const createOrUpdateCommissionZodSchema = z.object({
  commissionRate: z
    .number()
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100%"),
  isGlobal: z.boolean().optional().default(false),
});

const updateCommissionByAdminZodSchema = z.object({
  commissionRate: z
    .number()
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100%")
    .optional(),
  isGlobal: z.boolean().optional().default(false),
});

export const CommissionValidation = {
  createOrUpdateCommissionZodSchema,
  updateCommissionByAdminZodSchema,
};
