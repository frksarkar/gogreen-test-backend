import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { EmployeeService } from "./employee.service";
import { generateJwtToken } from "../../../shared/generateJwtToken";
import config from "../../../config";
import { AuthTokens, setAuthCookie } from "../../../shared/setCookie";

const createNewEmployee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, roleId } = req.body;
    const adminId = req.params.id;
    const result = await EmployeeService.createNewEmployee(
      adminId as string,
      userId,
      roleId,
    );
    sendResponse(res, {
      message: "Employee created successfully",
      statusCode: 200,
      data: result,
      success: true,
    });
  },
);
const getAllEmployees = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await EmployeeService.getAllEmployees();
    sendResponse(res, {
      message: "Employee fetched successfully",
      statusCode: 200,
      data: result,
      success: true,
    });
  },
);
const deleteEmployee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await EmployeeService.deleteEmployee(id as string);
    sendResponse(res, {
      message: "Employee deleted successfully",
      statusCode: 200,
      data: result,
      success: true,
    });
  },
);
const loginEmployee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const employee = await EmployeeService.loginEmployee(
      email as string,
      password as string,
    );
    const accessToken = generateJwtToken(
      employee,
      config.jwt.access_secret,
      "1h",
    );
    const refreshToken = generateJwtToken(
      employee,
      config.jwt.refresh_secret,
      "30d",
    );
    const authTokens: AuthTokens = {
      accessToken,
      refreshToken,
    };
    setAuthCookie(res, authTokens);
    sendResponse(res, {
      message: "Login successful",
      data: employee,
      statusCode: 200,
      success: true,
    });
  },
);
const getEmployeeById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const employee = await EmployeeService.getEmployeeById(id as string);
    sendResponse(res, {
      message: "Employee fetched successfully",
      statusCode: 200,
      data: employee,
      success: true,
    });
  },
);
export const EmployeeController = {
  createNewEmployee,
  getAllEmployees,
  deleteEmployee,
  loginEmployee,
  getEmployeeById,
};
