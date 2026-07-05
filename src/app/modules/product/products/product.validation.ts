import { ImplementAttributeType } from "@prisma/client";
import { z } from "zod";

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

const uuid = z.uuid();
const numberCoerce = z.coerce.number();

/* ------------------------------------------------ */
/* Discount */
/* ------------------------------------------------ */

const discountSchema = z.object({
  type: z.enum(["PERCENT", "FIXED"]),
  value: numberCoerce.min(0),
});

/* ------------------------------------------------ */
/* Image */
/* ------------------------------------------------ */

const imageSchema = z.object({
  imageUrl: z.url(),
  alt: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isMain: z.boolean().optional(),
});

/* ------------------------------------------------ */
/* STRICT ATTRIBUTE PAYLOAD */
/* ------------------------------------------------ */

const attributePayloadSchema = z
  .object({
    productAttributeId: uuid.optional(),
    attributeValueId: uuid.optional(),
    name: z.string().optional(),
    attributeValue: z.string().optional(),
    type: z.enum(ImplementAttributeType),
  })
  .superRefine((data, ctx) => {
    /* ================= SELECT ================= */
    if (data.type === "SELECT") {
      if (!data.productAttributeId) {
        ctx.addIssue({
          code: "custom",
          message: "productAttributeId is required for SELECT",
        });
      }

      if (!data.attributeValueId) {
        ctx.addIssue({
          code: "custom",
          message: "attributeValueId is required for SELECT",
        });
      }

      if (data.attributeValue) {
        ctx.addIssue({
          code: "custom",
          message: "attributeValue not allowed for SELECT",
        });
      }

      if (data.name) {
        ctx.addIssue({
          code: "custom",
          message: "name not allowed for SELECT",
        });
      }
    }

    /* ================= INPUT ================= */
    if (data.type === "INPUT") {
      const isCustom = !!data.name;

      /* ===== CUSTOM INPUT ===== */
      if (isCustom) {
        if (!data.attributeValue) {
          ctx.addIssue({
            code: "custom",
            message: "attributeValue required for custom INPUT",
          });
        }

        if (data.productAttributeId) {
          ctx.addIssue({
            code: "custom",
            message: "productAttributeId not allowed for custom INPUT",
          });
        }

        if (data.attributeValueId) {
          ctx.addIssue({
            code: "custom",
            message: "attributeValueId not allowed for custom INPUT",
          });
        }
      } else {
        /* ===== EXISTING INPUT ===== */
        if (!data.productAttributeId) {
          ctx.addIssue({
            code: "custom",
            message: "productAttributeId required for INPUT",
          });
        }

        if (!data.attributeValue) {
          ctx.addIssue({
            code: "custom",
            message: "attributeValue required for INPUT",
          });
        }

        if (data.attributeValueId) {
          ctx.addIssue({
            code: "custom",
            message: "attributeValueId not allowed for INPUT",
          });
        }
      }
    }
  });

/* ------------------------------------------------ */
/* Variant */
/* ------------------------------------------------ */

const variantSchema = z.object({
  mainVariantId:z.uuid().optional(),
  mainPrice: numberCoerce.min(0),
  salePrice: numberCoerce.optional(),
  stock: z.number().int().nonnegative().default(0),

  sku: z.string().min(1),
  barcode: z.string().optional(),
  isAvailable: z.boolean().optional(),
  mainVariant: attributePayloadSchema,
  values: z.array(attributePayloadSchema),

  discount: discountSchema.optional(),

  images: z.array(imageSchema).optional(),
});

/* ------------------------------------------------ */
/* CREATE PRODUCT */
/* ------------------------------------------------ */

export const createProductZodSchema = z.object({
  categoryId: uuid,
  vendorId: uuid.optional(),
  storeId: uuid, // required if vendorId is not provided -> naim

  name: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),

  status: z.enum(["IN_STOCK", "OUT_OF_STOCK"]),

  specifications: z.array(attributePayloadSchema).optional(),

  variants: z.array(variantSchema).optional(),
});

/* ------------------------------------------------ */
/* UPDATE PRODUCT */
/* ------------------------------------------------ */

export const updateProductZodSchema = createProductZodSchema.partial();

export const createReviewZodSchema = z.object({
  productId: uuid,

  review: z
    .string()
    .min(3, "Review must be at least 3 characters")
    .max(1000, "Review cannot exceed 1000 characters"),

  rating: z.coerce
    .number()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
});

/* ------------------------------------------------ */
/* Update Review */
/* ------------------------------------------------ */

export const updateReviewZodSchema = z
  .object({
    review: z
      .string()
      .min(3, "Review must be at least 3 characters")
      .max(2000, "Review cannot exceed 2000 characters")
      .optional(),

    rating: z.coerce
      .number()
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5")
      .optional(),
  })
  .refine((data) => data.review !== undefined || data.rating !== undefined, {
    message: "At least one field (review or rating) must be provided",
  });

/* ------------------------------------------------ */
/* Reply To Review */
/* ------------------------------------------------ */

export const replyReviewZodSchema = z.object({
  reply: z
    .string()
    .min(3, "Reply must be at least 3 characters")
    .max(1000, "Reply cannot exceed 1000 characters"),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
  createReviewZodSchema,
  updateReviewZodSchema,
  replyReviewZodSchema,
};
