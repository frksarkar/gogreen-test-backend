import { Request, Response } from "express";
import { CategoryService } from "./category.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getIdParam } from "../../vendor/getIdParam";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    image: req.file?.path,
  };
  const result = await CategoryService.createCategory(payload);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Category created successfully!",
    data: result,
  });
});

const getAllCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Categories retrieved successfully!",
    data: result,
  });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await CategoryService.getSingleCategory(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category retrieved successfully!",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const payload = {
    ...req.body,
    image: req.file?.path,
  };
  const result = await CategoryService.updateCategory(id, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category updated successfully!",
    data: result,
  });
});

const softDeleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await CategoryService.softDeleteCategory(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category soft deleted successfully!",
    data: null,
  });
});

const restoreCategory = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await CategoryService.restoreCategory(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category restored successfully!",
    data: null,
  });
});

const hardDeleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await CategoryService.hardDeleteCategory(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category permanently deleted!",
    data: null,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  hardDeleteCategory,
};
