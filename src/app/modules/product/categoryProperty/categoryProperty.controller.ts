import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CategoryPropertyService } from "./categoryProperty.service";
import { getIdParam } from "../../vendor/getIdParam";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryPropertyService.createCategoryProperty(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Category attribute created successfully!",
    data: result,
  });
});

const getAll = catchAsync(async (_req: Request, res: Response) => {
  const result = await CategoryPropertyService.getAllCategoryProperties();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category attributes retrieved successfully!",
    data: result,
  });
});

const getByPropertyType = (type: "ATTRIBUTE" | "VARIANT") =>
  catchAsync(async (_req: Request, res: Response) => {
    const result =
      await CategoryPropertyService.getCategoryPropertiesByType(type);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: `Category ${type.toLowerCase()} properties retrieved successfully!`,
      data: result,
    });
  });

const getSingle = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await CategoryPropertyService.getSingleCategoryProperty(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category attribute retrieved successfully!",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await CategoryPropertyService.updateCategoryProperty(
    id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category attribute updated successfully!",
    data: result,
  });
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await CategoryPropertyService.softDeleteCategoryProperty(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category attribute deleted successfully!",
    data: null,
  });
});

const restore = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await CategoryPropertyService.restoreCategoryProperty(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category attribute restored successfully!",
    data: null,
  });
});

const hardDelete = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await CategoryPropertyService.hardDeleteCategoryProperty(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category attribute permanently deleted!",
    data: null,
  });
});

export const CategoryPropertyController = {
  create,
  getAll,
  getSingle,
  update,
  softDelete,
  restore,
  hardDelete,
  getAttributeProperties: getByPropertyType("ATTRIBUTE"),
  getVariantProperties: getByPropertyType("VARIANT"),
};
