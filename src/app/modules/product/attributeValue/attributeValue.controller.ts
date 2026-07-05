import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AttributeValueService } from "./attributeValue.service";
import httpStatus from "http-status";
import { getIdParam } from "../../vendor/getIdParam";

const createValue = catchAsync(async (req: Request, res: Response) => {
  const result = await AttributeValueService.createValue(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Attribute value created successfully!",
    data: result,
  });
});

const getAllValues = catchAsync(async (_req: Request, res: Response) => {
  const result = await AttributeValueService.getAllValues();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute values retrieved successfully!",
    data: result,
  });
});

const getSingleValue = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await AttributeValueService.getSingleValue(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute value retrieved successfully!",
    data: result,
  });
});

const updateValue = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await AttributeValueService.updateValue(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute value updated successfully!",
    data: result,
  });
});

const softDeleteValue = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await AttributeValueService.softDeleteValue(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute value deleted successfully!",
    data: null,
  });
});

const restoreValue = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await AttributeValueService.restoreValue(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute value restored successfully!",
    data: null,
  });
});

const hardDeleteAttributeValue = catchAsync(
  async (req: Request, res: Response) => {
    const id = getIdParam(req);
    await AttributeValueService.hardDeleteAttributeValue(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Attribute Value permanently deleted!",
      data: null,
    });
  },
);

export const AttributeValueController = {
  createValue,
  getAllValues,
  getSingleValue,
  updateValue,
  softDeleteValue,
  restoreValue,
  hardDeleteAttributeValue,
};
