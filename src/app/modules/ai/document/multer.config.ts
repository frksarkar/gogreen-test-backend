import multer from "multer";
import { NextFunction, Request, Response } from "express";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";

// Multer memory storage configuration for AI documents
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed."));
    }
  },
});

// Custom Multer Error Handler Middleware
export const handleMulterError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(httpStatus.BAD_REQUEST, "File is too large. Max size is 10MB."));
    }
    
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new ApiError(
        httpStatus.BAD_REQUEST, 
        "Unexpected field. Please use 'document' for the file upload."
      ));
    }

    return next(new ApiError(httpStatus.BAD_REQUEST, `Upload error: ${err.message}`));
  }

  if (err) {
    return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
  }

  next();
};
