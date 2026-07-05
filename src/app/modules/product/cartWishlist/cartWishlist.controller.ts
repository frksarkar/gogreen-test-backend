import httpStatus from "http-status";
import { Request, Response } from "express";
import { CartWishlistService } from "./cartWishlist.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getIdParam } from "../../vendor/getIdParam";
import { CartWishlistENUM } from "@prisma/client";
import ApiError from "../../../errors/ApiError";
import { JwtPayload } from "jsonwebtoken";
const isCart = (params: string): string => {
  return params === "CART" ? "Cart" : "Wishlists";
};
const createCartWishlist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as JwtPayload;
  const result = await CartWishlistService.createCartWishlist(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: `${isCart(req.body?.type)} created successfully!`,
    data: result,
  });
});

const getAllCartWishlists = catchAsync(async (req: Request, res: Response) => {
  const type = req.query.type as CartWishlistENUM;
  const { id } = req.user as JwtPayload;
  console.log(id);
  if (!type) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Type query is required (CART or WISHLIST)",
    );
  }
  if (!id) {
    throw new ApiError(httpStatus.NOT_FOUND, "User Id is required");
  }

  const result = await CartWishlistService.getAllCartWishlists(
    type,
    id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `${type} retrieved successfully!`,
    data: result,
  });
});

const getSingleCartWishlist = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CartWishlistService.getSingleCartWishlist(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `${isCart(result.type)} retrieved successfully!`,
      data: result,
    });
  },
);

const deleteCartWishlist = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtPayload;
  const { productId, type } = req.body;
  console.log(userId, productId, type);
  const result = await CartWishlistService.deleteCartWishlist(
    userId,
    productId,
    type,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Item deleted successfully!",
    data: null,
  });
});

const updateCartQuantity = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const quantity = req.body.quantity;
  const result = await CartWishlistService.updateCartQuantity(id, quantity);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Item updated successfully!",
    data: result,
  });
});
export const CartWishlistController = {
  createCartWishlist,
  getAllCartWishlists,
  getSingleCartWishlist,
  deleteCartWishlist,
  updateCartQuantity,
};
