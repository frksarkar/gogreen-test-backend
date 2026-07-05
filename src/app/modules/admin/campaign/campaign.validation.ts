import z from "zod";
import { Prisma } from "@prisma/client";

// ─── Enums ────────────────────────────────────────────────────────────────────
const DiscountType = z.enum(["PERCENT", "FIXED"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const positiveDecimal = (fieldName: string) =>
  z
    .number({ error: `${fieldName} is required` })
    .positive(`${fieldName} must be greater than 0`)
    .transform((val) => new Prisma.Decimal(val));

// ─── Create Schema ────────────────────────────────────────────────────────────
export const createCampaignSchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(100, "Name must not exceed 100 characters"),
    description: z.string().optional().nullable(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must not exceed 20 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code can only contain letters, numbers, hyphens, and underscores",
      )
      .optional()
      .nullable(),
    discountType: DiscountType,
    discount: positiveDecimal("Discount"),
    maxDiscountAmount: positiveDecimal("Max discount amount")
      .optional()
      .nullable(),
    minOrderAmount: positiveDecimal("Min order amount").optional().nullable(),
    isActive: z.boolean().default(true),
    startDate: z.coerce.date({ error: "Start date is required" }),
    endDate: z.coerce.date({ error: "End date is required" }),
    maxUsageCount: z
      .number()
      .int("Max usage count must be a whole number")
      .positive("Max usage count must be greater than 0")
      .max(10_000_000, "Max usage count is unreasonably large")
      .optional()
      .nullable(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((data) => data.startDate >= new Date(Date.now() - 60_000), {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  })
  .refine(
    (data) =>
      data.endDate.getTime() - data.startDate.getTime() >= 60 * 60 * 1000,
    {
      message: "Campaign must run for at least 1 hour",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => data.maxDiscountAmount == null || data.discountType === "PERCENT",
    {
      message:
        "Max discount amount is only applicable for PERCENT discount type",
      path: ["maxDiscountAmount"],
    },
  );

// ─── Update Schema ────────────────────────────────────────────────────────────
export const updateCampaignSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),
    description: z.string().optional().nullable(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must not exceed 20 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code can only contain letters, numbers, hyphens, and underscores",
      )
      .optional()
      .nullable(),
    discountType: DiscountType.optional(),
    discount: positiveDecimal("Discount").optional(),
    maxDiscountAmount: positiveDecimal("Max discount amount")
      .optional()
      .nullable(),
    minOrderAmount: positiveDecimal("Min order amount").optional().nullable(),
    isActive: z.boolean().optional(),
    // startDate update is blocked if the campaign has already started — enforce that in your service layer
    startDate: z.coerce
      .date()
      .refine((date) => date >= new Date(Date.now() - 60_000), {
        message: "Start date cannot be in the past",
      })
      .optional(),
    endDate: z.coerce
      .date()
      .refine((date) => date > new Date(), {
        message: "End date must be in the future",
      })
      .optional(),
    maxUsageCount: z
      .number()
      .int("Max usage count must be a whole number")
      .positive("Max usage count must be greater than 0")
      .max(10_000_000, "Max usage count is unreasonably large")
      .optional()
      .nullable(),
  })

  // Only validate date range when BOTH dates are provided in the payload
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate > data.startDate,
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )

  // Only validate min duration when BOTH dates are provided in the payload
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.endDate.getTime() - data.startDate.getTime() >= 60 * 60 * 1000,
    {
      message: "Campaign must run for at least 1 hour",
      path: ["endDate"],
    },
  )

  // maxDiscountAmount is only valid with PERCENT — but we only know discountType
  // if it's in the payload. Handle both cases:
  // Case A: both are in the payload → enforce directly
  // Case B: only maxDiscountAmount is in the payload → can't fully enforce here,
  //         fetch existing campaign in service layer and re-check
  .refine(
    (data) =>
      !data.maxDiscountAmount ||
      !data.discountType ||
      data.discountType === "PERCENT",
    {
      message:
        "Max discount amount is only applicable for PERCENT discount type",
      path: ["maxDiscountAmount"],
    },
  )

  // Reject empty payloads — no point hitting the DB with nothing to update
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });

// ─── Inferred types ───────────────────────────────────────────────────────────
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const CampaignZodSchema = {
  createCampaignSchema,
  updateCampaignSchema,
};
