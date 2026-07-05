import  httpStatus  from 'http-status';
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AttributeService } from "./attribute.service";
import { getIdParam } from "../../vendor/getIdParam";

const createAttribute = catchAsync(async (req: Request, res: Response) => {
  const result = await AttributeService.createAttribute(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED ,
    message: "Attribute created successfully!",
    data: result,
  });
});

const getAllAttributes = catchAsync(async (_req: Request, res: Response) => {
  const result = await AttributeService.getAllAttributes();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attributes retrieved successfully!",
    data: result,
  });
});

const getSingleAttribute = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await AttributeService.getSingleAttribute(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute retrieved successfully!",
    data: result,
  });
});

const updateAttribute = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const result = await AttributeService.updateAttribute(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute updated successfully!",
    data: result,
  });
});

const softDeleteAttribute = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await AttributeService.softDeleteAttribute(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute deleted successfully!",
    data: null,
  });
});

const restoreAttribute = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await AttributeService.restoreAttribute(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute restored successfully!",
    data: null,
  });
});
const hardDeleteAttribute = catchAsync(async (req: Request, res: Response) => {
  const id = getIdParam(req);
  await AttributeService.hardDeleteAttribute(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Attribute permanently deleted!",
    data: null,
  });
});

export const AttributeController = {
  createAttribute,
  getAllAttributes,
  getSingleAttribute,
  updateAttribute,
  softDeleteAttribute,
  restoreAttribute,
  hardDeleteAttribute,
};
