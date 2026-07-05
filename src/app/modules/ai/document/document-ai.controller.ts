import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { DocumentOCRService } from "./document-ocr.service";
import { FieldMapperService } from "./field-mapper.service";

const extract = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Document file required",
    });
  }

  const result = await DocumentOCRService.extractFromDocument(
    req.file.buffer,
    req.file.mimetype,
  );

  const quality = DocumentOCRService.validateQuality(result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Document extraction successful",
    meta: {
      acceptable: quality.isAcceptable,
      issues: quality.issues,
    },
    data: result,
  });
});

const extractAndMap = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Document file required",
    });
  }

  const { target } = req.body;

  const ocrResult = await DocumentOCRService.extractFromDocument(
    req.file.buffer,
    req.file.mimetype,
  );

  if (!ocrResult.success) {
    return res.status(httpStatus.OK).json({
      success: false,
      message: ocrResult.message || "Extraction failed",
      data: ocrResult,
    });
  }

  const mappedData = await FieldMapperService.getCompleteMappedData(
    ocrResult.extractedData,
  );

  let finalData: any = mappedData;
  if (target === "user") {
    finalData = mappedData.userFields;
  } else if (target === "vendor") {
    finalData = mappedData.vendorFields;
  } else if (target === "address") {
    finalData = mappedData.addressFields;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Document extraction and mapping successful",
    meta: {
      target: target || "all",
      documentType: ocrResult.documentType,
      confidence: ocrResult.confidence,
    },
    data: finalData,
  });
});

export const DocumentAIController = {
  extract,
  extractAndMap,
};
