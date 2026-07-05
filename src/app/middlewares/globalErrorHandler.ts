// import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../config";
import { deleteImgFromCloudinary } from "../config/cloudinary.config";
import { ZodError } from "zod";
import { handleZodError } from "../helper/handleZodError";
import { Prisma } from "@prisma/client";

const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode: number = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message: string = err.message || "Something went wrong!";
  let error: any = err;

  //delete cloudinary images on error
  if (req.file) {
    await deleteImgFromCloudinary(req.file.path);
  }
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    message = simplifiedError.message;
    statusCode = simplifiedError.statusCode as number;
    error = simplifiedError.errorSources;
  }

  // Handle known Prisma client errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P1000":
        message = "Authentication failed against the database server.";
        statusCode = httpStatus.BAD_GATEWAY;
        break;

      case "P1001":
        message = "Cannot reach the database server. Please check connection.";
        statusCode = httpStatus.BAD_GATEWAY;
        break;

      case "P1002":
        message = "The database operation timed out.";
        statusCode = httpStatus.REQUEST_TIMEOUT;
        break;

      case "P2000":
        message = "Value too long for a database column.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2001":
        message = "Record not found.";
        statusCode = httpStatus.NOT_FOUND;
        break;

      case "P2002":
        message = "Duplicate key error — unique constraint failed.";
        statusCode = httpStatus.CONFLICT;
        break;

      case "P2003":
        message = "Foreign key constraint failed.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2004":
        message = "Database constraint failed.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2005":
        message = "Invalid value stored in the database.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2006":
        message = "Invalid value type provided for the field.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2007":
        message = "Data validation error.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2008":
        message = "Query parsing failed.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2009":
        message = "Query validation failed.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2010":
        message = "Raw query failed. Check your query syntax.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2011":
        message = "Null constraint violation — missing required field.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2012":
        message = "Missing required value for a field.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2013":
        message = "Missing required argument for a field.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2014":
        message = "Relation violation between records.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2015":
        message = "Related record not found.";
        statusCode = httpStatus.NOT_FOUND;
        break;

      case "P2016":
        message = "Query interpretation error.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2017":
        message = "Record relation inconsistency.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2018":
        message = "Required connected record not found.";
        statusCode = httpStatus.NOT_FOUND;
        break;

      case "P2019":
        message = "Input error — invalid data.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2020":
        message = "Value out of range for the column type.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2021":
        message = "Table not found in the database.";
        statusCode = httpStatus.NOT_FOUND;
        break;

      case "P2022":
        message = "Column not found in the database table.";
        statusCode = httpStatus.NOT_FOUND;
        break;

      case "P2023":
        message = "Inconsistent column data — check your schema.";
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        break;

      case "P2024":
        message = "Transaction failed due to timeout or rollback.";
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        break;

      case "P2025":
        message = "Record to update/delete does not exist.";
        statusCode = httpStatus.NOT_FOUND;
        break;

      case "P2030":
        message = "Database file not found (SQLite specific).";
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        break;

      case "P2033":
        message = "Number out of range for field type.";
        statusCode = httpStatus.BAD_REQUEST;
        break;

      default:
        message = `Unexpected Prisma error (code: ${err.code}).`;
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        break;
    }

    error = err.meta || err.message;
  }

  // Prisma Validation Errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Validation error in Prisma operation.";
    error = err.message.split("\n");
    statusCode = httpStatus.BAD_REQUEST;
  }

  // Unknown Prisma Errors
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    message = "Unknown Prisma request error occurred.";
    error = err.message;
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }

  // Initialization or connection errors
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    message = "Failed to initialize Prisma client — check your DB connection.";
    error = err.message;
    statusCode = httpStatus.BAD_GATEWAY;
  }

  // Handle generic JavaScript errors
  else if (err instanceof Error) {
    message = err.message || "An unexpected error occurred.";
    error = err.stack;
  }

  //handle zod validation error
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    message = simplifiedError.message;
    statusCode = simplifiedError.statusCode as number;
    error = simplifiedError.errorSources;
  }

  // Send the response
  res.status(statusCode).json({
    success,
    message,
    error,
    stack: config.node_env === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
