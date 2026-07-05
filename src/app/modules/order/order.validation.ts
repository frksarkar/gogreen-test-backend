import z from "zod";
const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
const createOrderZodSchema = z.object({
  orderItem: z.array(
    z.object({
      variantId: z.string(),
      productId: z.string(),
      quantity: z.number(),
      storeId: z.string(),
      shippingCost: z.int().positive(),
    }),
  ),
  customerNote: z.string(),
  address: z.string(),
  paymentProvider: z.enum(["SSLCOMMERZ", "BKASH", "COD", "NAGAD"]),
  name: z.string(),
  phone: z.string().regex(bdPhoneRegex, { error: "Invalid phone number" }),
});
export const OrderZodSchema = {
  createOrderZodSchema,
};
