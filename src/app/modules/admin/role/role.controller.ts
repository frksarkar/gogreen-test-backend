import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { RoleService } from "./role.service";
import pick from "../../../shared/pick";

const createRoleCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId, roleId } = req.body;
    const result = await RoleService.createRoleCategory(categoryId, roleId);
    sendResponse(res, {
      success: true,
      message: "Role category created successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const createNewRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await RoleService.createNewRole(req.body);
    sendResponse(res, {
      success: true,
      message: "Role created successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getAllRoles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query, ["deleted", "type"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const result = await RoleService.getAllRoles(filters, options);

    sendResponse(res, {
      success: true,
      message: "Role retrieved successfully!",
      data: result.data,
      meta: result.meta,
      statusCode: 201,
    });
  },
);
const assignRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, roleId, assignedBy } = req.body;
    const result = await RoleService.assignRole(
      email as string,
      roleId as string,
      assignedBy as string,
    );
    sendResponse(res, {
      success: true,
      message: "Role assigned successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const softDeleteRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await RoleService.softDeleteRole(id as string);
    sendResponse(res, {
      success: true,
      message: "Role deleted successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const restoreRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const ids = req.body.ids;
    const result = await RoleService.restoreRole(ids as string[]);
    sendResponse(res, {
      success: true,
      message: "Role restored successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const hardDeleteRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { type } = req.query;
    const result = await RoleService.hardDeleteRole(
      id as string,
      type as string,
    );
    sendResponse(res, {
      success: true,
      message: "Role deleted successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const deleteRoleCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await RoleService.deleteRoleCategory(id as string);
    sendResponse(res, {
      success: true,
      message: "Role category deleted successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const createNewRoleInheritance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { childRoleId, parentRoleId } = req.body;
    const result = await RoleService.createNewRoleInheritance(
      childRoleId as string,
      parentRoleId as string,
    );
    sendResponse(res, {
      success: true,
      message: "Role inheritance created successfully!",
      data: result,
      statusCode: 201,
    });
  },
);

const getRoleById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { type } = req.query;
    const result = await RoleService.getRoleById(id as string, type as string);
    sendResponse(res, {
      success: true,
      message: "Role retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const editRoleById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await RoleService.editRoleById(id as string, req.body);
    sendResponse(res, {
      success: true,
      message: "Role updated successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
export const RoleController = {
  createRoleCategory,
  createNewRole,
  getAllRoles,
  assignRole,
  softDeleteRole,
  restoreRole,
  hardDeleteRole,

  deleteRoleCategory,
  createNewRoleInheritance,
  getRoleById,
  editRoleById,
};
