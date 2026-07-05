import httpStatus from "http-status";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import ApiError from "../../../errors/ApiError";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ProductService } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || req.query.userId; // naim
  const payload = req.body;
  const result = await ProductService.createProduct(payload);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Product created successfully",
    data: result,
  });
});

// Get All Products
const getAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ProductService.getAllProducts();

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Products retrieved successfully!",
      data: result,
    });
  },
);

// Created by nahid
const getVendorAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const vendorId = req.params.vendorId as string;
    const result = await ProductService.getVendorAllProducts(vendorId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Vendor Products retrieved successfully!",
      data: result,
    });
  },
);
// Created by nahid
const getVendorMostSoldProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const vendorId = req.params.vendorId as string;
    const result = await ProductService.getVendorMostSoldProducts(vendorId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Vendor Products retrieved successfully!",
      data: result,
    });
  },
);

// Get Single Product
const getSingleProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ProductService.getSingleProduct(
      req.params.id as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product retrieved successfully!",
      data: result,
    });
  },
);

// Get Single Product by slug
const getSingleProductBySlug = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ProductService.getSingleProductBySlug(
      req.params.slug as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product retrieved successfully!",
      data: result,
    });
  },
);

// Update Product
const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || req.query.userId;
  const { id } = req.params;

  const payload =
    typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;

  const result = await ProductService.updateProduct(id as string, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Product updated successfully!",
    data: result,
  });
});

// Soft Delete Product
const deleteProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.id || req.query.userId;
    const { id } = req.params;
    await ProductService.deleteProduct(userId, id as string);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product deleted successfully!",
      data: null,
    });
  },
);

const restoreProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProductService.restoreProduct(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product restored successfully",
    data: result,
  });
});

const hardDeleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await ProductService.hardDeleteProduct(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product permanently deleted successfully",
    data: null,
  });
});

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || req.query.userId;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized User");
  }

  const result = await ProductService.createReview(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: result,
  });
});

/* ===========================
   Update Review
=========================== */
const updateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || req.query.userId;
  const { reviewId } = req.params;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized User");
  }
  const result = await ProductService.updateReview(
    userId,
    reviewId as string,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review updated successfully",
    data: result,
  });
});

/* ===========================
   Delete Review
=========================== */
const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || req.query.userId;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized User");
  }
  const { reviewId } = req.params;

  await ProductService.deleteReview(userId, reviewId as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review deleted successfully",
    data: null,
  });
});

/* ===========================
   Reply to Review (Admin/Vendor)
=========================== */
const replyToReview = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req.user as any)?.id || req.query.adminId;
  console.log(adminId);
  const { reviewId } = req.params;
  const { reply } = req.body;

  const result = await ProductService.replyToReview(
    adminId,
    reviewId as string,
    reply,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reply added successfully",
    data: result,
  });
});

/* ===========================
   product restriction
=========================== */
const productRestrict = catchAsync(async (req: Request, res: Response) => {
  // const userId = (req.user as any)?.id || req.query.userId;
  const { id } = req.params;
  // if (!userId) {
  //   throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized User");
  // }
  const result = await ProductService.productRestrict(
    // userId,
    id as string,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product Disable successfully",
    data: result,
  });
});

const getVendorWiseReviews = catchAsync(async (req: Request, res: Response) => {
  const { vendorId } = req.params;
  const { type } = req.query;

  const result = await ProductService.getVendorWiseReviews(
    vendorId as string,
    type as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor reviews retrieved successfully",
    data: result,
  });
});

const getCheckoutProducts = catchAsync(async (req: Request, res: Response) => {
  const { productIds } = req.body;
  if (!productIds || !Array.isArray(productIds)) {
    throw new ApiError(400, "productIds must be an array");
  }
  const result = await ProductService.getCheckoutProducts(productIds);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Checkout products retrieved successfully",
    data: result,
  });
});

export const ProductController = {
  createProduct,

  //by nahid
  getVendorAllProducts,
  getVendorMostSoldProducts,

  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  hardDeleteProduct,
  createReview,
  updateReview,
  deleteReview,
  replyToReview,
  getSingleProductBySlug,
  productRestrict,
  getVendorWiseReviews,
  getCheckoutProducts,
};
