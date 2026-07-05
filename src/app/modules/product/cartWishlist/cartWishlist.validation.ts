import { z } from "zod";

const createCartWishlistZodSchema = z.object({
  // Validates the top-level userId
  type: z.enum(["CART", "WISHLIST"]),

  // Validates the "item" array
  item: z
    .array(
      z.object({
        productId: z.uuid({ message: "Invalid product ID format" }),
        variantId: z.uuid({ message: "Invalid variant ID format" }),
        storeId: z.uuid({ message: "Invalid store ID format" }),
        quantity: z.number().min(1).optional(),
      }),
    )
    .min(1, "At least one item is required"),
});

const deleteCartWishlistZodSchema = z.object({
  productId: z.uuid({ message: "Invalid product ID format" }),
  type: z.enum(["CART", "WISHLIST"]),
});
export const cartWishlistZodValidation = {
  createCartWishlistZodSchema,
  deleteCartWishlistZodSchema,
};
