import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { userService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import pick from "../../shared/pick";

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await userService.getMe(id as string);
    sendResponse(res, {
      message: "User fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const createAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const address = req.body;
    const result = await userService.createAddress(id as string, address);
    sendResponse(res, {
      message: "Address created successfully",
      data: result,
      statusCode: 201,
      success: true,
    });
  },
);
const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    let userProfile,
      userAddress = null;

    if (req.body.address) {
      userAddress = req.body.address;
    }
    userProfile = {
      ...(req.body.profile && req.body.profile),
      ...(req.file?.path && { profile_photo: req.file.path }),
    };
    const result = await userService.updateUser(
      id as string,
      userProfile,
      userAddress,
    );
    sendResponse(res, {
      message: "User updated successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const getUserAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await userService.getUserAddress(id as string);
    sendResponse(res, {
      message: "User address fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);

const updateUserAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const addressId = req.params.id;
    const { id } = req.user as JwtPayload;
    const result = await userService.updateUserAddress(
      id as string,
      addressId as string,
      req.body,
    );
    sendResponse(res, {
      message: "User Updated Successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const deleteUserAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await userService.deleteUserAddress(id as string);
    sendResponse(res, {
      message: "User address fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const searchUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await userService.searchUser(req.query.search as string);
    sendResponse(res, {
      message: "User fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query, [
      "gender",
      "isVerified",
      "isActive",
      "searchTerm",
    ]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const result = await userService.getAllUsers(filters, options);
    sendResponse(res, {
      message: "User fetched successfully",
      data: result.data,
      statusCode: 200,
      success: true,
      meta: result.meta,
    });
  },
);
const softDeleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await userService.softDeleteUser(id as string);
    sendResponse(res, {
      message: "User deleted successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const restoreUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await userService.restoreUser(id as string);
    sendResponse(res, {
      message: "User restored successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const hardDeleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const result = await userService.hardDeleteUser(id as string);
    sendResponse(res, {
      message: "User deleted successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
const getUserById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await userService.getUserById(id as string);
    sendResponse(res, {
      message: "User fetched successfully",
      data: result,
      statusCode: 200,
      success: true,
    });
  },
);
export const userController = {
  getMe,
  createAddress,
  updateUser,
  getUserAddress,
  updateUserAddress,
  deleteUserAddress,
  searchUser,
  getAllUsers,
  softDeleteUser,
  restoreUser,
  hardDeleteUser,
  getUserById,
};
