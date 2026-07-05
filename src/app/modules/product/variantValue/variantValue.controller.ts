import  httpStatus  from 'http-status';

import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getIdParam } from "../../vendor/getIdParam";
import { VariantValueService } from "./variantValue.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await VariantValueService.createVariantValue(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Variant Value created successfully!",
    data: result,
  });
});

const getAll = catchAsync(async (_req: Request, res: Response) => {
  const result = await VariantValueService.getAllVariantValue();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Variant Values retrieved successfully!",
    data: result,
  });
});


const getSingle = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await VariantValueService.getSingleVariantValue(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Variant Value retrieved successfully!",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await VariantValueService.updateVariantValue(
    id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Variant value updated successfully!",
    data: result,
  });
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await VariantValueService.softDeleteVariantValue(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Variant value deleted successfully!",
    data: null,
  });
});

const restore = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await VariantValueService.restoreVariantValue(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Variant Value restored successfully!",
    data: null,
  });
});

const hardDelete = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await VariantValueService.hardDeleteVariantValue(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Variant Value permanently deleted!",
    data: null,
  });
});

export const VariantValueController = {
  create,
  getAll,
  getSingle,
  update,
  softDelete,
  restore,
  hardDelete,
};
