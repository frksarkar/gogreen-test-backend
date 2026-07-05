import { CartWishlistENUM } from "@prisma/client";
import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";

const createCartWishlist = async (userId: string, payload: any) => {
  const { item, type } = payload;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  if (!item || !Array.isArray(item) || item.length === 0) {
    throw new ApiError(400, "At least one item is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const results = await prisma.$transaction(async (tx: any) => {
    const createdItems: any[] = [];

    for (const singleItem of item) {
      const { productId, variantId, storeId, quantity } = singleItem;

      const product = await tx.product.findUnique({
        where: { id: productId, isDeleted: false },
      });

      if (!product) {
        throw new ApiError(404, `Product not found: ${productId}`);
      }

      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
        });

        if (!variant) {
          throw new ApiError(404, `Variant not found: ${variantId}`);
        }
      }
      if (storeId) {
        const store = await tx.store.findUnique({
          where: { id: storeId },
        });

        if (!store) {
          throw new ApiError(404, `Store not found: ${variantId}`);
        }
      }

      const existing = await tx.cartWishlist.findFirst({
        where: {
          userId,
          productId: singleItem.productId,
          variantId: singleItem.variantId,
          storeId: singleItem.storeId,
          type,
        },
      });
      if (existing) {
        continue;
      }

      const created = await tx.cartWishlist.create({
        data: {
          userId,
          productId,
          variantId,
          storeId,
          quantity,
          type,
        },
      });

      createdItems.push(created);
    }

    return createdItems;
  });

  return results;
};

const getAllCartWishlists = async (type: CartWishlistENUM, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return prisma.cartWishlist.findMany({
    where: { type, userId },
    select: {
      id: true,
      type: true,
      user: { select: { id: true } },
      quantity: true,
      product: { select: { id: true, name: true, productSlug: true } },
      storeId: true,
      variant: {
        select: {
          id: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          images: {
            select: {
              imageUrl: true,
              alt: true,
            },
          },
        },
      },
    },
  });
};

const getSingleCartWishlist = async (id: string) => {
  const item = await prisma.cartWishlist.findUnique({
    where: { id },
    select: {
      type: true,
      user: { select: { id: true } },
      product: { select: { id: true, name: true } },
      variant: {
        select: {
          id: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          images: {
            select: {
              imageUrl: true,
              alt: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    throw new ApiError(404, "Cart/Wishlist item not found");
  }

  return item;
};

const deleteCartWishlist = async (
  userId: string,
  productId: string,
  type: "CART" | "WISHLIST",
) => {
  const item = await prisma.cartWishlist.findUnique({
    where: {
      userId_productId_type: { userId, productId, type },
    },
  });

  if (!item) {
    throw new ApiError(404, "Cart/Wishlist item not found");
  }

  return prisma.cartWishlist.delete({
    where: { id: item.id },
  });
};

const updateCartQuantity = async (id: string, quantity: number) => {
  const item = await prisma.cartWishlist.update({
    where: {
      id,
    },
    data: {
      quantity,
    },
  });
  return item;
};
export const CartWishlistService = {
  createCartWishlist,
  getAllCartWishlists,
  getSingleCartWishlist,
  deleteCartWishlist,
  updateCartQuantity,
};
