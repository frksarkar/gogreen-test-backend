import { Request, Response } from "express";
import httpStatus from "http-status";
import { SearchService } from "./search.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const search = catchAsync(async (req: Request, res: Response) => {
  const { query, limit } = req.body;
  const userId = (req.user as any)?.id;

  const response = await SearchService.search(query, userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search completed successfully",
    meta: {
      query,
      mode: response.mode,
      extractedFilters: response.extractedFilters,
      totalCount: response.totalCount,
      isFallback: response.isFallback,
      ...(response.debugInfo ? { debugInfo: response.debugInfo } : {}),
    },
    data: response.results,
  });
});

const getLogs = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await SearchService.getSearchLogs(page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search logs fetched successfully",
    meta: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
    },
    data: result.logs,
  });
});

export const SearchController = {
  search,
  getLogs,
};
