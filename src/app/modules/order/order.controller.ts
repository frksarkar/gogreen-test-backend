import { OrderStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { OrderService } from "./order.service";

const createOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await OrderService.createOrder({ userId: id, ...req.body });
    sendResponse(res, {
      statusCode: 200,
      message: "Order Created",
      data: result,
      success: true,
    });
  },
);

const updateVendorOrderStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await OrderService.updateVendorOrderStatus(
      req.params.id as string,
      req.body.status as OrderStatus,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Order Updated",
      data: result,
      success: true,
    });
  },
);

const getAllUserOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await OrderService.getAllUserOrders(id);
    sendResponse(res, {
      statusCode: 200,
      message: "Orders Retrieved",
      data: result.data,
      meta: result.meta,
      success: true,
    });
  },
);

const getOrderById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await OrderService.userOrderById(id as string);
    sendResponse(res, {
      statusCode: 200,
      message: "Order Retrieved",
      data: result,
      success: true,
    });
  },
);

const getAllAStoreOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await OrderService.getAllStoreOrders(id as string);
    sendResponse(res, {
      statusCode: 200,
      message: "Orders Retrieved",
      data: result,
      success: true,
    });
  },
);

const getAllVendorOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { vendorId } = req.params;
    const result = await OrderService.getAllVendorOrders(vendorId as string);
    sendResponse(res, {
      statusCode: 200,
      message: "Orders Retrieved",
      data: result,
      success: true,
    });
  },
);

const getOrderDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await OrderService.getOrderDetails(req.params.id as string);
    sendResponse(res, {
      data: result,
      statusCode: 200,
      message: "Order Details Retrieved",
      success: true,
    });
  },
);

const getAllAdminOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await OrderService.getAllAdminOrders();
    sendResponse(res, {
      statusCode: 200,
      message: "Orders Retrieved",
      data: result,
      success: true,
    });
  },
);

export const OrderController = {
  createOrder,
  updateVendorOrderStatus,
  getAllUserOrders,
  getAllVendorOrders,
  getOrderById,
  getAllAStoreOrders,
  getOrderDetails,
  getAllAdminOrders,
};
