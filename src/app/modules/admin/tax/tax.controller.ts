import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { TaxService } from "./tax.service";
import sendResponse from "../../../shared/sendResponse";

const createTax = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TaxService.createTax(req.body);
    sendResponse(res, {
      message: "Tax created successfully",
      data: result,
      statusCode: 201,
      success: true,
    });
  },
);
const getTax = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TaxService.getTax(req.params.id as string);
    sendResponse(res, {
      message: "Tax fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const updateTax = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TaxService.updateTax(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      message: "Tax updated successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const deleteTax = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TaxService.deleteTax(req.params.id as string);
    sendResponse(res, {
      message: "Tax deleted successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const getAllTax = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TaxService.getAllTax();
    sendResponse(res, {
      message: "Tax fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
export const TaxController = {
  createTax,
  getTax,
  updateTax,
  deleteTax,
  getAllTax,
};
