import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ShippingZoneService } from "./shippingZone.service";


const addShippingZone = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await ShippingZoneService.addShippingZone(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Shipping zone added successfully",
    data: result,
  });
});

const getStoreShippingZones = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { storeId } = req.params;
  const result = await ShippingZoneService.getStoreShippingZones(userId as string, storeId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping zones fetched successfully",
    data: result,
  });
});


const updateShippingZone = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShippingZoneService.updateShippingZone(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping zone updated successfully",
    data: result,
  });
});

const deleteShippingZone = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShippingZoneService.deleteShippingZone(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping zone deleted successfully",
    data: result,
  });
});

const getShippingZoneById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShippingZoneService.getShippingZoneById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping zone details fetched successfully",
    data: result,
  });
});

const hardDeleteShippingZone = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ShippingZoneService.deleteShippingZone(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping zone permanently deleted",
    data: result,
  });
});


export const ShippingZoneController = {

  addShippingZone,
  getStoreShippingZones,
  getShippingZoneById,
  updateShippingZone,
  deleteShippingZone,
  hardDeleteShippingZone,

};
