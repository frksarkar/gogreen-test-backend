import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { HolidayService } from "./holiday.service";

const createVendorHoliday = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const result = await HolidayService.createVendorHoliday(userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Holiday created successfully",
    data: result,
  });
});

const getStoreHolidays = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const storeId = req.query.storeId as string | undefined;
  const result = await HolidayService.getStoreHolidays(userId, storeId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Store holidays fetched successfully",
    data: result,
  });
});

const getHolidayById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;
  const result = await HolidayService.getHolidayById(userId, id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Holiday fetched successfully",
    data: result,
  });
});

const updateVendorHoliday = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;
  const result = await HolidayService.updateVendorHoliday(
    userId,
    id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Holiday updated successfully",
    data: result,
  });
});

const deleteVendorHoliday = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const { id } = req.params;
  const hardDelete = req.query.hardDelete === "true";
  const result = await HolidayService.deleteVendorHoliday(
    userId,
    id as string,
    hardDelete,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Holiday deleted successfully",
    data: result,
  });
});

const getActiveStoreHolidays = catchAsync(
  async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const result = await HolidayService.getActiveStoreHolidays(
      storeId as string,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Active store holidays fetched successfully",
      data: result,
    });
  },
);

export const HolidayController = {
  createVendorHoliday,
  getStoreHolidays,
  getHolidayById,
  updateVendorHoliday,
  deleteVendorHoliday,
  getActiveStoreHolidays,
};
