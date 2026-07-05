import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ShopService } from "./shop.service";

const createStore = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const files = req.files as any;

  if (files?.shopLogo?.[0]) {
    req.body.shopLogo = files.shopLogo[0].path;
  }
  if (files?.shopBanner?.[0]) {
    req.body.shopBanner = files.shopBanner[0].path;
  }

  const result = await ShopService.createStore(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Store created successfully",
    data: result,
  });
});

const getStoreById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.getStoreById(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store fetched successfully",
    data: result,
  });
});

const getStoreBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await ShopService.getStoreBySlug(slug as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store fetched successfully",
    data: result,
  });
});

const getAllStores = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.getAllStores();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stores fetched successfully",
    data: result,
  });
});

const updateStore = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const files = req.files as any;

  if (files?.shopLogo?.[0]) {
    req.body.shopLogo = files.shopLogo[0].path;
  }
  if (files?.shopBanner?.[0]) {
    req.body.shopBanner = files.shopBanner[0].path;
  }
  const result = await ShopService.updateStore(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store updated successfully",
    data: result,
  });
});

const deleteStore = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShopService.deleteStore(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store soft-deleted successfully",
    data: result,
  });
});

const hardDeleteStore = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShopService.deleteStore(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store permanently deleted",
    data: result,
  });
});

const followStore = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShopService.followStore(userId as string, id as string);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Shop followed successfully",
    data: result,
  });
});

const getAllFollowsByStore = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.getAllFollowsByStore(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shop all follow status fetched successfully",
    data: result,
  });
});

const getFollowsByStore = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShopService.getFollowsByStore(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shop follow status fetched successfully",
    data: result,
  });
});

const unfollowStore = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShopService.unfollowStore(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shop unfollowed successfully",
    data: result,
  });
});

const updateStoreStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.updateStoreStatus(id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store status updated successfully",
    data: result,
  });
});

export const ShopController = {
  createStore,
  getStoreById,
  getStoreBySlug,
  getAllStores,
  updateStore,
  deleteStore,
  hardDeleteStore,
  followStore,
  getFollowsByStore,
  getAllFollowsByStore,
  unfollowStore,
  updateStoreStatus,
};
