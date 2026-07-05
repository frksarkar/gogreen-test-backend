import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ComplianceService } from "./compliance.service";

const uploadDocument = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const files = req.files as any;

  if (files?.fileUrl?.[0]) {
    req.body.fileUrl = files.fileUrl[0].path;
  }

  const result = await ComplianceService.uploadDocument(userId as string, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Document uploaded successfully",
    data: result,
  });
});

const getVendorDocuments = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await ComplianceService.getVendorDocuments(userId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Documents fetched successfully",
    data: result,
  });
});

const getDocumentById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ComplianceService.getDocumentById(userId, id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Document details fetched successfully",
    data: result,
  });
});

const deleteVendorDocument = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ComplianceService.deleteVendorDocument(userId as string, id as string, false);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Document deleted successfully",
    data: result,
  });
});

const updateVendorDocument = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const files = req.files as any;

  if (files?.fileUrl?.[0]) {
    req.body.fileUrl = files.fileUrl[0].path;
  }

  const result = await ComplianceService.updateVendorDocument(userId as string, id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Document updated successfully",
    data: result,
  });
});

const hardDeleteVendorDocument = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await ComplianceService.deleteVendorDocument(userId as string, id as string, true);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Document permanently deleted",
    data: result,
  });
});

// Admin Access
const getAllDocuments = catchAsync(async (req: Request, res: Response) => {
  const result = await ComplianceService.getAllDocuments();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All vendor documents fetched successfully",
    data: result,
  });
});

const updateDocumentStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ComplianceService.updateDocumentStatus(id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Document status updated successfully",
    data: result,
  });
});

export const ComplianceController = {
  uploadDocument,
  getVendorDocuments,
  getDocumentById,
  deleteVendorDocument,
  hardDeleteVendorDocument,
  updateVendorDocument,
  getAllDocuments,
  updateDocumentStatus,
};
