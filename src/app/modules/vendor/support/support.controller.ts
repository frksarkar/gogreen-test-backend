import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SupportService } from "./support.service";

const createTicket = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await SupportService.createTicket(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Support ticket created successfully",
    data: result,
  });
});

const getVendorTickets = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await SupportService.getVendorTickets(userId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Support tickets fetched successfully",
    data: result,
  });
});

const getVendorTicketById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await SupportService.getVendorTicketById(userId as string, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ticket details fetched successfully",
    data: result,
  });
});

// Admin Access
const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.getAllTickets();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All vendor tickets fetched successfully",
    data: result,
  });
});

const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SupportService.updateTicket(id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ticket status updated successfully",
    data: result,
  });
});

const updateVendorTicket = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await SupportService.updateVendorTicket(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Ticket details updated successfully",
    data: result,
  });
});

const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await SupportService.deleteTicket(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Support ticket removed successfully",
    data: result,
  });
});

const hardDeleteTicket = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await SupportService.deleteTicket(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Support ticket permanently removed",
    data: result,
  });
});

export const SupportController = {
  createTicket,
  getVendorTickets,
  getVendorTicketById,
  updateVendorTicket,
  deleteTicket,
  hardDeleteTicket,
  getAllTickets,
  updateTicket,
};
