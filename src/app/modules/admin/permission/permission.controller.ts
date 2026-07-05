import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PermissionsService } from "./permission.service";
import pick from "../../../shared/pick";

const getPermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query, ["deleted", "type"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await PermissionsService.getPermissions(filters, options);
    sendResponse(res, {
      success: true,
      message: "Permissions fetched successfully!",
      data: result.data,
      meta: result.meta,
      statusCode: 201,
    });
  },
);
const createPermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await PermissionsService.createPermission(req.body);
    sendResponse(res, {
      success: true,
      message: "Permission created successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const createPermissionCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description } = req.body;
    const result = await PermissionsService.createPermissionCategory(
      name,
      description,
    );
    sendResponse(res, {
      success: true,
      message: "Permission Category created successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getPermissionById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const type = req.query.type;
    const result = await PermissionsService.getPermissionById(
      id as string,
      type as string,
    );
    sendResponse(res, {
      success: true,
      message: "Permission retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const addPermissionsToCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId, permissions } = req.body;
    const result = await PermissionsService.addPermissionsToCategory(
      permissions,
      categoryId,
    );
    sendResponse(res, {
      success: true,
      message: "Permission added to category successfully!",
      data: result,
      statusCode: 201,
    });
  },
);

const removePermissionsFromCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId, permissions } = req.body;
    const result = await PermissionsService.removePermissionsFromCategory(
      categoryId,
      permissions,
    );
    sendResponse(res, {
      success: true,
      message: "Permission removed from category successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const updatePermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await PermissionsService.updatePermission(
      id as string,
      req.body,
    );
    sendResponse(res, {
      success: true,
      message: "Permission updated successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const softDeletePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ids } = req.body;
    const type = req.query.type;
    const result = await PermissionsService.softDeletePermissions(
      ids,
      type as string,
    );
    sendResponse(res, {
      success: true,
      message: "Permission deleted successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const restorePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const ids = req.body.ids;
    const type = req.query.type;
    const result = await PermissionsService.restorePermissions(
      ids as string[],
      type as string,
    );
    sendResponse(res, {
      success: true,
      message: "Permissions restored successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const hardDeletePermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ids } = req.body;
    const type = req.query.type;
    const result = await PermissionsService.hardDeletePermission(
      ids as string[],
      type as string,
    );
    sendResponse(res, {
      success: true,
      message: "Permission deleted successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
export const PermissionsController = {
  createPermission,
  getPermissions,
  createPermissionCategory,
  addPermissionsToCategory,
  removePermissionsFromCategory,
  updatePermission,
  getPermissionById,
  softDeletePermissions,
  restorePermissions,
  hardDeletePermissions,
};
